// Client project documents ("Mon projet"): the shape of a document, the
// before → after diff that goes into Curtis's notification, the optimistic-lock
// comparison and the view helpers. Pure and dependency-free, so the client
// editor can import it; validation (zod) lives in lib/project-edit.ts.

/** One bullet. `row` lines render as a table row, cells separated by " | ". */
export type DocLine = { id: string; text: string; badge?: "proposition"; row?: boolean };
export type DocQuestion = { id: string; text: string; answer: string };

export type DocListSection = { id: string; kind: "list"; title: string; lines: DocLine[] };
export type DocQuestionSection = { id: string; kind: "questions"; title: string; questions: DocQuestion[] };
export type DocSection = DocListSection | DocQuestionSection;

export type DocContent = { version: 1; sections: DocSection[] };

export const LIMITS = { title: 200, line: 1000, answer: 4000, lines: 60, sections: 20, questions: 30 } as const;


// ─── Diff ────────────────────────────────────────────────────────────────────

export type ChangeKind = "title" | "line" | "added" | "removed" | "question" | "answer";
export type Change = { kind: ChangeKind; section: string; label: string; before: string; after: string };

/**
 * Every difference between two versions, in reading order. Sections and
 * questions are matched by position (their ids are fixed), lines by id, so an
 * edited line reads as "before → after" rather than a removal plus an addition.
 */
export function diffContent(before: DocContent, after: DocContent): Change[] {
  const out: Change[] = [];
  const prev = new Map(before.sections.map((s) => [s.id, s]));

  for (const s of after.sections) {
    const was = prev.get(s.id);
    if (!was || was.kind !== s.kind) continue;
    const section = was.title;
    if (was.title !== s.title) out.push({ kind: "title", section, label: "Titre de la partie", before: was.title, after: s.title });

    if (was.kind === "list" && s.kind === "list") {
      const oldLines = new Map(was.lines.map((l, i) => [l.id, { line: l, n: i + 1 }]));
      const kept = new Set<string>();
      s.lines.forEach((l, i) => {
        const old = oldLines.get(l.id);
        if (!old) {
          out.push({ kind: "added", section, label: `Ligne ${i + 1} ajoutée`, before: "", after: l.text });
          return;
        }
        kept.add(l.id);
        if (old.line.text !== l.text) out.push({ kind: "line", section, label: `Ligne ${i + 1}`, before: old.line.text, after: l.text });
      });
      for (const [lineId, old] of oldLines) {
        if (!kept.has(lineId)) out.push({ kind: "removed", section, label: `Ligne ${old.n} supprimée`, before: old.line.text, after: "" });
      }
    } else if (was.kind === "questions" && s.kind === "questions") {
      const oldQ = new Map(was.questions.map((q) => [q.id, q]));
      s.questions.forEach((q, i) => {
        const old = oldQ.get(q.id);
        if (!old) return;
        if (old.text !== q.text) out.push({ kind: "question", section, label: `Point ${i + 1} (question)`, before: old.text, after: q.text });
        if (old.answer !== q.answer) out.push({ kind: "answer", section, label: `Point ${i + 1} (réponse)`, before: old.answer, after: q.answer });
      });
    }
  }
  return out;
}

// ─── Optimistic lock ─────────────────────────────────────────────────────────

/**
 * Microseconds since the epoch for a Postgres timestamptz string, or null.
 * Date keeps only milliseconds, and two saves in the same millisecond must
 * still compare as different, so the fraction is read by hand.
 */
export function instantMicros(value: string): bigint | null {
  const m = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2})(?:\.(\d{1,6}))?(Z|[+-]\d{2}(?::?\d{2})?)$/.exec(String(value ?? "").trim());
  if (!m) return null;
  let zone = m[4];
  if (/^[+-]\d{2}$/.test(zone)) zone += ":00";
  else if (/^[+-]\d{4}$/.test(zone)) zone = `${zone.slice(0, 3)}:${zone.slice(3)}`;
  const ms = Date.parse(`${m[1]}T${m[2]}${zone}`);
  if (!Number.isFinite(ms)) return null;
  return BigInt(ms) * BigInt(1000) + BigInt((m[3] ?? "").padEnd(6, "0"));
}

/** Has nobody saved since `base`? Unreadable values never match. */
export function sameInstant(a: string, b: string): boolean {
  const x = instantMicros(a);
  const y = instantMicros(b);
  return x !== null && y !== null && x === y;
}

// ─── Helpers shared by the views ─────────────────────────────────────────────

/** Splits consecutive `row` lines into tables; other lines stay bullets. */
export type LineGroup = { kind: "bullets"; lines: DocLine[] } | { kind: "table"; rows: string[][] };

export function groupLines(lines: DocLine[]): LineGroup[] {
  const groups: LineGroup[] = [];
  for (const l of lines) {
    const last = groups[groups.length - 1];
    if (l.row) {
      const cells = l.text.split("|").map((c) => c.trim());
      if (last?.kind === "table") last.rows.push(cells);
      else groups.push({ kind: "table", rows: [cells] });
    } else if (last?.kind === "bullets") last.lines.push(l);
    else groups.push({ kind: "bullets", lines: [l] });
  }
  return groups;
}

export function newLineId(): string {
  // Not security-relevant: only has to be unique inside one section.
  return `n-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Who wrote a version: the seed script, the client through her code, or Curtis from the admin. */
export type UpdatedBy = "seed" | "client" | "admin";

/** "29 octobre 2026 à 10:14" in the given zone. Same output on server and client. */
export function formatStamp(iso: string, timeZone: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const day = new Intl.DateTimeFormat("fr-FR", { timeZone, day: "numeric", month: "long", year: "numeric" }).format(d);
  const time = new Intl.DateTimeFormat("fr-FR", { timeZone, hour: "2-digit", minute: "2-digit", hour12: false }).format(d);
  return `${day} à ${time}`;
}
