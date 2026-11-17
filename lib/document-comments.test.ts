import { describe, expect, it } from "vitest";
import { COMMENT_COLUMNS, COMMENT_MAX, groupByPage, numberOnPage, parseBody, parseNewComment, parsePct, plural, type DocumentComment } from "./document-comments";
import { clientLabel, brandOf } from "./portal-brand";
import { PREVIEW_IMAGE, diffContent, pageLabel, pageTitle, pagesSection } from "./project-doc";
import { applyClientEdit, parseStoredContent } from "./project-edit";
import { internalDocumentComment } from "./email/templates";
import { ERGOLIGNE } from "./project-seeds-ergoligne";
import { AHUKINI, SEEDS } from "./project-seeds";

const content = ERGOLIGNE.documents[0].content;
const livret = pagesSection(content)!;

const c = (over: Partial<DocumentComment>): DocumentComment => ({
  id: 1,
  page: 1,
  x: 10,
  y: 10,
  label: "",
  body: "texte",
  status: "open",
  author: "client",
  created_at: "2026-11-16T10:00:00Z",
  updated_at: "2026-11-16T10:00:00Z",
  deleted_at: null,
  ...over,
});

describe("Ergoligne seed", () => {
  it("is a Fenua Studio project with one valid page-image document", () => {
    expect(SEEDS.ergoligne).toBe(ERGOLIGNE);
    expect(ERGOLIGNE.brand).toBe("fenua");
    expect(ERGOLIGNE.contactName).toBe("Carline Courtas");
    expect(parseStoredContent(content)).toEqual(content);
    expect(livret.pages).toHaveLength(16);
    expect(livret.pages.map((p) => p.n)).toEqual(livret.pages.map((_, i) => i + 1));
    for (const p of livret.pages) {
      expect(p.image).toMatch(PREVIEW_IMAGE);
      expect(p.thumb).toMatch(PREVIEW_IMAGE);
    }
  });

  it("leaves Ahukini on the Redline brand", () => {
    expect(AHUKINI.brand).toBeUndefined();
    expect(brandOf(undefined)).toBe("redline");
    expect(brandOf("fenua")).toBe("fenua");
  });

  it("writes page labels with a no-break space after « p. »", () => {
    expect(pageLabel(livret, 6)).toBe("p. 6, scène 2");
    expect(pageLabel(livret, 99)).toBe("p. 99");
    expect(pageTitle(livret, 7)).toBe("Scène 2, correction");
  });

  it("never lets a client save change a pages section", () => {
    const tampered = structuredClone(content);
    const s = tampered.sections[0];
    if (s.kind === "pages") s.pages[0].image = "autre-chose.webp";
    const r = applyClientEdit(content, tampered);
    expect(r).toEqual({ ok: true, content });
    expect(diffContent(content, content)).toEqual([]);
  });
});

describe("comment input", () => {
  it("clamps the position to the page and rounds it to the hundredth", () => {
    expect(parsePct("100.0004")).toBe(100);
    expect(parsePct("-3")).toBe(0);
    expect(parsePct("33.33333")).toBe(33.33);
    expect(parsePct("")).toBeNull();
    expect(parsePct("abc")).toBeNull();
  });

  it("refuses an empty or too long text and keeps line breaks", () => {
    expect(parseBody("   ").ok).toBe(false);
    expect(parseBody(null).ok).toBe(false);
    expect(parseBody("x".repeat(COMMENT_MAX + 1)).ok).toBe(false);
    expect(parseBody("  un\r\ndeux  ")).toEqual({ ok: true, value: "un\ndeux" });
  });

  it("computes the label server side and refuses a page outside the document", () => {
    const ok = parseNewComment(livret, { page: "6", x: "12.5", y: "40", body: "La lampe" });
    expect(ok).toEqual({ ok: true, value: { page: 6, x: 12.5, y: 40, label: "p. 6, scène 2", body: "La lampe" } });
    expect(parseNewComment(livret, { page: "17", x: "1", y: "1", body: "a" }).ok).toBe(false);
    expect(parseNewComment(livret, { page: "2.5", x: "1", y: "1", body: "a" }).ok).toBe(false);
    expect(parseNewComment(livret, { page: "2", x: null, y: "1", body: "a" }).ok).toBe(false);
  });
});

describe("numbering and grouping", () => {
  const list = [
    c({ id: 5, page: 6, created_at: "2026-11-16T10:05:00Z" }),
    c({ id: 2, page: 3, created_at: "2026-11-16T10:02:00Z", status: "resolved" }),
    c({ id: 9, page: 6, created_at: "2026-11-16T10:01:00Z" }),
    c({ id: 3, page: 3, created_at: "2026-11-16T10:03:00Z" }),
  ];

  it("numbers each page from 1, in the order comments were made", () => {
    const n = numberOnPage(list);
    expect([n.get(2), n.get(3), n.get(9), n.get(5)]).toEqual([1, 2, 1, 2]);
  });

  it("groups by page in document order and counts the open ones", () => {
    const g = groupByPage(list);
    expect(g.map((x) => x.page)).toEqual([3, 6]);
    expect(g[0].comments.map((x) => x.id)).toEqual([2, 3]);
    expect(g.map((x) => x.open)).toEqual([1, 2]);
  });

  it("reads named columns only, and says « aucun » for zero", () => {
    expect(COMMENT_COLUMNS).not.toMatch(/\*/);
    expect(plural(0, "commentaire")).toBe("aucun commentaire");
    expect(plural(3, "commentaire")).toBe("3 commentaires");
  });
});

describe("Curtis's email for a comment", () => {
  const base = {
    clientName: clientLabel("Ergoligne", "fenua"),
    documentTitle: "Le livret",
    actionLabel: "Commentaire modifié",
    label: "p. 6, scène 2",
    at: new Date("2026-11-16T08:00:00Z"),
    adminHref: "https://redlinestudio.agency/admin/projets/ergoligne#livret-p6",
    clientHref: "https://redlinestudio.agency/portal/ergoligne?p=6",
  };
  const ctx = { siteUrl: "https://redlinestudio.agency", whatsappHref: "https://wa.me/1", ownerTimeZone: "Pacific/Tahiti" };

  it("names the partner studio in the subject and shows before → after for an edit", () => {
    const m = internalDocumentComment({ ...base, before: "Ancien texte", after: "Nouveau texte" }, ctx);
    expect(m.subject).toBe("[Projet] Ergoligne (Fenua Studio) · Commentaire modifié · p. 6, scène 2");
    expect(m.text).toContain("Ancien texte");
    expect(m.text).toContain("Nouveau texte");
    expect(m.html).toContain("/admin/projets/ergoligne#livret-p6");
  });

  it("quotes the deleted text for a deletion", () => {
    const m = internalDocumentComment({ ...base, actionLabel: "Commentaire supprimé", before: "Texte effacé", after: "" }, ctx);
    expect(m.text).toContain("Texte effacé");
    expect(clientLabel("Ahukini Swimwear", "redline")).toBe("Ahukini Swimwear");
  });
});
