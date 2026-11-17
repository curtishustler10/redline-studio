// Comments pinned on a page-image document (migration 0008). SERVER-ONLY.
//
// Same contract as saveClientDocument: the action is what matters. It is atomic
// in Postgres (apply_document_comment: the change and its event row together).
// The email to Curtis goes out after; a failed email is logged in email_log and
// the console but never turns a saved comment into an error.
//
// Every call is bounded to one document of the session's project: a comment id
// posted from the browser only reaches comments of that document.
import "server-only";
import { getDb } from "./db";
import { COMMENT_COLUMNS, type CommentAction, type DocumentComment, type NewComment } from "./document-comments";
import { notifyDocumentComment, type Delivery } from "./notifications";
import { clientLabel } from "./portal-brand";
import type { DocumentRow, ProjectRow } from "./projects";

function toComment(row: Record<string, unknown>): DocumentComment {
  return {
    id: Number(row.id),
    page: Number(row.page),
    x: Number(row.x),
    y: Number(row.y),
    label: String(row.label ?? ""),
    body: String(row.body),
    status: row.status === "resolved" ? "resolved" : "open",
    author: row.author === "admin" ? "admin" : "client",
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    deleted_at: row.deleted_at ? String(row.deleted_at) : null,
  };
}

/** Live comments of a document; the admin also asks for the deleted ones. */
export async function listComments(documentId: number, opts: { includeDeleted?: boolean } = {}): Promise<DocumentComment[]> {
  let q = getDb().from("project_document_comments").select(COMMENT_COLUMNS).eq("document_id", documentId);
  if (!opts.includeDeleted) q = q.is("deleted_at", null);
  const { data, error } = await q.order("page").order("created_at").order("id");
  if (error) throw new Error(`listComments: ${error.message}`);
  return ((data ?? []) as Record<string, unknown>[]).map(toComment);
}

export type CommentRequest =
  | { action: "add"; comment: NewComment }
  | { action: "edit"; id: number; body: string }
  | { action: "resolve" | "reopen" | "delete"; id: number };

export type CommentOutcome =
  | { ok: true; id: number; changed: boolean; mail: Delivery["status"] | "none" }
  | { ok: false; error: "not_found" | "limit" };

type RpcRow = {
  status: "ok" | "unchanged" | "not_found" | "limit";
  comment_id: number | null;
  event_id: number | null;
  page: number | null;
  label: string | null;
  body: string | null;
  previous_body: string | null;
  comment_status: string | null;
};

const ACTION_OF: Record<CommentRequest["action"], CommentAction> = {
  add: "added",
  edit: "edited",
  resolve: "resolved",
  reopen: "reopened",
  delete: "deleted",
};

/** A client action on a comment of `document`, then Curtis's email. */
export async function applyClientComment(args: { project: ProjectRow; document: DocumentRow; request: CommentRequest; now?: () => Date }): Promise<CommentOutcome> {
  const r = args.request;
  const params =
    r.action === "add"
      ? { p_document_id: args.document.id, p_action: "add", p_page: r.comment.page, p_x: r.comment.x, p_y: r.comment.y, p_label: r.comment.label, p_body: r.comment.body }
      : { p_document_id: args.document.id, p_action: r.action, p_comment_id: r.id, p_body: r.action === "edit" ? r.body : null };
  const { data, error } = await getDb().rpc("apply_document_comment", params);
  if (error) throw new Error(`apply_document_comment: ${error.message}`);
  const row = (Array.isArray(data) ? data[0] : data) as RpcRow | undefined;
  if (!row) throw new Error("apply_document_comment: no row returned");
  if (row.status === "not_found" || row.status === "limit") return { ok: false, error: row.status };
  const id = Number(row.comment_id);
  if (row.status === "unchanged" || row.event_id === null) return { ok: true, id, changed: false, mail: "none" };

  let mail: Delivery["status"] = "failed";
  try {
    const delivery = await notifyDocumentComment({
      projectId: args.project.id,
      projectSlug: args.project.slug,
      documentSlug: args.document.slug,
      eventId: Number(row.event_id),
      comment: {
        clientName: clientLabel(args.project.client_name, args.project.brand),
        documentTitle: args.document.title,
        action: ACTION_OF[r.action],
        page: Number(row.page),
        label: String(row.label ?? ""),
        before: r.action === "edit" ? String(row.previous_body ?? "") : r.action === "delete" ? String(row.body ?? "") : "",
        after: r.action === "delete" ? "" : String(row.body ?? ""),
        at: (args.now ?? (() => new Date()))(),
      },
    });
    mail = delivery.status;
  } catch (e) {
    // email_log itself unreachable: the comment is saved, say so in the logs and move on.
    console.error(`[portal] notification for comment event ${row.event_id} failed:`, e);
  }
  return { ok: true, id, changed: true, mail };
}
