// Client projects ("Mon projet"): lookups, the code check, the compare-and-set
// save and its notification. SERVER-ONLY (service-role client).
//
// Contract of saveClientDocument: the save is the thing that matters. It is
// atomic in Postgres (save_project_document: check updated_at, write, keep a
// revision). The email to Curtis goes out after, and a failed email is logged
// in email_log and the console but never turns a saved edit into an error.
import "server-only";
import { getDb } from "./db";
import { LOCKOUT_WINDOW_MS } from "./admin-auth";
import { codeStamp, normalizeCode, normalizePassword, verifyCode, verifyNothing, type PortalSession } from "./portal-auth";
import { diffContent, isPreviewsDocument, sameInstant, type Change, type DocContent, type UpdatedBy } from "./project-doc";
import { applyClientEdit, parseStoredContent, type EditError } from "./project-edit";
import { notifyProjectEdit, type Delivery } from "./notifications";
import type { EmailLogRow } from "./crm";

export type ProjectRow = {
  id: number;
  slug: string;
  client_name: string;
  title: string;
  code_prefix: string;
  access_code_hash: string;
  code_set_at: string;
  time_zone: string;
  created_at: string;
};

export type DocumentRow = {
  id: number;
  project_id: number;
  slug: string;
  title: string;
  content: DocContent;
  /** Kept as the exact string Postgres returned (microseconds): it is the optimistic-lock token. */
  updated_at: string;
  updated_by: UpdatedBy;
  created_at: string;
};

export type RevisionRow = { id: number; document_id: number; content: DocContent; updated_by: UpdatedBy; created_at: string };

function fail(op: string, error: { message: string }): never {
  throw new Error(`${op}: ${error.message}`);
}

function toDocument(row: Record<string, unknown>): DocumentRow {
  return { ...(row as DocumentRow), content: parseStoredContent(row.content) };
}

// ─── Reads ───────────────────────────────────────────────────────────────────

export async function getProjectBySlug(slug: string): Promise<ProjectRow | null> {
  const { data, error } = await getDb().from("client_projects").select().eq("slug", slug).maybeSingle();
  if (error) fail("getProjectBySlug", error);
  return (data as ProjectRow | null) ?? null;
}

export async function getProjectById(id: number): Promise<ProjectRow | null> {
  const { data, error } = await getDb().from("client_projects").select().eq("id", id).maybeSingle();
  if (error) fail("getProjectById", error);
  return (data as ProjectRow | null) ?? null;
}

export async function listProjects(): Promise<ProjectRow[]> {
  const { data, error } = await getDb().from("client_projects").select().order("created_at", { ascending: false });
  if (error) fail("listProjects", error);
  return (data ?? []) as ProjectRow[];
}

export async function listDocuments(projectId: number): Promise<DocumentRow[]> {
  const { data, error } = await getDb().from("project_documents").select().eq("project_id", projectId).order("created_at");
  if (error) fail("listDocuments", error);
  // A document this version cannot read (e.g. a newer kind written before this
  // deploy) is skipped and logged, so it never takes the whole page down.
  return (data ?? []).flatMap((row) => {
    try {
      return [toDocument(row)];
    } catch (e) {
      console.error(`listDocuments: skipping unreadable document ${String((row as { slug?: unknown }).slug)}`, e);
      return [];
    }
  });
}

export async function getDocument(projectId: number, slug: string): Promise<DocumentRow | null> {
  const { data, error } = await getDb().from("project_documents").select().eq("project_id", projectId).eq("slug", slug).maybeSingle();
  if (error) fail("getDocument", error);
  return data ? toDocument(data) : null;
}

export async function listRevisions(documentId: number, limit = 100): Promise<RevisionRow[]> {
  const { data, error } = await getDb()
    .from("project_document_revisions")
    .select()
    .eq("document_id", documentId)
    .order("id", { ascending: false })
    .limit(limit);
  if (error) fail("listRevisions", error);
  return (data ?? []).map((r) => ({ ...(r as RevisionRow), content: parseStoredContent((r as RevisionRow).content) }));
}

export async function getRevision(id: number): Promise<RevisionRow | null> {
  const { data, error } = await getDb().from("project_document_revisions").select().eq("id", id).maybeSingle();
  if (error) fail("getRevision", error);
  return data ? { ...(data as RevisionRow), content: parseStoredContent((data as RevisionRow).content) } : null;
}

export async function listProjectEmails(projectId: number, limit = 30): Promise<EmailLogRow[]> {
  const { data, error } = await getDb().from("email_log").select().eq("project_id", projectId).order("created_at", { ascending: false }).limit(limit);
  if (error) fail("listProjectEmails", error);
  return (data ?? []) as EmailLogRow[];
}

// ─── Access ──────────────────────────────────────────────────────────────────

/**
 * The project a typed code opens, or null. A generated code (AHK-XXXX-XXXX, forgiving on case
 * and dashes) is looked up by its prefix; anything else is tried as a chosen password, exact,
 * against every project (a handful of rows, behind the per-IP lockout).
 */
export async function findProjectByCode(input: string): Promise<ProjectRow | null> {
  const parsed = normalizeCode(input);
  if (parsed) {
    const { data, error } = await getDb().from("client_projects").select().eq("code_prefix", parsed.prefix);
    if (error) fail("findProjectByCode", error);
    for (const p of (data ?? []) as ProjectRow[]) if (await verifyCode(parsed.code, p.access_code_hash)) return p;
  }
  const password = normalizePassword(input);
  if (!password) return parsed ? null : verifyNothing("").then(() => null);
  const { data, error } = await getDb().from("client_projects").select();
  if (error) fail("findProjectByCode", error);
  for (const p of (data ?? []) as ProjectRow[]) if (await verifyCode(password, p.access_code_hash)) return p;
  return null;
}

/** The project a session cookie opens, if it still matches the project's current code. */
export async function projectForSession(session: PortalSession | null): Promise<ProjectRow | null> {
  if (!session) return null;
  const project = await getProjectById(session.projectId);
  if (!project || codeStamp(project.access_code_hash) !== session.stamp) return null;
  return project;
}

export async function recordPortalFailure(ip: string): Promise<void> {
  const { error } = await getDb().from("portal_login_attempts").insert({ ip: ip.slice(0, 100) });
  if (error) console.error(`recordPortalFailure: ${error.message}`);
}

/** Fails closed, unlike the admin: a database we cannot read is no reason to allow unlimited guesses. */
export async function recentPortalFailures(ip: string): Promise<Date[] | null> {
  const since = new Date(Date.now() - LOCKOUT_WINDOW_MS).toISOString();
  const { data, error } = await getDb().from("portal_login_attempts").select("at").eq("ip", ip).gte("at", since);
  if (error) {
    console.error(`recentPortalFailures: ${error.message}`);
    return null;
  }
  return (data ?? []).map((r) => new Date(String((r as { at: string }).at)));
}

export async function clearPortalFailures(ip: string): Promise<void> {
  const { error } = await getDb().from("portal_login_attempts").delete().eq("ip", ip);
  if (error) console.error(`clearPortalFailures: ${error.message}`);
}

// ─── Save ────────────────────────────────────────────────────────────────────

export type SaveResult =
  | { ok: true; updatedAt: string; revisionId: number | null; changes: Change[]; mail: Delivery["status"] | "none" }
  | { ok: false; error: EditError | "conflict" | "not_found"; currentUpdatedAt?: string };

type RpcRow = { status: "ok" | "conflict" | "not_found"; updated_at: string | null; revision_id: number | null; previous_content: unknown };

/** Compare-and-set in Postgres. Exported for the admin restore and the tests. */
export async function saveDocumentVersion(documentId: number, expectedUpdatedAt: string, content: DocContent, by: UpdatedBy): Promise<RpcRow> {
  const { data, error } = await getDb().rpc("save_project_document", {
    p_document_id: documentId,
    p_expected_updated_at: expectedUpdatedAt,
    p_content: content,
    p_updated_by: by,
  });
  if (error) fail("save_project_document", error);
  const row = (Array.isArray(data) ? data[0] : data) as RpcRow | undefined;
  if (!row) throw new Error("save_project_document: no row returned");
  return row;
}

/**
 * A client save: validate against the stored version, compare-and-set, then
 * notify Curtis with the diff. `baseUpdatedAt` is the updated_at the client's
 * page was loaded with; if anyone saved since, nothing is written ("conflict").
 * A save with no actual change writes nothing and sends nothing.
 */
export async function saveClientDocument(args: {
  project: ProjectRow;
  documentSlug: string;
  baseUpdatedAt: string;
  content: unknown;
  now?: () => Date;
}): Promise<SaveResult> {
  const doc = await getDocument(args.project.id, args.documentSlug);
  if (!doc) return { ok: false, error: "not_found" };
  if (!sameInstant(doc.updated_at, args.baseUpdatedAt)) return { ok: false, error: "conflict", currentUpdatedAt: doc.updated_at };

  const edit = applyClientEdit(doc.content, args.content);
  if (!edit.ok) return { ok: false, error: edit.error };
  if (diffContent(doc.content, edit.content).length === 0) {
    return { ok: true, updatedAt: doc.updated_at, revisionId: null, changes: [], mail: "none" };
  }

  // The read above is a fast path; this is the check that counts (row lock in Postgres).
  const saved = await saveDocumentVersion(doc.id, args.baseUpdatedAt, edit.content, "client");
  if (saved.status === "conflict") return { ok: false, error: "conflict", currentUpdatedAt: saved.updated_at ?? undefined };
  if (saved.status !== "ok" || !saved.updated_at || saved.revision_id === null) return { ok: false, error: "not_found" };

  // Diff against what was really replaced, read under the lock.
  const previous = parseStoredContent(saved.previous_content);
  const changes = diffContent(previous, edit.content);

  let mail: Delivery["status"] = "failed";
  try {
    const delivery = await notifyProjectEdit({
      projectId: args.project.id,
      projectSlug: args.project.slug,
      clientAnchor: isPreviewsDocument(edit.content) ? "apercus" : undefined,
      revisionId: saved.revision_id,
      edit: { clientName: args.project.client_name, documentTitle: doc.title, savedAt: (args.now ?? (() => new Date()))(), changes },
    });
    mail = delivery.status;
  } catch (e) {
    // email_log itself unreachable: the edit is saved, say so in the logs and move on.
    console.error(`[portal] notification for revision ${saved.revision_id} failed:`, e);
  }
  return { ok: true, updatedAt: saved.updated_at, revisionId: saved.revision_id, changes, mail };
}
