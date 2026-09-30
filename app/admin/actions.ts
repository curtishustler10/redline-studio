"use server";

// Every admin mutation. Each one re-checks the session (server actions are
// public endpoints), persists first, then notifies — a failed mail never undoes
// a saved RDV; it shows up on the lead file instead. Outcomes travel back as
// short codes in the query string, mapped to French messages by the page.

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ADMIN_COOKIE, SESSION_MS, checkPassword, isLockedOut, signAdmin, verifyAdmin } from "@/lib/admin-auth";
import {
  CrmError,
  DEFAULT_LEAD_ZONE,
  clearLoginFailures,
  closeAppointment,
  createLead,
  ensureBookingToken,
  getAppointment,
  getLead,
  recentLoginFailures,
  recordLoginFailure,
  rescheduleAppointment,
  scheduleAppointment,
  updateLead,
  type LeadPatch,
  type LeadStatus,
} from "@/lib/crm";
import { notifyNoShow, notifyRdvCancelled, notifyRdvRescheduled, notifyRdvSet, sendFollowUp, type Delivery } from "@/lib/notifications";
import { isValidZone, zonedTimeToUtc } from "@/lib/rdv-time";
import type { RdvMode } from "@/lib/email/templates";

// ─── Session ─────────────────────────────────────────────────────────────────

/** Redirects to the login screen unless the caller holds a valid admin session. */
export async function requireAdmin(): Promise<void> {
  if (!verifyAdmin(cookies().get(ADMIN_COOKIE)?.value)) redirect("/admin?err=auth");
}

function clientIp(): string {
  return (headers().get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
}

export async function adminLogin(formData: FormData): Promise<void> {
  const ip = clientIp();
  if (isLockedOut(await recentLoginFailures(ip))) redirect("/admin?err=locked");
  if (!checkPassword(String(formData.get("password") ?? ""))) {
    await recordLoginFailure(ip);
    redirect("/admin?err=password");
  }
  await clearLoginFailures(ip);
  cookies().set(ADMIN_COOKIE, signAdmin(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: SESSION_MS / 1000,
  });
  redirect("/admin/leads");
}

export async function adminLogout(): Promise<void> {
  cookies().delete({ name: ADMIN_COOKIE, path: "/admin" });
  redirect("/admin");
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUSES: LeadStatus[] = ["new", "contacted", "rdv", "proposal", "won", "lost"];
const MODES: RdvMode[] = ["phone", "visio", "in-person"];

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function id(formData: FormData, key: string): number {
  const n = Number(formData.get(key));
  if (!Number.isInteger(n) || n <= 0) redirect("/admin/leads?err=invalid");
  return n;
}

function back(leadId: number, params: Record<string, string>): never {
  revalidatePath(`/admin/leads/${leadId}`);
  revalidatePath("/admin/leads");
  redirect(`/admin/leads/${leadId}?${new URLSearchParams(params).toString()}#rdv`);
}

function mailSummary(deliveries: Delivery | Delivery[]): string {
  return [deliveries].flat().map((d) => `${d.kind}:${d.status}`).join(",");
}

function crmErr(e: unknown): string {
  // No redirect() is ever called inside the try blocks that feed this, so only real errors land here.
  if (e instanceof CrmError) return e.code;
  console.error("[admin]", e);
  return "server";
}

/** Reads date + time + the zone they were typed in; rejects the past. */
function readInstant(formData: FormData, leadId: number): Date {
  const zone = str(formData, "inputZone");
  const at = zonedTimeToUtc(str(formData, "date"), str(formData, "time"), zone);
  if (!at) back(leadId, { err: "invalid_time" });
  if (at.getTime() < Date.now() + 5 * 60_000) back(leadId, { err: "past" });
  return at;
}

// ─── Leads ───────────────────────────────────────────────────────────────────

export async function createLeadAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const name = str(formData, "name");
  const email = str(formData, "email");
  const zone = str(formData, "timeZone") || DEFAULT_LEAD_ZONE;
  if (!name || !email || !isValidZone(zone)) redirect("/admin/leads?err=invalid");
  let leadId: number;
  try {
    const lead = await createLead({
      name,
      email,
      phone: str(formData, "phone") || undefined,
      company: str(formData, "company") || undefined,
      lang: str(formData, "lang") === "en" ? "en" : "fr",
      timeZone: zone,
      source: "manual",
      service: str(formData, "service") || undefined,
    });
    leadId = lead.id;
  } catch (e) {
    console.error("[admin] createLead", e);
    redirect("/admin/leads?err=invalid");
  }
  revalidatePath("/admin/leads");
  redirect(`/admin/leads/${leadId}?ok=lead_created`);
}

export async function updateLeadAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const leadId = id(formData, "leadId");
  const status = str(formData, "status") as LeadStatus;
  const zone = str(formData, "timeZone");
  const patch: LeadPatch = {
    notes: str(formData, "notes") || null,
    phone: str(formData, "phone") || null,
    company: str(formData, "company") || null,
    lang: str(formData, "lang") === "en" ? "en" : "fr",
  };
  if (STATUSES.includes(status)) patch.status = status;
  if (isValidZone(zone)) patch.time_zone = zone;
  try {
    await updateLead(leadId, patch);
  } catch (e) {
    back(leadId, { err: crmErr(e) });
  }
  back(leadId, { ok: "saved" });
}

export async function bookingLinkAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const leadId = id(formData, "leadId");
  try {
    await ensureBookingToken(leadId);
  } catch (e) {
    back(leadId, { err: crmErr(e) });
  }
  back(leadId, { ok: "link" });
}

// ─── RDV ─────────────────────────────────────────────────────────────────────

export async function setRdvAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const leadId = id(formData, "leadId");
  const lead = await getLead(leadId);
  if (!lead) redirect("/admin/leads?err=not_found");

  const mode = str(formData, "mode") as RdvMode;
  const location = str(formData, "location");
  if (!MODES.includes(mode)) back(leadId, { err: "invalid" });
  if (mode === "visio" && !/^https:\/\//i.test(location)) back(leadId, { err: "visio_link" });
  const durationMin = Number(str(formData, "duration")) || 30;
  const startsAt = readInstant(formData, leadId);

  let summary = "";
  try {
    const apt = await scheduleAppointment(leadId, {
      startsAt,
      durationMin,
      mode,
      location: mode === "phone" ? undefined : location,
      phone: mode === "phone" ? str(formData, "phone") || lead.phone || undefined : undefined,
      // The RDV is always shown to the lead in the lead's own zone, whatever zone Curtis typed in.
      timeZone: lead.time_zone,
      bookedVia: "admin",
    });
    if (lead.status === "new" || lead.status === "contacted") await updateLead(leadId, { status: "rdv" });
    summary = mailSummary(await notifyRdvSet(lead, apt));
  } catch (e) {
    back(leadId, { err: crmErr(e) });
  }
  back(leadId, { ok: "rdv_set", mail: summary });
}

export async function rescheduleRdvAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const leadId = id(formData, "leadId");
  const aptId = id(formData, "appointmentId");
  const startsAt = readInstant(formData, leadId);
  let summary = "";
  try {
    const lead = await getLead(leadId);
    if (!lead) throw new CrmError("Lead introuvable.", "not_found");
    const { appointment, previousStartsAt } = await rescheduleAppointment(aptId, startsAt);
    summary = mailSummary(await notifyRdvRescheduled(lead, appointment, previousStartsAt));
  } catch (e) {
    back(leadId, { err: crmErr(e) });
  }
  back(leadId, { ok: "rdv_moved", mail: summary });
}

export async function closeRdvAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const leadId = id(formData, "leadId");
  const aptId = id(formData, "appointmentId");
  const outcome = str(formData, "outcome");
  if (outcome !== "cancelled" && outcome !== "done" && outcome !== "no_show") back(leadId, { err: "invalid" });
  let summary = "";
  try {
    const lead = await getLead(leadId);
    if (!lead) throw new CrmError("Lead introuvable.", "not_found");
    const apt = await closeAppointment(aptId, outcome);
    if (outcome === "cancelled") summary = mailSummary(await notifyRdvCancelled(lead, apt));
    if (outcome === "no_show") summary = mailSummary(await notifyNoShow(lead, apt));
  } catch (e) {
    back(leadId, { err: crmErr(e) });
  }
  back(leadId, { ok: `rdv_${outcome}`, ...(summary ? { mail: summary } : {}) });
}

export async function followUpAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const leadId = id(formData, "leadId");
  const aptId = id(formData, "appointmentId");
  const recap = str(formData, "recap")
    .split(/\r?\n/)
    .map((l) => l.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean);
  const nextStep = str(formData, "nextStep");
  const proposalHref = str(formData, "proposalHref");
  if (recap.length === 0 || !nextStep) back(leadId, { err: "followup_empty" });
  if (proposalHref && !/^https:\/\//i.test(proposalHref)) back(leadId, { err: "invalid" });
  let summary = "";
  try {
    const [lead, apt] = await Promise.all([getLead(leadId), getAppointment(aptId)]);
    if (!lead || !apt || apt.lead_id !== leadId) throw new CrmError("Rendez-vous introuvable.", "not_found");
    summary = mailSummary(await sendFollowUp(lead, apt, { recap, nextStep, proposalHref: proposalHref || undefined }));
    if (lead.status === "rdv") await updateLead(leadId, { status: "proposal" });
  } catch (e) {
    back(leadId, { err: crmErr(e) });
  }
  back(leadId, { ok: "followup", mail: summary });
}
