// Notification templates: appointment (RDV) lifecycle + contact form.
// Pure functions — no I/O — so they are unit-tested and previewable. Sending,
// persistence and scheduling live elsewhere and only call these.
//
// Lead-facing mails: first person ("je"), vouvoiement, one clear action.
// Internal mails: French only, facts first, link straight to the lead file.

import { buildIcs } from "./ics";
import { renderEmail, type Block, type BrandContext, type EmailContent, type Lang, type Link } from "./layout";

export type RdvMode = "phone" | "visio" | "in-person";

export type Appointment = {
  id: string;
  startsAt: Date;
  durationMin: number;
  mode: RdvMode;
  /** Visio URL for "visio", street address for "in-person". */
  location?: string;
  /** Number Curtis will call for "phone". */
  phone?: string;
  /** IANA zone the lead lives in — every lead-facing time is shown in it. */
  timeZone: string;
  /** 0 on creation, +1 on each reschedule/cancel (calendar update ordering). */
  sequence: number;
};

export type LeadInfo = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  lang: Lang;
};

export type MailContext = BrandContext & {
  /** Real inbox that receives replies and owns the calendar event. */
  organizerEmail: string;
  /** Curtis's zone, used for internal mails. */
  ownerTimeZone: string;
  /** Where "reschedule" / "book again" points. Defaults to WhatsApp. */
  rebookHref?: string;
};

export type RenderedMail = {
  subject: string;
  html: string;
  text: string;
  ics?: { filename: string; content: string };
};

// ─── Formatting ──────────────────────────────────────────────────────────────

const LOCALE: Record<Lang, string> = { fr: "fr-FR", en: "en-GB" };

/** "Pacific/Tahiti" → "Tahiti", "America/Port_of_Spain" → "Port of Spain". */
function zoneCity(timeZone: string): string {
  return (timeZone.split("/").pop() ?? timeZone).replace(/_/g, " ");
}

export function formatWhen(at: Date, timeZone: string, lang: Lang): { date: string; time: string; zone: string; full: string } {
  const date = new Intl.DateTimeFormat(LOCALE[lang], { timeZone, weekday: "long", day: "numeric", month: "long" }).format(at);
  const time = new Intl.DateTimeFormat(LOCALE[lang], { timeZone, hour: "2-digit", minute: "2-digit" }).format(at);
  const zone = lang === "fr" ? `heure de ${zoneCity(timeZone)}` : `${zoneCity(timeZone)} time`;
  const full = lang === "fr" ? `${date} à ${time} (${zone})` : `${date} at ${time} (${zone})`;
  return { date, time, zone, full };
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name.trim();
}

function truncate(s: string, max: number): string {
  const t = s.trim();
  return t.length <= max ? t : `${t.slice(0, max - 1).trimEnd()}…`;
}

const T = {
  fr: {
    when: "Quand",
    duration: "Durée",
    format: "Format",
    minutes: (n: number) => `${n} minutes`,
    phone: (p?: string) => (p ? `Appel téléphonique, je vous appelle au ${p}` : "Appel téléphonique, je vous appelle"),
    visio: "Visio",
    inPerson: "Sur place",
    joinVisio: "Rejoindre la visio",
    rebook: "Besoin de décaler ? Écrivez-moi",
    icsNote: "l'invitation est jointe : un clic et c'est dans votre agenda",
    summary: "Rendez-vous avec Curtis · Redline Studio",
  },
  en: {
    when: "When",
    duration: "Length",
    format: "Format",
    minutes: (n: number) => `${n} minutes`,
    phone: (p?: string) => (p ? `Phone call, I'll call you on ${p}` : "Phone call, I'll call you"),
    visio: "Video call",
    inPerson: "In person",
    joinVisio: "Join the video call",
    rebook: "Need to move it? Just tell me",
    icsNote: "the invite is attached: one click and it's in your calendar",
    summary: "Meeting with Curtis · Redline Studio",
  },
} as const;

function modeRow(appt: Appointment, lang: Lang): { label: string; value: string; href?: string } {
  const t = T[lang];
  // Just the word, linked: raw meeting URLs wrap badly in the details table. The text version still prints the URL.
  if (appt.mode === "visio") return { label: t.format, value: t.visio, href: appt.location };
  if (appt.mode === "in-person") return { label: t.format, value: appt.location ? `${t.inPerson}\n${appt.location}` : t.inPerson };
  return { label: t.format, value: t.phone(appt.phone) };
}

function appointmentDetails(appt: Appointment, lang: Lang): Block {
  const t = T[lang];
  return {
    kind: "details",
    rows: [
      { label: t.when, value: formatWhen(appt.startsAt, appt.timeZone, lang).full },
      { label: t.duration, value: t.minutes(appt.durationMin) },
      modeRow(appt, lang),
    ],
  };
}

function visioCta(appt: Appointment, lang: Lang): Link | undefined {
  return appt.mode === "visio" && appt.location ? { label: T[lang].joinVisio, href: appt.location } : undefined;
}

function rebookLink(ctx: MailContext, label: string): Link {
  return { label, href: ctx.rebookHref ?? ctx.whatsappHref };
}

function uidFor(appt: Appointment, ctx: MailContext): string {
  return `rdv-${appt.id}@${new URL(ctx.siteUrl).hostname}`;
}

function icsFor(appt: Appointment, lead: LeadInfo, ctx: MailContext, method: "REQUEST" | "CANCEL"): RenderedMail["ics"] {
  const t = T[lead.lang];
  const location = appt.mode === "phone" ? (appt.phone ? `${t.phone(appt.phone)}` : undefined) : appt.location;
  return {
    filename: method === "CANCEL" ? "rdv-redline-annule.ics" : "rdv-redline.ics",
    content: buildIcs({
      uid: uidFor(appt, ctx),
      sequence: appt.sequence,
      method,
      start: appt.startsAt,
      durationMin: appt.durationMin,
      summary: t.summary,
      location,
      organizer: { name: "Curtis · Redline Studio", email: ctx.organizerEmail },
      attendee: { name: lead.name, email: lead.email },
    }),
  };
}

function build(content: EmailContent, subject: string, ctx: MailContext, ics?: RenderedMail["ics"]): RenderedMail {
  const { html, text } = renderEmail(content, ctx);
  return { subject, html, text, ...(ics ? { ics } : {}) };
}

// ─── Lead-facing: appointment lifecycle ─────────────────────────────────────

/** Sent the moment an appointment is set on the lead file. */
export function rdvConfirmation(lead: LeadInfo, appt: Appointment, ctx: MailContext): RenderedMail {
  const { lang } = lead;
  const w = formatWhen(appt.startsAt, appt.timeZone, lang);
  const fr = lang === "fr";
  return build(
    {
      lang,
      preheader: fr ? `Rendez-vous le ${w.date} à ${w.time}. Tout est dans ce mail.` : `See you on ${w.date} at ${w.time}. Everything is in this email.`,
      title: fr ? `C'est noté, ${firstName(lead.name)} !` : `You're booked in, ${firstName(lead.name)}!`,
      blocks: [
        { kind: "p", text: fr ? "Merci pour votre confiance. Voici le récapitulatif de notre rendez-vous :" : "Thanks for your trust. Here is everything about our meeting:" },
        appointmentDetails(appt, lang),
        {
          kind: "p",
          text: fr
            ? "Pour que ce moment vous soit vraiment utile, notez si vous pouvez deux choses : ce qui vous prend le plus de temps aujourd'hui, et ce que vous aimeriez voir changer dans les trois prochains mois. Pas besoin de préparer plus."
            : "To make the most of it, jot down two things if you can: what takes up most of your time today, and what you'd like to see change in the next three months. No need to prepare anything else.",
        },
        { kind: "note", text: T[lang].icsNote },
      ],
      cta: visioCta(appt, lang),
      secondary: rebookLink(ctx, T[lang].rebook),
    },
    fr ? `C'est noté : notre rendez-vous du ${w.date} à ${w.time}` : `Confirmed: our meeting on ${w.date} at ${w.time}`,
    ctx,
    icsFor(appt, lead, ctx, "REQUEST"),
  );
}

/** Sent 24 h before (skipped by the scheduler when the RDV was booked less than a day ahead). */
export function rdvReminder(lead: LeadInfo, appt: Appointment, ctx: MailContext): RenderedMail {
  const { lang } = lead;
  const w = formatWhen(appt.startsAt, appt.timeZone, lang);
  const fr = lang === "fr";
  return build(
    {
      lang,
      preheader: fr ? `Demain à ${w.time}. Toujours bon pour vous ?` : `Tomorrow at ${w.time}. Still good for you?`,
      title: fr ? `À demain, ${firstName(lead.name)} !` : `See you tomorrow, ${firstName(lead.name)}!`,
      blocks: [
        { kind: "p", text: fr ? "Petit rappel pour notre rendez-vous de demain :" : "A quick reminder about our meeting tomorrow:" },
        appointmentDetails(appt, lang),
        {
          kind: "p",
          text: fr
            ? "Si un imprévu arrive, prévenez-moi simplement : on trouvera un autre créneau, sans problème."
            : "If something comes up, just let me know and we'll find another slot, no problem.",
        },
      ],
      cta: visioCta(appt, lang),
      secondary: rebookLink(ctx, T[lang].rebook),
    },
    fr ? `Demain à ${w.time} : notre rendez-vous` : `Tomorrow at ${w.time}: our meeting`,
    ctx,
  );
}

/** `appt` carries the new time and a bumped sequence; the same UID updates the calendar entry. */
export function rdvRescheduled(lead: LeadInfo, appt: Appointment, previousStartsAt: Date, ctx: MailContext): RenderedMail {
  const { lang } = lead;
  const fr = lang === "fr";
  const w = formatWhen(appt.startsAt, appt.timeZone, lang);
  const before = formatWhen(previousStartsAt, appt.timeZone, lang);
  const details: Block = {
    kind: "details",
    rows: [
      { label: fr ? "Nouvelle date" : "New time", value: w.full },
      { label: fr ? "Au lieu de" : "Instead of", value: before.full },
      { label: T[lang].duration, value: T[lang].minutes(appt.durationMin) },
      modeRow(appt, lang),
    ],
  };
  return build(
    {
      lang,
      preheader: fr ? `Nouveau créneau : ${w.date} à ${w.time}.` : `New time: ${w.date} at ${w.time}.`,
      title: fr ? "C'est décalé, pas de souci" : "Moved, no problem",
      blocks: [
        { kind: "p", text: fr ? `${firstName(lead.name)}, notre rendez-vous est déplacé. Voici le nouveau créneau :` : `${firstName(lead.name)}, our meeting has moved. Here is the new slot:` },
        details,
        { kind: "note", text: fr ? "l'invitation jointe met votre agenda à jour" : "the attached invite updates your calendar" },
      ],
      cta: visioCta(appt, lang),
      secondary: rebookLink(ctx, T[lang].rebook),
    },
    fr ? `Nouveau créneau : ${w.date} à ${w.time}` : `New time: ${w.date} at ${w.time}`,
    ctx,
    icsFor(appt, lead, ctx, "REQUEST"),
  );
}

export function rdvCancelled(lead: LeadInfo, appt: Appointment, ctx: MailContext): RenderedMail {
  const { lang } = lead;
  const fr = lang === "fr";
  const w = formatWhen(appt.startsAt, appt.timeZone, lang);
  return build(
    {
      lang,
      preheader: fr ? "C'est annulé. La porte reste ouverte." : "It's cancelled. The door stays open.",
      title: fr ? "Notre rendez-vous est annulé" : "Our meeting is cancelled",
      blocks: [
        { kind: "p", text: fr ? `Bonjour ${firstName(lead.name)}, comme convenu, j'ai annulé notre rendez-vous du ${w.full}.` : `Hi ${firstName(lead.name)}, as agreed, I've cancelled our meeting on ${w.full}.` },
        {
          kind: "p",
          text: fr
            ? "Quand vous voudrez en reparler, répondez simplement à ce mail ou écrivez-moi sur WhatsApp."
            : "Whenever you want to pick it up again, just reply to this email or message me on WhatsApp.",
        },
        { kind: "note", text: fr ? "l'invitation jointe retire le créneau de votre agenda" : "the attached invite removes it from your calendar" },
      ],
      cta: rebookLink(ctx, fr ? "Reprendre rendez-vous" : "Book another time"),
    },
    fr ? `Rendez-vous annulé : ${w.date} à ${w.time}` : `Cancelled: our meeting on ${w.date} at ${w.time}`,
    ctx,
    icsFor(appt, lead, ctx, "CANCEL"),
  );
}

export type FollowUp = {
  /** What we agreed on, one point per line — written by Curtis after the call. */
  recap: string[];
  nextStep: string;
  /** Link to the proposal / quote, if one was sent. */
  proposalHref?: string;
};

/** Sent manually after the meeting, once Curtis has written the recap. */
export function rdvFollowUp(lead: LeadInfo, ctx: MailContext, f: FollowUp): RenderedMail {
  const { lang } = lead;
  const fr = lang === "fr";
  const blocks: Block[] = [
    { kind: "p", text: fr ? "Comme promis, voici l'essentiel de ce qu'on s'est dit :" : "As promised, here is the gist of what we discussed:" },
    { kind: "quote", text: f.recap.map((l) => `• ${l}`).join("\n") },
    { kind: "details", rows: [{ label: fr ? "Prochaine étape" : "Next step", value: f.nextStep }] },
    { kind: "p", text: fr ? "Une question d'ici là ? Répondez simplement à ce mail." : "Any question in the meantime? Just reply to this email." },
  ];
  return build(
    {
      lang,
      preheader: fr ? `Le récap de notre échange et la prochaine étape.` : `A recap of our chat and the next step.`,
      title: fr ? `Merci pour ce moment, ${firstName(lead.name)}` : `Thanks for your time, ${firstName(lead.name)}`,
      blocks,
      cta: f.proposalHref ? { label: fr ? "Voir la proposition" : "See the proposal", href: f.proposalHref } : undefined,
    },
    fr ? "Suite à notre échange" : "Following up on our chat",
    ctx,
  );
}

export function rdvNoShow(lead: LeadInfo, appt: Appointment, ctx: MailContext): RenderedMail {
  const { lang } = lead;
  const fr = lang === "fr";
  const w = formatWhen(appt.startsAt, appt.timeZone, lang);
  return build(
    {
      lang,
      preheader: fr ? "Aucun souci, ça arrive. On choisit un autre moment ?" : "No worries, it happens. Shall we pick another time?",
      title: fr ? "On s'est manqués" : "We missed each other",
      blocks: [
        {
          kind: "p",
          text: fr
            ? `Bonjour ${firstName(lead.name)}, je n'ai pas réussi à vous joindre à ${w.time} comme prévu. Aucun souci, ça arrive à tout le monde.`
            : `Hi ${firstName(lead.name)}, I couldn't reach you at ${w.time} as planned. No worries, it happens to everyone.`,
        },
        { kind: "p", text: fr ? "Si vous voulez toujours en parler, dites-moi quel moment vous arrange :" : "If you'd still like to talk, tell me what time suits you:" },
      ],
      cta: rebookLink(ctx, fr ? "Choisir un nouveau créneau" : "Pick a new time"),
    },
    fr ? "On s'est manqués" : "We missed each other",
    ctx,
  );
}

// ─── Lead-facing: contact form ──────────────────────────────────────────────

export type ContactSubmission = { message?: string; service?: string };

/** Auto-reply to anyone who writes through the site form. */
export function contactAutoReply(lead: LeadInfo, ctx: MailContext, sub: ContactSubmission): RenderedMail {
  const { lang } = lead;
  const fr = lang === "fr";
  const blocks: Block[] = [
    {
      kind: "p",
      text: fr
        ? "Merci pour votre message. Je le lis personnellement et je vous réponds sous 24 h (jours ouvrés)."
        : "Thanks for your message. I read every one myself and will reply within 24 hours (business days).",
    },
  ];
  if (sub.message?.trim()) {
    blocks.push({ kind: "p", text: fr ? "Pour rappel, vous m'avez écrit :" : "For reference, you wrote:" }, { kind: "quote", text: truncate(sub.message, 500) });
  }
  blocks.push(
    { kind: "p", text: fr ? "Si c'est urgent, ou si vous préférez en parler de vive voix :" : "If it's urgent, or you'd rather talk it through:" },
  );
  return build(
    {
      lang,
      preheader: fr ? "Votre message est bien arrivé. Réponse sous 24 h." : "Your message arrived safely. Reply within 24 hours.",
      title: fr ? `Bien reçu, ${firstName(lead.name)} !` : `Got it, ${firstName(lead.name)}!`,
      blocks,
      cta: { label: fr ? "M'écrire sur WhatsApp" : "Message me on WhatsApp", href: ctx.whatsappHref },
    },
    fr ? `Bien reçu, ${firstName(lead.name)} : je vous réponds sous 24 h` : `Got it, ${firstName(lead.name)}: I'll reply within 24 hours`,
    ctx,
  );
}

// ─── Internal (Curtis) ──────────────────────────────────────────────────────

export type RdvEvent = "set" | "rescheduled" | "cancelled";

const EVENT_LABEL: Record<RdvEvent, string> = { set: "RDV pris", rescheduled: "RDV décalé", cancelled: "RDV annulé" };

function leadRows(lead: LeadInfo): { label: string; value: string; href?: string }[] {
  return [
    { label: "Lead", value: lead.company ? `${lead.name} · ${lead.company}` : lead.name },
    { label: "Email", value: lead.email, href: `mailto:${lead.email}` },
    ...(lead.phone ? [{ label: "Téléphone", value: lead.phone, href: `tel:${lead.phone.replace(/\s+/g, "")}` }] : []),
  ];
}

export function internalRdv(lead: LeadInfo, appt: Appointment, ctx: MailContext, event: RdvEvent, adminHref: string): RenderedMail {
  const mine = formatWhen(appt.startsAt, ctx.ownerTimeZone, "fr");
  const theirs = appt.timeZone === ctx.ownerTimeZone ? null : formatWhen(appt.startsAt, appt.timeZone, "fr");
  const who = lead.company || lead.name;
  const content: EmailContent = {
    lang: "fr",
    internal: true,
    preheader: `${who} · ${mine.date} à ${mine.time}`,
    title: `${EVENT_LABEL[event]} : ${who}`,
    blocks: [
      {
        kind: "details",
        rows: [
          { label: "Quand (chez toi)", value: mine.full },
          ...(theirs ? [{ label: "Chez le lead", value: theirs.full }] : []),
          modeRow(appt, "fr"),
          ...leadRows(lead),
        ],
      },
    ],
    cta: { label: "Ouvrir la fiche", href: adminHref },
  };
  // Curtis's own calendar gets the same UID, so reschedule/cancel update it too.
  const ics = icsFor(appt, lead, ctx, event === "cancelled" ? "CANCEL" : "REQUEST");
  return build(content, `[RDV] ${EVENT_LABEL[event]} · ${who} · ${mine.date} ${mine.time}`, ctx, ics);
}

export function internalContact(lead: LeadInfo, ctx: MailContext, sub: ContactSubmission, adminHref?: string): RenderedMail {
  const blocks: Block[] = [
    { kind: "details", rows: [...leadRows(lead), ...(sub.service ? [{ label: "Besoin", value: sub.service }] : []), { label: "Langue", value: lead.lang.toUpperCase() }] },
  ];
  if (sub.message?.trim()) blocks.push({ kind: "quote", text: sub.message.trim() });
  blocks.push({ kind: "note", text: "réponse automatique envoyée, promesse : 24 h" });
  return build(
    {
      lang: "fr",
      internal: true,
      preheader: truncate(sub.message ?? sub.service ?? lead.email, 90),
      title: `Nouveau contact : ${lead.name}`,
      blocks,
      cta: adminHref ? { label: "Ouvrir la fiche", href: adminHref } : { label: "Répondre", href: `mailto:${lead.email}` },
    },
    `[Contact] ${lead.name}${sub.service ? ` (${sub.service})` : ""}`,
    ctx,
  );
}
