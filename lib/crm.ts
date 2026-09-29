// All Postgres access for the CRM: leads, appointments, email log, admin login
// attempts. SERVER-ONLY (goes through lib/db). Callers get typed rows and plain
// errors; the mapping to email-template inputs lives here too so the admin
// actions, the cron and the booking page all build mails from the same data.
import "server-only";
import { getDb } from "./db";
import { LOCKOUT_WINDOW_MS, newBookingToken } from "./admin-auth";
import { isReminderDue } from "./rdv-time";
import type { Appointment, LeadInfo, RdvMode } from "./email/templates";

// ─── Types ───────────────────────────────────────────────────────────────────

export type LeadStatus = "new" | "contacted" | "rdv" | "proposal" | "won" | "lost";
export type LeadSource = "form" | "chat" | "diagnostic" | "whatsapp" | "manual";
export type AppointmentStatus = "scheduled" | "cancelled" | "done" | "no_show";
export type EmailKind =
  | "rdv_confirmation"
  | "rdv_reminder"
  | "rdv_rescheduled"
  | "rdv_cancelled"
  | "rdv_no_show"
  | "rdv_follow_up"
  | "contact_auto_reply"
  | "internal_rdv"
  | "internal_contact";

export type LeadRow = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  lang: "fr" | "en";
  time_zone: string;
  source: LeadSource;
  service: string | null;
  message: string | null;
  status: LeadStatus;
  notes: string | null;
  booking_token: string | null;
  created_at: string;
  updated_at: string;
};

export type AppointmentRow = {
  id: number;
  lead_id: number;
  starts_at: string;
  /** Maintained by a trigger: starts_at + duration_min. */
  ends_at: string;
  duration_min: number;
  mode: RdvMode;
  location: string | null;
  phone: string | null;
  time_zone: string;
  status: AppointmentStatus;
  sequence: number;
  booked_via: "admin" | "booking_link";
  created_at: string;
  updated_at: string;
};

export type EmailLogRow = {
  id: number;
  lead_id: number;
  appointment_id: number | null;
  kind: EmailKind;
  dedupe_key: string;
  recipient: string;
  subject: string;
  status: "pending" | "sent" | "failed";
  provider_id: string | null;
  error: string | null;
  created_at: string;
  sent_at: string | null;
};

/** Thrown when the database refuses an operation for a business reason the UI should explain. */
export class CrmError extends Error {
  constructor(
    message: string,
    readonly code: "already_scheduled" | "not_found" | "not_scheduled" | "conflict" | "slot_taken",
  ) {
    super(message);
  }
}

const UNIQUE_VIOLATION = "23505";
/** appointments_no_overlap: Curtis already has a RDV in that time range. */
const EXCLUSION_VIOLATION = "23P01";
const slotTaken = () => new CrmError("Ce créneau chevauche un autre RDV.", "slot_taken");

function fail(op: string, error: { message: string }): never {
  throw new Error(`${op}: ${error.message}`);
}

// ─── Mapping to template inputs ──────────────────────────────────────────────

export function toLeadInfo(row: LeadRow): LeadInfo {
  return {
    id: String(row.id),
    name: row.name,
    email: row.email,
    phone: row.phone ?? undefined,
    company: row.company ?? undefined,
    lang: row.lang,
  };
}

export function toAppointment(row: AppointmentRow): Appointment {
  return {
    id: String(row.id),
    startsAt: new Date(row.starts_at),
    durationMin: row.duration_min,
    mode: row.mode,
    location: row.location ?? undefined,
    phone: row.phone ?? undefined,
    timeZone: row.time_zone,
    sequence: row.sequence,
  };
}

// ─── Leads ───────────────────────────────────────────────────────────────────

export type NewLead = {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  lang?: "fr" | "en";
  timeZone?: string;
  source: LeadSource;
  service?: string;
  message?: string;
};

export async function createLead(input: NewLead): Promise<LeadRow> {
  const { data, error } = await getDb()
    .from("leads")
    .insert({
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone?.trim() || null,
      company: input.company?.trim() || null,
      lang: input.lang ?? "fr",
      time_zone: input.timeZone ?? "Pacific/Tahiti",
      source: input.source,
      service: input.service?.trim() || null,
      message: input.message?.trim() || null,
    })
    .select()
    .single();
  if (error) fail("createLead", error);
  return data as LeadRow;
}

export async function listLeads(opts: { status?: LeadStatus; limit?: number } = {}): Promise<LeadRow[]> {
  let q = getDb().from("leads").select().order("created_at", { ascending: false }).limit(opts.limit ?? 200);
  if (opts.status) q = q.eq("status", opts.status);
  const { data, error } = await q;
  if (error) fail("listLeads", error);
  return (data ?? []) as LeadRow[];
}

export async function getLead(id: number): Promise<LeadRow | null> {
  const { data, error } = await getDb().from("leads").select().eq("id", id).maybeSingle();
  if (error) fail("getLead", error);
  return data as LeadRow | null;
}

export type LeadPatch = Partial<Pick<LeadRow, "status" | "notes" | "phone" | "company" | "lang" | "time_zone" | "name" | "email">>;

export async function updateLead(id: number, patch: LeadPatch): Promise<LeadRow> {
  const { data, error } = await getDb().from("leads").update(patch).eq("id", id).select().maybeSingle();
  if (error) fail("updateLead", error);
  if (!data) throw new CrmError("Lead introuvable.", "not_found");
  return data as LeadRow;
}

/** Returns the lead's booking token, creating it once. */
export async function ensureBookingToken(leadId: number): Promise<string> {
  const lead = await getLead(leadId);
  if (!lead) throw new CrmError("Lead introuvable.", "not_found");
  if (lead.booking_token) return lead.booking_token;
  const token = newBookingToken();
  // `is null` guard: if two clicks race, the second update matches nothing and we re-read the winner.
  const { error } = await getDb().from("leads").update({ booking_token: token }).eq("id", leadId).is("booking_token", null);
  if (error) fail("ensureBookingToken", error);
  const fresh = await getLead(leadId);
  return fresh?.booking_token ?? token;
}

export async function findLeadByToken(token: string): Promise<LeadRow | null> {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return null;
  const { data, error } = await getDb().from("leads").select().eq("booking_token", token).maybeSingle();
  if (error) fail("findLeadByToken", error);
  return data as LeadRow | null;
}

// ─── Appointments ────────────────────────────────────────────────────────────

export async function listAppointments(leadId: number): Promise<AppointmentRow[]> {
  const { data, error } = await getDb().from("appointments").select().eq("lead_id", leadId).order("starts_at", { ascending: false });
  if (error) fail("listAppointments", error);
  return (data ?? []) as AppointmentRow[];
}

export async function getAppointment(id: number): Promise<AppointmentRow | null> {
  const { data, error } = await getDb().from("appointments").select().eq("id", id).maybeSingle();
  if (error) fail("getAppointment", error);
  return data as AppointmentRow | null;
}

export async function getScheduledAppointment(leadId: number): Promise<AppointmentRow | null> {
  const { data, error } = await getDb().from("appointments").select().eq("lead_id", leadId).eq("status", "scheduled").maybeSingle();
  if (error) fail("getScheduledAppointment", error);
  return data as AppointmentRow | null;
}

/** Time ranges already taken by upcoming RDVs between `from` and `to` (all leads). */
export async function listBusyRanges(from: Date, to: Date): Promise<{ start: Date; end: Date }[]> {
  const { data, error } = await getDb()
    .from("appointments")
    .select("starts_at, ends_at")
    .eq("status", "scheduled")
    .lt("starts_at", to.toISOString())
    .gt("ends_at", from.toISOString());
  if (error) fail("listBusyRanges", error);
  return ((data ?? []) as { starts_at: string; ends_at: string }[]).map((r) => ({ start: new Date(r.starts_at), end: new Date(r.ends_at) }));
}

/** Every upcoming RDV, soonest first — one query for the leads list instead of one per row. */
export async function listScheduledAppointments(): Promise<AppointmentRow[]> {
  const { data, error } = await getDb().from("appointments").select().eq("status", "scheduled").order("starts_at", { ascending: true });
  if (error) fail("listScheduledAppointments", error);
  return (data ?? []) as AppointmentRow[];
}

export type NewAppointment = {
  startsAt: Date;
  durationMin: number;
  mode: RdvMode;
  location?: string;
  phone?: string;
  timeZone: string;
  bookedVia: "admin" | "booking_link";
};

export async function scheduleAppointment(leadId: number, input: NewAppointment): Promise<AppointmentRow> {
  const { data, error } = await getDb()
    .from("appointments")
    .insert({
      lead_id: leadId,
      starts_at: input.startsAt.toISOString(),
      duration_min: input.durationMin,
      mode: input.mode,
      location: input.location?.trim() || null,
      phone: input.phone?.trim() || null,
      time_zone: input.timeZone,
      booked_via: input.bookedVia,
    })
    .select()
    .single();
  if (error?.code === UNIQUE_VIOLATION) {
    throw new CrmError("Ce lead a déjà un rendez-vous à venir : décale-le ou annule-le d'abord.", "already_scheduled");
  }
  if (error?.code === EXCLUSION_VIOLATION) throw slotTaken();
  if (error) fail("scheduleAppointment", error);
  return data as AppointmentRow;
}

/**
 * Moves a scheduled appointment and bumps its calendar sequence. Optimistic on
 * `sequence`: if someone else changed it meanwhile, nothing is updated and the
 * caller gets a conflict instead of silently overwriting.
 */
export async function rescheduleAppointment(
  id: number,
  startsAt: Date,
): Promise<{ appointment: AppointmentRow; previousStartsAt: Date }> {
  const current = await getAppointment(id);
  if (!current) throw new CrmError("Rendez-vous introuvable.", "not_found");
  if (current.status !== "scheduled") throw new CrmError("Ce rendez-vous n'est plus à venir.", "not_scheduled");
  const { data, error } = await getDb()
    .from("appointments")
    .update({ starts_at: startsAt.toISOString(), sequence: current.sequence + 1 })
    .eq("id", id)
    .eq("sequence", current.sequence)
    .select()
    .maybeSingle();
  if (error?.code === EXCLUSION_VIOLATION) throw slotTaken();
  if (error) fail("rescheduleAppointment", error);
  if (!data) throw new CrmError("Le rendez-vous vient d'être modifié ailleurs, recharge la page.", "conflict");
  return { appointment: data as AppointmentRow, previousStartsAt: new Date(current.starts_at) };
}

/** Closes a scheduled appointment. Cancelling bumps the sequence (the .ics CANCEL must outrank the last REQUEST). */
export async function closeAppointment(id: number, status: Exclude<AppointmentStatus, "scheduled">): Promise<AppointmentRow> {
  const current = await getAppointment(id);
  if (!current) throw new CrmError("Rendez-vous introuvable.", "not_found");
  if (current.status !== "scheduled") throw new CrmError("Ce rendez-vous n'est plus à venir.", "not_scheduled");
  const { data, error } = await getDb()
    .from("appointments")
    .update({ status, sequence: status === "cancelled" ? current.sequence + 1 : current.sequence })
    .eq("id", id)
    .eq("status", "scheduled")
    .select()
    .maybeSingle();
  if (error) fail("closeAppointment", error);
  if (!data) throw new CrmError("Le rendez-vous vient d'être modifié ailleurs, recharge la page.", "conflict");
  return data as AppointmentRow;
}

/** Scheduled appointments whose day-before reminder is due now (see isReminderDue). */
export async function appointmentsDueForReminder(now: Date = new Date()): Promise<AppointmentRow[]> {
  const until = new Date(now.getTime() + 48 * 3_600_000);
  const { data, error } = await getDb()
    .from("appointments")
    .select()
    .eq("status", "scheduled")
    .gt("starts_at", now.toISOString())
    .lte("starts_at", until.toISOString());
  if (error) fail("appointmentsDueForReminder", error);
  return ((data ?? []) as AppointmentRow[]).filter((a) =>
    isReminderDue({ startsAt: new Date(a.starts_at), bookedAt: new Date(a.updated_at), timeZone: a.time_zone }, now),
  );
}

// ─── Email log (idempotency) ─────────────────────────────────────────────────

export type EmailClaim = {
  leadId: number;
  appointmentId?: number;
  kind: EmailKind;
  dedupeKey: string;
  recipient: string;
  subject: string;
};

/**
 * Reserves the right to send one email. Returns the log id, or null when the
 * same dedupe key was already claimed (duplicate click, retried cron) — the
 * caller must then NOT send. A previously failed claim is re-armed so a retry
 * can go through.
 */
export async function claimEmail(claim: EmailClaim): Promise<number | null> {
  const row = {
    lead_id: claim.leadId,
    appointment_id: claim.appointmentId ?? null,
    kind: claim.kind,
    dedupe_key: claim.dedupeKey,
    recipient: claim.recipient,
    subject: claim.subject,
  };
  const { data, error } = await getDb().from("email_log").insert(row).select("id").single();
  if (!error) return (data as { id: number }).id;
  if (error.code !== UNIQUE_VIOLATION) fail("claimEmail", error);

  const { data: retried, error: retryError } = await getDb()
    .from("email_log")
    .update({ status: "pending", error: null, recipient: claim.recipient, subject: claim.subject })
    .eq("dedupe_key", claim.dedupeKey)
    .eq("status", "failed")
    .select("id")
    .maybeSingle();
  if (retryError) fail("claimEmail(retry)", retryError);
  return retried ? (retried as { id: number }).id : null;
}

export async function markEmailSent(id: number, providerId: string | null): Promise<void> {
  const { error } = await getDb().from("email_log").update({ status: "sent", provider_id: providerId, sent_at: new Date().toISOString() }).eq("id", id);
  if (error) fail("markEmailSent", error);
}

export async function markEmailFailed(id: number, message: string): Promise<void> {
  const { error } = await getDb().from("email_log").update({ status: "failed", error: message.slice(0, 1000) }).eq("id", id);
  if (error) fail("markEmailFailed", error);
}

export async function listEmails(leadId: number): Promise<EmailLogRow[]> {
  const { data, error } = await getDb().from("email_log").select().eq("lead_id", leadId).order("created_at", { ascending: false });
  if (error) fail("listEmails", error);
  return (data ?? []) as EmailLogRow[];
}

// ─── Admin login attempts ────────────────────────────────────────────────────

export async function recordLoginFailure(ip: string): Promise<void> {
  const { error } = await getDb().from("admin_login_attempts").insert({ ip: ip.slice(0, 100) });
  if (error) console.error(`recordLoginFailure: ${error.message}`);
}

/** Recent failures for one IP. Fails open: the password is the real gate, the lockout a speed bump. */
export async function recentLoginFailures(ip: string): Promise<Date[]> {
  const since = new Date(Date.now() - LOCKOUT_WINDOW_MS).toISOString();
  const { data, error } = await getDb().from("admin_login_attempts").select("at").eq("ip", ip).gte("at", since);
  if (error) {
    console.error(`recentLoginFailures: ${error.message}`);
    return [];
  }
  return (data ?? []).map((r) => new Date(String((r as { at: string }).at)));
}

export async function clearLoginFailures(ip: string): Promise<void> {
  const { error } = await getDb().from("admin_login_attempts").delete().eq("ip", ip);
  if (error) console.error(`clearLoginFailures: ${error.message}`);
}
