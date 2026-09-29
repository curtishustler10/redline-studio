// Notification workflows: which mails go out for each CRM event, deduplicated
// through email_log. SERVER-ONLY.
//
// Contract for every workflow: the triggering change (RDV saved, lead created)
// is ALREADY persisted by the caller. Mails are sent after, each one claimed in
// email_log first, so a double click or a retried cron is a no-op and a failed
// send is recorded (and retryable) without ever undoing the RDV.
import "server-only";
import { WHATSAPP_HREF } from "./constants";
import {
  claimEmail,
  markEmailFailed,
  markEmailSent,
  appointmentsDueForReminder,
  getLead,
  toAppointment,
  toLeadInfo,
  type AppointmentRow,
  type EmailKind,
  type LeadRow,
} from "./crm";
import { internalInbox, mailReplyTo, sendEmail } from "./email/send";
import {
  contactAutoReply,
  internalContact,
  internalRdv,
  rdvCancelled,
  rdvConfirmation,
  rdvFollowUp,
  rdvNoShow,
  rdvReminder,
  rdvRescheduled,
  type ContactSubmission,
  type FollowUp,
  type MailContext,
  type RdvEvent,
  type RenderedMail,
} from "./email/templates";

export type DeliveryStatus = "sent" | "skipped" | "failed";
export type Delivery = { kind: EmailKind; status: DeliveryStatus; error?: string };

const OWNER_TIME_ZONE = "Pacific/Tahiti";

function siteUrl(): string {
  return (process.env.SITE_URL?.trim() || "https://redlinestudio.agency").replace(/\/+$/, "");
}

export function adminHref(leadId: number): string {
  return `${siteUrl()}/admin/leads/${leadId}`;
}

export function bookingHref(token: string): string {
  return `${siteUrl()}/rdv/${token}`;
}

function mailContext(lead: LeadRow): MailContext {
  return {
    siteUrl: siteUrl(),
    whatsappHref: WHATSAPP_HREF,
    organizerEmail: mailReplyTo() ?? "hello@redlinestudio.agency",
    ownerTimeZone: OWNER_TIME_ZONE,
    // Once a lead has a booking link, "move it" / "book again" points there instead of WhatsApp.
    rebookHref: lead.booking_token ? bookingHref(lead.booking_token) : undefined,
  };
}

/** Claim → send → record. The one path every mail takes. */
async function deliver(
  args: { lead: LeadRow; appointmentId?: number; kind: EmailKind; dedupeKey: string; to: string | null; audience: "lead" | "internal" },
  mail: RenderedMail,
): Promise<Delivery> {
  const { lead, kind } = args;
  if (!args.to) {
    // Recorded as a failure so the gap shows up on the lead file instead of vanishing.
    const id = await claimEmail({ leadId: lead.id, appointmentId: args.appointmentId, kind, dedupeKey: args.dedupeKey, recipient: "(aucun)", subject: mail.subject });
    const error = args.audience === "internal" ? "MAIL_INTERNAL_TO absente : notification interne non envoyée." : "Le lead n'a pas d'email.";
    if (id !== null) await markEmailFailed(id, error);
    return { kind, status: id === null ? "skipped" : "failed", error };
  }

  const id = await claimEmail({ leadId: lead.id, appointmentId: args.appointmentId, kind, dedupeKey: args.dedupeKey, recipient: args.to, subject: mail.subject });
  if (id === null) return { kind, status: "skipped" };

  const result = await sendEmail({ to: args.to, subject: mail.subject, html: mail.html, text: mail.text, ics: mail.ics, audience: args.audience });
  if (result.ok) {
    await markEmailSent(id, result.id);
    return { kind, status: "sent" };
  }
  await markEmailFailed(id, result.error);
  console.error(`[mail] ${args.dedupeKey} → ${result.error}`);
  return { kind, status: "failed", error: result.error };
}

function aptKey(kind: EmailKind, apt: AppointmentRow, suffix = ""): string {
  return `${kind}:apt:${apt.id}:seq:${apt.sequence}${suffix}`;
}

async function toLeadAndInternal(
  lead: LeadRow,
  apt: AppointmentRow,
  leadMail: { kind: EmailKind; mail: RenderedMail },
  event: RdvEvent,
): Promise<Delivery[]> {
  const ctx = mailContext(lead);
  const internal = internalRdv(toLeadInfo(lead), toAppointment(apt), ctx, event, adminHref(lead.id));
  return Promise.all([
    deliver({ lead, appointmentId: apt.id, kind: leadMail.kind, dedupeKey: aptKey(leadMail.kind, apt), to: lead.email, audience: "lead" }, leadMail.mail),
    deliver({ lead, appointmentId: apt.id, kind: "internal_rdv", dedupeKey: aptKey("internal_rdv", apt, `:${event}`), to: internalInbox(), audience: "internal" }, internal),
  ]);
}

// ─── RDV lifecycle ───────────────────────────────────────────────────────────

export async function notifyRdvSet(lead: LeadRow, apt: AppointmentRow): Promise<Delivery[]> {
  const mail = rdvConfirmation(toLeadInfo(lead), toAppointment(apt), mailContext(lead));
  return toLeadAndInternal(lead, apt, { kind: "rdv_confirmation", mail }, "set");
}

export async function notifyRdvRescheduled(lead: LeadRow, apt: AppointmentRow, previousStartsAt: Date): Promise<Delivery[]> {
  const mail = rdvRescheduled(toLeadInfo(lead), toAppointment(apt), previousStartsAt, mailContext(lead));
  return toLeadAndInternal(lead, apt, { kind: "rdv_rescheduled", mail }, "rescheduled");
}

export async function notifyRdvCancelled(lead: LeadRow, apt: AppointmentRow): Promise<Delivery[]> {
  const mail = rdvCancelled(toLeadInfo(lead), toAppointment(apt), mailContext(lead));
  return toLeadAndInternal(lead, apt, { kind: "rdv_cancelled", mail }, "cancelled");
}

export async function notifyNoShow(lead: LeadRow, apt: AppointmentRow): Promise<Delivery> {
  const mail = rdvNoShow(toLeadInfo(lead), toAppointment(apt), mailContext(lead));
  return deliver({ lead, appointmentId: apt.id, kind: "rdv_no_show", dedupeKey: aptKey("rdv_no_show", apt), to: lead.email, audience: "lead" }, mail);
}

/** One follow-up per appointment: the recap belongs to that meeting. */
export async function sendFollowUp(lead: LeadRow, apt: AppointmentRow, followUp: FollowUp): Promise<Delivery> {
  const mail = rdvFollowUp(toLeadInfo(lead), mailContext(lead), followUp);
  return deliver({ lead, appointmentId: apt.id, kind: "rdv_follow_up", dedupeKey: `rdv_follow_up:apt:${apt.id}`, to: lead.email, audience: "lead" }, mail);
}

/** Cron entry point: sends every day-before reminder that is due. Safe to run any number of times. */
export async function sendDueReminders(now: Date = new Date()): Promise<Delivery[]> {
  const due = await appointmentsDueForReminder(now);
  const out: Delivery[] = [];
  for (const apt of due) {
    const lead = await getLead(apt.lead_id);
    if (!lead) continue;
    const mail = rdvReminder(toLeadInfo(lead), toAppointment(apt), mailContext(lead));
    out.push(await deliver({ lead, appointmentId: apt.id, kind: "rdv_reminder", dedupeKey: aptKey("rdv_reminder", apt), to: lead.email, audience: "lead" }, mail));
  }
  return out;
}

// ─── Contact form ────────────────────────────────────────────────────────────

export async function notifyContact(lead: LeadRow, submission: ContactSubmission): Promise<Delivery[]> {
  const info = toLeadInfo(lead);
  const ctx = mailContext(lead);
  // A diagnostic "message" is a score breakdown written for Curtis, not words the visitor
  // typed: the auto-reply only quotes genuine messages; the internal notice gets everything.
  const forLead = lead.source === "diagnostic" ? { ...submission, message: undefined } : submission;
  return Promise.all([
    deliver({ lead, kind: "contact_auto_reply", dedupeKey: `contact_auto_reply:lead:${lead.id}`, to: lead.email, audience: "lead" }, contactAutoReply(info, ctx, forLead)),
    deliver(
      { lead, kind: "internal_contact", dedupeKey: `internal_contact:lead:${lead.id}`, to: internalInbox(), audience: "internal" },
      internalContact(info, ctx, submission, adminHref(lead.id)),
    ),
  ]);
}
