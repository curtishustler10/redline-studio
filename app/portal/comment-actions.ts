"use server";

// Comments pinned on a page-image document. Server actions are public endpoints:
// the project comes from the session cookie, never from the form, and the
// document must be a page-image document of that project. A client only ever
// writes on her own documents, whatever ids she posts.

import { revalidatePath } from "next/cache";
import { parseBody, parseNewComment } from "@/lib/document-comments";
import { applyClientComment, type CommentRequest } from "@/lib/project-comments";
import { pagesSection, type DocPagesSection } from "@/lib/project-doc";
import { getDocument, type DocumentRow, type ProjectRow } from "@/lib/projects";
import { currentProject } from "./_lib/session";

export type CommentResult = { ok: true; at: number; id: number } | { ok: false; error: string } | null;

const SESSION_EXPIRED = { ok: false, error: "Votre session a expiré. Rechargez la page et entrez à nouveau votre code." } as const;
const GONE = { ok: false, error: "Ce commentaire n’existe plus. Rechargez la page." } as const;
const LIMIT = { ok: false, error: "Ce document a atteint le nombre maximal de commentaires. Écrivez-nous directement." } as const;
const FAILED = { ok: false, error: "L’enregistrement a échoué. Réessayez dans un instant." } as const;

async function sessionDocument(formData: FormData): Promise<{ project: ProjectRow; document: DocumentRow; section: DocPagesSection } | null> {
  const project = await currentProject();
  if (!project) return null;
  const document = await getDocument(project.id, String(formData.get("document") ?? ""));
  const section = document ? pagesSection(document.content) : null;
  return document && section ? { project, document, section } : null;
}

const asId = (v: FormDataEntryValue | null) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
};

async function run(formData: FormData, build: (section: DocPagesSection) => CommentRequest | { ok: false; error: string }): Promise<CommentResult> {
  try {
    const ctx = await sessionDocument(formData);
    if (!ctx) return SESSION_EXPIRED;
    const request = build(ctx.section);
    if ("ok" in request) return request;
    const r = await applyClientComment({ project: ctx.project, document: ctx.document, request });
    if (!r.ok) return r.error === "limit" ? LIMIT : GONE;
    revalidatePath(`/portal/${ctx.project.slug}`);
    revalidatePath(`/admin/projets/${ctx.project.slug}`);
    return { ok: true, at: Date.now(), id: r.id };
  } catch (e) {
    console.error("[portal] comment", e);
    return FAILED;
  }
}

/** A new comment (no comment_id) or the new text of an existing one. */
export async function saveComment(_prev: CommentResult, formData: FormData): Promise<CommentResult> {
  return run(formData, (section) => {
    const id = asId(formData.get("comment_id"));
    if (id) {
      const body = parseBody(formData.get("body"));
      return body.ok ? { action: "edit", id, body: body.value } : body;
    }
    const input = parseNewComment(section, { page: formData.get("page"), x: formData.get("x"), y: formData.get("y"), body: formData.get("body") });
    return input.ok ? { action: "add", comment: input.value } : input;
  });
}

export async function setCommentStatus(_prev: CommentResult, formData: FormData): Promise<CommentResult> {
  return run(formData, () => {
    const id = asId(formData.get("comment_id"));
    if (!id) return GONE;
    return { action: formData.get("status") === "resolved" ? "resolve" : "reopen", id };
  });
}

export async function removeComment(_prev: CommentResult, formData: FormData): Promise<CommentResult> {
  return run(formData, () => {
    const id = asId(formData.get("comment_id"));
    return id ? { action: "delete", id } : GONE;
  });
}
