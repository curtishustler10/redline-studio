// Comments pinned on a page-image document ("annotated pages"): input validation,
// numbering and grouping by page. Pure, no database: tested as is and importable
// from client components. The database side is lib/project-comments.ts.
import { pageLabel, type DocPagesSection } from "./project-doc";

export const COMMENT_MAX = 2000;

export type CommentStatus = "open" | "resolved";

export type DocumentComment = {
  id: number;
  page: number;
  x: number;
  y: number;
  label: string;
  body: string;
  status: CommentStatus;
  author: "client" | "admin";
  created_at: string;
  updated_at: string;
  /** Only ever set in the admin view: the client never receives deleted comments. */
  deleted_at: string | null;
};

/** Columns read, named one by one: a column added later does not reach the client unless it is listed here. */
export const COMMENT_COLUMNS = "id, page, x, y, label, body, status, author, created_at, updated_at, deleted_at";

export type NewComment = { page: number; x: number; y: number; label: string; body: string };

type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

/** Comment text: trimmed, neither empty nor too long. */
export function parseBody(raw: unknown): Parsed<string> {
  const body = typeof raw === "string" ? raw.replace(/\r\n/g, "\n").trim() : "";
  if (!body) return { ok: false, error: "Écrivez votre commentaire avant d’enregistrer." };
  if (body.length > COMMENT_MAX) {
    return { ok: false, error: `Votre commentaire dépasse ${COMMENT_MAX} caractères. Raccourcissez-le ou coupez-le en deux.` };
  }
  return { ok: true, value: body };
}

/**
 * Position in percent of the page, rounded to the hundredth and clamped to
 * [0, 100]. A tap on the very edge can come out as 100.0001 depending on the
 * browser's rounding: clamp it rather than refuse the comment.
 */
export function parsePct(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  return Math.round(Math.min(100, Math.max(0, n)) * 100) / 100;
}

/** Validates a new comment against the document. The label (« p. 6, scène 2 ») is computed here, never taken from the form. */
export function parseNewComment(section: DocPagesSection, raw: { page: unknown; x: unknown; y: unknown; body: unknown }): Parsed<NewComment> {
  const page = Number(raw.page);
  if (!Number.isInteger(page) || !section.pages.some((p) => p.n === page)) {
    return { ok: false, error: "Page introuvable. Rechargez la page." };
  }
  const x = parsePct(raw.x);
  const y = parsePct(raw.y);
  if (x === null || y === null) return { ok: false, error: "Touchez la page à l’endroit voulu, puis écrivez." };
  const body = parseBody(raw.body);
  if (!body.ok) return body;
  return { ok: true, value: { page, x, y, label: pageLabel(section, page), body: body.value } };
}

/** Reading order: by page, then in the order the comments were made. */
export function sortComments<T extends Pick<DocumentComment, "page" | "created_at" | "id">>(list: T[]): T[] {
  return [...list].sort((a, b) => a.page - b.page || a.created_at.localeCompare(b.created_at) || a.id - b.id);
}

/**
 * Number of each comment on its page (1, 2, 3…), in the order they were made.
 * It is the number on the pin: it does not move when a comment is resolved,
 * only when an older comment of the same page is deleted.
 */
export function numberOnPage(list: DocumentComment[]): Map<number, number> {
  const out = new Map<number, number>();
  const seen = new Map<number, number>();
  for (const c of sortComments(list)) {
    const n = (seen.get(c.page) ?? 0) + 1;
    seen.set(c.page, n);
    out.set(c.id, n);
  }
  return out;
}

export type PageGroup = { page: number; comments: DocumentComment[]; open: number };

/** The pages that have at least one comment, in document order. */
export function groupByPage(list: DocumentComment[]): PageGroup[] {
  const groups = new Map<number, PageGroup>();
  for (const c of sortComments(list)) {
    const g = groups.get(c.page) ?? { page: c.page, comments: [], open: 0 };
    g.comments.push(c);
    if (c.status === "open") g.open += 1;
    groups.set(c.page, g);
  }
  return Array.from(groups.values());
}

/** « 3 commentaires », « 1 commentaire », « aucun commentaire ». */
export function plural(n: number, one: string, many: string = `${one}s`): string {
  return n === 0 ? `aucun ${one}` : `${n} ${n === 1 ? one : many}`;
}

/** What an action did, in Curtis's email and the admin history. */
export type CommentAction = "added" | "edited" | "resolved" | "reopened" | "deleted";

export const ACTION_LABEL: Record<CommentAction, string> = {
  added: "Commentaire ajouté",
  edited: "Commentaire modifié",
  resolved: "Commentaire marqué résolu",
  reopened: "Commentaire rouvert",
  deleted: "Commentaire supprimé",
};
