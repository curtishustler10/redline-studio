import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

// A one-row project_documents table and a fake save_project_document that
// applies the same compare-and-set rule as the SQL function.
type Doc = { id: number; project_id: number; slug: string; title: string; content: unknown; updated_at: string; updated_by: string; created_at: string };
const state: { doc: Doc | null; projects: Record<string, unknown>[]; rpcCalls: unknown[]; nextRevision: number; raceTo: string | null } = {
  doc: null,
  projects: [],
  rpcCalls: [],
  nextRevision: 10,
  raceTo: null,
};

function table(name: string) {
  const filters: [string, unknown][] = [];
  const rows = () => {
    const all = name === "project_documents" ? (state.doc ? [state.doc] : []) : name === "client_projects" ? state.projects : [];
    return all.filter((r) => filters.every(([k, v]) => (r as Record<string, unknown>)[k] === v));
  };
  const q = {
    select: () => q,
    eq: (k: string, v: unknown) => (filters.push([k, v]), q),
    maybeSingle: async () => ({ data: rows()[0] ?? null, error: null }),
    then: (resolve: (v: { data: unknown[]; error: null }) => void) => resolve({ data: rows(), error: null }),
  };
  return q;
}

vi.mock("./db", () => ({
  getDb: () => ({
    from: table,
    rpc: async (_fn: string, args: { p_document_id: number; p_expected_updated_at: string; p_content: unknown; p_updated_by: string }) => {
      state.rpcCalls.push(args);
      const doc = state.doc!;
      if (state.raceTo) doc.updated_at = state.raceTo; // someone saved between our read and our write
      if (doc.updated_at !== args.p_expected_updated_at) return { data: [{ status: "conflict", updated_at: doc.updated_at, revision_id: null, previous_content: null }], error: null };
      const previous = doc.content;
      Object.assign(doc, { content: args.p_content, updated_at: "2026-10-29T21:00:00.000002+00:00", updated_by: args.p_updated_by });
      return { data: [{ status: "ok", updated_at: doc.updated_at, revision_id: state.nextRevision++, previous_content: previous }], error: null };
    },
  }),
}));

const notifyProjectEdit = vi.fn();
vi.mock("./notifications", () => ({ notifyProjectEdit: (...a: unknown[]) => notifyProjectEdit(...a) }));

import { findProjectByCode, saveClientDocument, type ProjectRow } from "./projects";
import { hashCode } from "./portal-auth";
import type { DocContent } from "./project-doc";

const content: DocContent = {
  version: 1,
  sections: [
    { id: "prod", kind: "list", title: "Production", lines: [{ id: "prod-1", text: "45 jours." }] },
    { id: "points", kind: "questions", title: "Points à confirmer", questions: [{ id: "point-1", text: "Marge ?", answer: "" }] },
  ],
};
const BASE = "2026-10-29T20:00:00.000001+00:00";
const project = { id: 1, slug: "ahukini", client_name: "Ahukini Swimwear" } as ProjectRow;

function edited(answer: string): DocContent {
  const c: DocContent = JSON.parse(JSON.stringify(content));
  if (c.sections[1].kind === "questions") c.sections[1].questions[0].answer = answer;
  return c;
}

beforeEach(() => {
  state.doc = { id: 5, project_id: 1, slug: "cr", title: "Compte rendu", content: JSON.parse(JSON.stringify(content)), updated_at: BASE, updated_by: "seed", created_at: BASE };
  state.rpcCalls = [];
  state.nextRevision = 10;
  state.raceTo = null;
  notifyProjectEdit.mockReset();
  notifyProjectEdit.mockResolvedValue({ kind: "internal_project_edit", status: "sent" });
});

describe("saveClientDocument: concurrency", () => {
  it("saves when the page was loaded from the current version", async () => {
    const r = await saveClientDocument({ project, documentSlug: "cr", baseUpdatedAt: BASE, content: edited("Oui") });
    expect(r).toMatchObject({ ok: true, revisionId: 10, mail: "sent", updatedAt: "2026-10-29T21:00:00.000002+00:00" });
    expect(state.rpcCalls).toHaveLength(1);
  });

  it("refuses a save based on an older version, without writing", async () => {
    const r = await saveClientDocument({ project, documentSlug: "cr", baseUpdatedAt: "2026-10-29T20:00:00.000000+00:00", content: edited("Oui") });
    expect(r).toEqual({ ok: false, error: "conflict", currentUpdatedAt: BASE });
    expect(state.rpcCalls).toHaveLength(0);
    expect(notifyProjectEdit).not.toHaveBeenCalled();
  });

  it("refuses when another save lands between the read and the write", async () => {
    state.raceTo = "2026-10-29T20:30:00.5+00:00";
    const r = await saveClientDocument({ project, documentSlug: "cr", baseUpdatedAt: BASE, content: edited("Oui") });
    expect(r).toEqual({ ok: false, error: "conflict", currentUpdatedAt: "2026-10-29T20:30:00.5+00:00" });
    expect(notifyProjectEdit).not.toHaveBeenCalled();
  });

  it("a second save from the same stale page is refused after the first one wins", async () => {
    await saveClientDocument({ project, documentSlug: "cr", baseUpdatedAt: BASE, content: edited("Oui") });
    const r = await saveClientDocument({ project, documentSlug: "cr", baseUpdatedAt: BASE, content: edited("Non") });
    expect(r.ok).toBe(false);
    expect(state.doc!.content).toEqual(edited("Oui"));
  });
});

describe("saveClientDocument: notification", () => {
  it("sends the diff of what was really replaced", async () => {
    await saveClientDocument({ project, documentSlug: "cr", baseUpdatedAt: BASE, content: edited("Oui") });
    expect(notifyProjectEdit).toHaveBeenCalledOnce();
    const arg = notifyProjectEdit.mock.calls[0][0];
    expect(arg).toMatchObject({ projectId: 1, projectSlug: "ahukini", revisionId: 10 });
    expect(arg.edit.changes).toEqual([{ kind: "answer", section: "Points à confirmer", label: "Point 1 (réponse)", before: "", after: "Oui" }]);
  });

  it("keeps the save when the email fails", async () => {
    notifyProjectEdit.mockResolvedValue({ kind: "internal_project_edit", status: "failed", error: "Resend 500" });
    const r = await saveClientDocument({ project, documentSlug: "cr", baseUpdatedAt: BASE, content: edited("Oui") });
    expect(r).toMatchObject({ ok: true, mail: "failed" });
    expect(state.doc!.content).toEqual(edited("Oui"));
  });

  it("keeps the save when the email log itself throws, and logs it", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    notifyProjectEdit.mockRejectedValue(new Error("email_log down"));
    const r = await saveClientDocument({ project, documentSlug: "cr", baseUpdatedAt: BASE, content: edited("Oui") });
    expect(r).toMatchObject({ ok: true, mail: "failed" });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("writes and sends nothing when nothing changed", async () => {
    const r = await saveClientDocument({ project, documentSlug: "cr", baseUpdatedAt: BASE, content: JSON.parse(JSON.stringify(content)) });
    expect(r).toMatchObject({ ok: true, revisionId: null, changes: [], mail: "none" });
    expect(state.rpcCalls).toHaveLength(0);
    expect(notifyProjectEdit).not.toHaveBeenCalled();
  });

  it("rejects an edit that changes the structure", async () => {
    const r = await saveClientDocument({ project, documentSlug: "cr", baseUpdatedAt: BASE, content: { version: 1, sections: [content.sections[0]] } });
    expect(r).toEqual({ ok: false, error: "structure" });
    expect(state.rpcCalls).toHaveLength(0);
  });
});

describe("findProjectByCode", () => {
  it("opens the project for its code only", async () => {
    state.projects = [{ id: 1, slug: "ahukini", code_prefix: "AHK", access_code_hash: await hashCode("AHK-7QF4-M9XC") }];
    expect((await findProjectByCode("ahk-7qf4-m9xc"))?.slug).toBe("ahukini");
    expect(await findProjectByCode("AHK-7QF4-M9XD")).toBeNull();
    expect(await findProjectByCode("ZZZ-7QF4-M9XC")).toBeNull();
    expect(await findProjectByCode("n'importe quoi")).toBeNull();
  });
});
