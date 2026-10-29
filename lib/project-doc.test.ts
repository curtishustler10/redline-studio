import { describe, expect, it } from "vitest";
import { diffContent, groupLines, instantMicros, newLineId, sameInstant, type DocContent } from "./project-doc";
import { applyClientEdit, parseStoredContent } from "./project-edit";
import { AHUKINI } from "./project-seeds";

const base: DocContent = {
  version: 1,
  sections: [
    {
      id: "prod",
      kind: "list",
      title: "Production",
      lines: [
        { id: "prod-1", text: "45 jours." },
        { id: "prod-2", text: "5 000 F par pièce.", badge: "proposition" },
      ],
    },
    { id: "points", kind: "questions", title: "Points à confirmer", questions: [{ id: "point-1", text: "Marge ?", answer: "" }] },
  ],
};

const clone = (c: DocContent): DocContent => JSON.parse(JSON.stringify(c));

describe("applyClientEdit", () => {
  it("accepts text edits, added lines and answers", () => {
    const next = clone(base);
    if (next.sections[0].kind !== "list" || next.sections[1].kind !== "questions") throw new Error();
    next.sections[0].title = "  Production   et coûts ";
    next.sections[0].lines[0].text = "50 jours.";
    next.sections[0].lines.push({ id: newLineId(), text: "Nouvelle ligne" });
    next.sections[1].questions[0].answer = "Oui, même coût.\nÀ vérifier.";
    const r = applyClientEdit(base, next);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const s0 = r.content.sections[0];
    const s1 = r.content.sections[1];
    expect(s0.title).toBe("Production et coûts");
    expect(s0.kind === "list" && s0.lines.map((l) => l.text)).toEqual(["50 jours.", "5 000 F par pièce.", "Nouvelle ligne"]);
    expect(s1.kind === "questions" && s1.questions[0].answer).toBe("Oui, même coût.\nÀ vérifier.");
  });

  it("keeps badges from the stored version and ignores forged ones", () => {
    const next = clone(base) as DocContent & { sections: { lines?: { badge?: string }[] }[] };
    const lines = next.sections[0].lines!;
    delete lines[1].badge;
    lines[0].badge = "proposition";
    const r = applyClientEdit(base, next);
    if (!r.ok || r.content.sections[0].kind !== "list") throw new Error("expected ok");
    expect(r.content.sections[0].lines[0].badge).toBeUndefined();
    expect(r.content.sections[0].lines[1].badge).toBe("proposition");
  });

  it("drops emptied lines and keeps a title that was blanked", () => {
    const next = clone(base);
    if (next.sections[0].kind !== "list") throw new Error();
    next.sections[0].lines[0].text = "   ";
    next.sections[0].title = "";
    const r = applyClientEdit(base, next);
    if (!r.ok || r.content.sections[0].kind !== "list") throw new Error("expected ok");
    expect(r.content.sections[0].lines.map((l) => l.id)).toEqual(["prod-2"]);
    expect(r.content.sections[0].title).toBe("Production");
  });

  it("keeps non-breaking spaces (no phantom diffs on French numbers)", () => {
    const withNbsp: DocContent = clone(base);
    if (withNbsp.sections[0].kind !== "list") throw new Error();
    withNbsp.sections[0].lines[1].text = "5 000 F";
    const r = applyClientEdit(withNbsp, clone(withNbsp));
    if (!r.ok) throw new Error("expected ok");
    expect(diffContent(withNbsp, r.content)).toEqual([]);
  });

  it("refuses structural changes", () => {
    const fewer = clone(base);
    fewer.sections.pop();
    expect(applyClientEdit(base, fewer)).toEqual({ ok: false, error: "structure" });

    const swapped = clone(base);
    swapped.sections.reverse();
    expect(applyClientEdit(base, swapped)).toEqual({ ok: false, error: "structure" });

    const noQuestion = clone(base);
    if (noQuestion.sections[1].kind !== "questions") throw new Error();
    noQuestion.sections[1].questions = [];
    expect(applyClientEdit(base, noQuestion)).toEqual({ ok: false, error: "structure" });

    const dupLine = clone(base);
    if (dupLine.sections[0].kind !== "list") throw new Error();
    dupLine.sections[0].lines[1].id = "prod-1";
    expect(applyClientEdit(base, dupLine)).toEqual({ ok: false, error: "structure" });
  });

  it("refuses malformed or oversized input", () => {
    expect(applyClientEdit(base, null)).toEqual({ ok: false, error: "invalid" });
    expect(applyClientEdit(base, { version: 2, sections: [] })).toEqual({ ok: false, error: "invalid" });
    const huge = clone(base);
    if (huge.sections[0].kind !== "list") throw new Error();
    huge.sections[0].lines[0].text = "x".repeat(1001);
    expect(applyClientEdit(base, huge)).toEqual({ ok: false, error: "invalid" });
    const badId = clone(base);
    if (badId.sections[0].kind !== "list") throw new Error();
    badId.sections[0].lines[0].id = "<script>";
    expect(applyClientEdit(base, badId)).toEqual({ ok: false, error: "invalid" });
  });
});

describe("diffContent", () => {
  it("is empty for identical content", () => {
    expect(diffContent(base, clone(base))).toEqual([]);
  });

  it("lists titles, edits, additions, removals and answers as before → after", () => {
    const next = clone(base);
    if (next.sections[0].kind !== "list" || next.sections[1].kind !== "questions") throw new Error();
    next.sections[0].title = "Production et coûts";
    next.sections[0].lines = [
      { id: "prod-2", text: "5 500 F par pièce.", badge: "proposition" },
      { id: "n-1", text: "Ajout" },
    ];
    next.sections[1].questions[0].text = "Marge par pièce ?";
    next.sections[1].questions[0].answer = "Oui";
    expect(diffContent(base, next)).toEqual([
      { kind: "title", section: "Production", label: "Titre de la partie", before: "Production", after: "Production et coûts" },
      { kind: "line", section: "Production", label: "Ligne 1", before: "5 000 F par pièce.", after: "5 500 F par pièce." },
      { kind: "added", section: "Production", label: "Ligne 2 ajoutée", before: "", after: "Ajout" },
      { kind: "removed", section: "Production", label: "Ligne 1 supprimée", before: "45 jours.", after: "" },
      { kind: "question", section: "Points à confirmer", label: "Point 1 (question)", before: "Marge ?", after: "Marge par pièce ?" },
      { kind: "answer", section: "Points à confirmer", label: "Point 1 (réponse)", before: "", after: "Oui" },
    ]);
  });
});

describe("optimistic lock instants", () => {
  it("compares Postgres timestamps to the microsecond", () => {
    expect(sameInstant("2026-10-29T20:41:57.123456+00:00", "2026-10-29T20:41:57.123456+00:00")).toBe(true);
    expect(sameInstant("2026-10-29T20:41:57.123456+00:00", "2026-10-29T20:41:57.123457+00:00")).toBe(false);
    expect(sameInstant("2026-10-29T20:41:57.1234+00:00", "2026-10-29T20:41:57.123400Z")).toBe(true);
    expect(sameInstant("2026-10-29 10:41:57.5-10", "2026-10-29T20:41:57.5+00:00")).toBe(true);
  });

  it("never matches garbage", () => {
    expect(instantMicros("hier")).toBeNull();
    expect(sameInstant("", "")).toBe(false);
  });
});

describe("views helpers", () => {
  it("groups row lines into tables", () => {
    const groups = groupLines([
      { id: "a", text: "Intro" },
      { id: "b", text: "Taille | Total", row: true },
      { id: "c", text: "S | 45", row: true },
      { id: "d", text: "Fin" },
    ]);
    expect(groups).toEqual([
      { kind: "bullets", lines: [{ id: "a", text: "Intro" }] },
      { kind: "table", rows: [["Taille", "Total"], ["S", "45"]] },
      { kind: "bullets", lines: [{ id: "d", text: "Fin" }] },
    ]);
  });

  it("makes line ids the validator accepts", () => {
    expect(newLineId()).toMatch(/^[a-z0-9-]{1,40}$/);
  });
});

describe("Ahukini seed", () => {
  const doc = AHUKINI.documents[0].content;

  it("is a valid document with the expected sections", () => {
    expect(parseStoredContent(doc)).toEqual(doc);
    expect(doc.sections.map((s) => s.title)).toEqual([
      "Production et coûts",
      "Nouvelle collection (fin 2026)",
      "Anciennes collections",
      "Objectifs fin 2026 / 2027",
      "Site",
      "Collaboration Ahukini × Redline Studio",
      "Points à confirmer",
    ]);
  });

  it("has six empty answers and the monthly variant marked as a proposal", () => {
    const points = doc.sections[6];
    expect(points.kind === "questions" && points.questions.map((q) => q.answer)).toEqual(["", "", "", "", "", ""]);
    const collab = doc.sections[5];
    const proposals = collab.kind === "list" ? collab.lines.filter((l) => l.badge === "proposition") : [];
    expect(proposals).toHaveLength(1);
    expect(proposals[0].text).toMatch(/^Variante proposée, à paliers de ventes mensuelles/);
  });

  it("survives a no-op client save unchanged", () => {
    const r = applyClientEdit(doc, clone(doc));
    if (!r.ok) throw new Error("expected ok");
    expect(r.content).toEqual(doc);
  });
});
