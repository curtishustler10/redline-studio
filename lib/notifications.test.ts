import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

// In-memory email_log standing in for Postgres: same dedupe semantics as crm.claimEmail.
const log = new Map<string, { id: number; status: "pending" | "sent" | "failed"; error?: string; recipient: string }>();
let nextId = 1;
const due: unknown[] = [];

vi.mock("./crm", async (orig) => {
  const real = await orig<typeof import("./crm")>();
  return {
    toLeadInfo: real.toLeadInfo,
    toAppointment: real.toAppointment,
    claimEmail: vi.fn(async (c: { dedupeKey: string; recipient: string }) => {
      const row = log.get(c.dedupeKey);
      if (!row) {
        const id = nextId++;
        log.set(c.dedupeKey, { id, status: "pending", recipient: c.recipient });
        return id;
      }
      if (row.status === "failed") {
        row.status = "pending";
        return row.id;
      }
      return null;
    }),
    markEmailSent: vi.fn(async (id: number) => {
      for (const r of log.values()) if (r.id === id) r.status = "sent";
    }),
    markEmailFailed: vi.fn(async (id: number, error: string) => {
      for (const r of log.values()) if (r.id === id) Object.assign(r, { status: "failed", error });
    }),
    appointmentsDueForReminder: vi.fn(async () => due),
    getLead: vi.fn(async () => lead),
  };
});

import type { AppointmentRow, LeadRow } from "./crm";
import { notifyContact, notifyRdvCancelled, notifyRdvRescheduled, notifyRdvSet, sendDueReminders } from "./notifications";

const lead: LeadRow = {
  id: 7,
  name: "Maya Teriitahi",
  email: "maya@example.com",
  phone: null,
  company: "Maya Hair",
  lang: "fr",
  time_zone: "Pacific/Tahiti",
  source: "form",
  service: null,
  message: null,
  status: "new",
  notes: null,
  booking_token: null,
  created_at: "2026-09-28T00:00:00Z",
  updated_at: "2026-09-28T00:00:00Z",
};

const apt: AppointmentRow = {
  id: 3,
  lead_id: 7,
  starts_at: "2026-10-06T20:00:00Z",
  ends_at: "2026-10-06T20:30:00Z",
  duration_min: 30,
  mode: "phone",
  location: null,
  phone: "+689 87 00 00 00",
  time_zone: "Pacific/Tahiti",
  status: "scheduled",
  sequence: 0,
  booked_via: "admin",
  created_at: "2026-09-28T00:00:00Z",
  updated_at: "2026-09-28T00:00:00Z",
};

type Sent = { to: string[]; subject: string; attachments?: { filename: string; content_type: string }[]; text: string };
let sent: Sent[] = [];
let failNext = false;
const env = { ...process.env };

beforeEach(() => {
  log.clear();
  nextId = 1;
  due.length = 0;
  sent = [];
  failNext = false;
  process.env.RESEND_API_KEY = "re_test";
  process.env.MAIL_INTERNAL_TO = "curtis@example.com";
  process.env.MAIL_REPLY_TO = "curtis@example.com";
  delete process.env.MAIL_TEST_REDIRECT;
  vi.stubGlobal("fetch", async (_url: string, init: { body: string }) => {
    if (failNext) {
      failNext = false;
      return new Response(JSON.stringify({ message: "domain not verified" }), { status: 403 });
    }
    sent.push(JSON.parse(init.body));
    return new Response(JSON.stringify({ id: `em_${sent.length}` }), { status: 200 });
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  process.env = { ...env };
});

describe("notifyRdvSet", () => {
  it("sends the lead confirmation and the internal notice, both with the invite", async () => {
    const res = await notifyRdvSet(lead, apt);
    expect(res.map((r) => r.status)).toEqual(["sent", "sent"]);
    expect(sent.map((m) => m.to[0]).sort()).toEqual(["curtis@example.com", "maya@example.com"]);
    for (const m of sent) expect(m.attachments?.[0].content_type).toContain("method=REQUEST");
  });

  it("is idempotent: a second call sends nothing", async () => {
    await notifyRdvSet(lead, apt);
    const again = await notifyRdvSet(lead, apt);
    expect(again.map((r) => r.status)).toEqual(["skipped", "skipped"]);
    expect(sent).toHaveLength(2);
  });

  it("records a failure and lets a retry go through", async () => {
    failNext = true;
    const first = await notifyRdvSet(lead, apt);
    expect(first.filter((r) => r.status === "failed")).toHaveLength(1);
    expect(first.find((r) => r.status === "failed")?.error).toContain("domain not verified");
    const retry = await notifyRdvSet(lead, apt);
    expect(retry.filter((r) => r.status === "sent")).toHaveLength(1);
    expect(retry.filter((r) => r.status === "skipped")).toHaveLength(1);
  });

  it("fails visibly, without sending, when the internal inbox is missing", async () => {
    delete process.env.MAIL_INTERNAL_TO;
    const res = await notifyRdvSet(lead, apt);
    expect(res.find((r) => r.kind === "internal_rdv")?.status).toBe("failed");
    expect(sent.map((m) => m.to[0])).toEqual(["maya@example.com"]);
  });

  it("redirects lead mails in test mode, but not internal ones", async () => {
    process.env.MAIL_TEST_REDIRECT = "test@example.com";
    await notifyRdvSet(lead, apt);
    const leadMail = sent.find((m) => m.subject.startsWith("[TEST]"));
    expect(leadMail?.to).toEqual(["test@example.com"]);
    expect(leadMail?.text).toContain("il n'a PAS été envoyé à maya@example.com");
    expect(sent.some((m) => m.to[0] === "curtis@example.com" && !m.subject.startsWith("[TEST]"))).toBe(true);
  });

  it("fails without a Resend key", async () => {
    delete process.env.RESEND_API_KEY;
    const res = await notifyRdvSet(lead, apt);
    expect(res.every((r) => r.status === "failed")).toBe(true);
    expect(sent).toHaveLength(0);
  });
});

describe("reschedule / cancel", () => {
  it("a reschedule (new sequence) is a new mail, not a duplicate", async () => {
    await notifyRdvSet(lead, apt);
    const moved = { ...apt, starts_at: "2026-10-07T21:00:00Z", sequence: 1 };
    const res = await notifyRdvRescheduled(lead, moved, new Date(apt.starts_at));
    expect(res.map((r) => r.status)).toEqual(["sent", "sent"]);
  });

  it("cancel attaches a CANCEL invite", async () => {
    await notifyRdvCancelled(lead, { ...apt, status: "cancelled", sequence: 1 });
    expect(sent.every((m) => m.attachments?.[0].content_type.includes("method=CANCEL"))).toBe(true);
  });
});

describe("reminders", () => {
  it("sends each due reminder once, however often the cron runs", async () => {
    due.push(apt);
    expect((await sendDueReminders()).map((r) => r.status)).toEqual(["sent"]);
    expect((await sendDueReminders()).map((r) => r.status)).toEqual(["skipped"]);
    expect(sent[0].subject).toBe("Demain à 10:00 : notre rendez-vous");
  });

  it("points the rebook link to the booking page once the lead has a token", async () => {
    due.push(apt);
    lead.booking_token = "tok_abcdefghijklmnop";
    try {
      await sendDueReminders();
      expect(sent[0].text).toContain("https://redlinestudio.agency/rdv/tok_abcdefghijklmnop");
    } finally {
      lead.booking_token = null;
    }
  });
});

describe("notifyContact", () => {
  it("keeps the diagnostic breakdown for Curtis but not in the auto-reply", async () => {
    await notifyContact({ ...lead, source: "diagnostic" }, { message: "[Diagnostic FR] Score 42%" });
    expect(sent.find((m) => m.to[0] === "maya@example.com")?.text).not.toContain("Score 42%");
    expect(sent.find((m) => m.to[0] === "curtis@example.com")?.text).toContain("Score 42%");
  });

  it("sends the auto-reply and the internal notice once per lead", async () => {
    const res = await notifyContact(lead, { message: "Bonjour", service: "Site vitrine" });
    expect(res.map((r) => r.status)).toEqual(["sent", "sent"]);
    expect(sent.find((m) => m.to[0] === "maya@example.com")?.subject).toBe("Bien reçu, Maya : je vous réponds sous 24 h");
    expect((await notifyContact(lead, {})).map((r) => r.status)).toEqual(["skipped", "skipped"]);
  });
});
