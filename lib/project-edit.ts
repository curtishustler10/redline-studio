// Validation of client project documents: the zod schema for stored content
// and the rules a client edit must follow. Server side (and tests) only, so zod
// stays out of the browser bundle.
import { z } from "zod";
import { LIMITS, type DocContent, type DocLine, type DocSection } from "./project-doc";

const id = z.string().regex(/^[a-z0-9-]{1,40}$/);

const lineSchema = z.object({
  id,
  text: z.string().max(LIMITS.line),
  badge: z.literal("proposition").optional(),
  row: z.boolean().optional(),
});

const sectionSchema = z.discriminatedUnion("kind", [
  z.object({ id, kind: z.literal("list"), title: z.string().max(LIMITS.title), lines: z.array(lineSchema).max(LIMITS.lines) }),
  z.object({
    id,
    kind: z.literal("questions"),
    title: z.string().max(LIMITS.title),
    questions: z.array(z.object({ id, text: z.string().max(LIMITS.line), answer: z.string().max(LIMITS.answer) })).max(LIMITS.questions),
  }),
]);

export const contentSchema = z.object({ version: z.literal(1), sections: z.array(sectionSchema).max(LIMITS.sections) });

/** Reads a stored jsonb value. Throws on anything that is not a valid document. */
export function parseStoredContent(value: unknown): DocContent {
  return contentSchema.parse(value) as DocContent;
}

export type EditError = "invalid" | "structure";

/**
 * Validates what the client sent against the stored version and returns the
 * cleaned document to save. The client may edit titles, line texts, question
 * texts and answers, and add or remove lines. It may not add, drop or reorder
 * sections or questions, and it cannot set a badge: badges are copied from the
 * stored lines by id. Lines emptied by the client are removed.
 */
export function applyClientEdit(current: DocContent, input: unknown): { ok: true; content: DocContent } | { ok: false; error: EditError } {
  const parsed = contentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const next = parsed.data as DocContent;
  if (next.sections.length !== current.sections.length) return { ok: false, error: "structure" };

  const sections: DocSection[] = [];
  for (let i = 0; i < current.sections.length; i++) {
    const was = current.sections[i];
    const now = next.sections[i];
    if (was.id !== now.id || was.kind !== now.kind) return { ok: false, error: "structure" };
    const title = clean(now.title) || was.title;

    if (was.kind === "list" && now.kind === "list") {
      const ids = new Set<string>();
      for (const l of now.lines) {
        if (ids.has(l.id)) return { ok: false, error: "structure" };
        ids.add(l.id);
      }
      const stored = new Map(was.lines.map((l) => [l.id, l]));
      const lines = now.lines
        .map((l): DocLine => {
          const old = stored.get(l.id);
          const out: DocLine = { id: l.id, text: clean(l.text) };
          const badge = old ? old.badge : undefined;
          const row = old ? old.row : l.row;
          if (badge) out.badge = badge;
          if (row) out.row = true;
          return out;
        })
        .filter((l) => l.text.length > 0);
      sections.push({ id: was.id, kind: "list", title, lines });
    } else if (was.kind === "questions" && now.kind === "questions") {
      if (now.questions.length !== was.questions.length || now.questions.some((q, j) => q.id !== was.questions[j].id)) {
        return { ok: false, error: "structure" };
      }
      sections.push({
        id: was.id,
        kind: "questions",
        title,
        questions: now.questions.map((q, j) => ({ id: q.id, text: clean(q.text) || was.questions[j].text, answer: q.answer.trim() })),
      });
    }
  }
  return { ok: true, content: { version: 1, sections } };
}

function clean(s: string): string {
  // Single-line fields: collapse the whitespace a textarea lets in.
  return s.replace(/[ \t\r\n]+/g, " ").trim();
}
