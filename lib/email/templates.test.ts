import { describe, it, expect } from "vitest";
import { buildIcs } from "./ics";
import { esc, renderEmail, safeHref } from "./layout";
import {
  contactAutoReply,
  formatWhen,
  internalContact,
  internalRdv,
  rdvCancelled,
  rdvConfirmation,
  rdvFollowUp,
  rdvNoShow,
  rdvReminder,
  rdvRescheduled,
  type Appointment,
  type LeadInfo,
  type MailContext,
} from "./templates";

const ctx: MailContext = {
  siteUrl: "https://redlinestudio.agency",
  whatsappHref: "https://wa.me/68987058275",
  organizerEmail: "curtis@example.com",
  ownerTimeZone: "Pacific/Tahiti",
};

const lead: LeadInfo = { id: "L1", name: "Maya Teriitahi", email: "maya@example.com", phone: "+689 87 00 00 00", company: "Maya Hair", lang: "fr" };

// 2026-10-06 20:00 UTC = mardi 6 octobre 10:00 à Tahiti (UTC-10, pas d'heure d'été)
const appt: Appointment = {
  id: "A1",
  startsAt: new Date("2026-10-06T20:00:00Z"),
  durationMin: 30,
  mode: "phone",
  phone: "+689 87 00 00 00",
  timeZone: "Pacific/Tahiti",
  sequence: 0,
};

describe("formatWhen", () => {
  it("formats in the lead's zone with a readable city label", () => {
    expect(formatWhen(appt.startsAt, "Pacific/Tahiti", "fr").full).toBe("mardi 6 octobre à 10:00 (heure de Tahiti)");
  });

  it("follows DST for European leads", () => {
    // 20:00 UTC in October = 22:00 in Paris (UTC+2, summer time)
    expect(formatWhen(appt.startsAt, "Europe/Paris", "fr").time).toBe("22:00");
    expect(formatWhen(appt.startsAt, "Europe/Paris", "en").zone).toBe("Paris time");
  });
});

describe("rdvConfirmation", () => {
  const mail = rdvConfirmation(lead, appt, ctx);

  it("puts date and time in the subject", () => {
    expect(mail.subject).toBe("C'est noté : notre rendez-vous du mardi 6 octobre à 10:00");
  });

  it("greets by first name and states the call format", () => {
    expect(mail.html).toContain("C&#39;est noté, Maya !");
    expect(mail.text).toContain("je vous appelle au +689 87 00 00 00");
  });

  it("attaches a REQUEST invite with a stable UID", () => {
    expect(mail.ics?.content).toContain("METHOD:REQUEST");
    expect(mail.ics?.content).toContain("UID:rdv-A1@redlinestudio.agency");
    expect(mail.ics?.content).toContain("DTSTART:20261006T200000Z");
    expect(mail.ics?.content).toContain("DTEND:20261006T203000Z");
  });

  it("shows a join button only for visio", () => {
    expect(mail.html).not.toContain("Rejoindre la visio");
    const visio = rdvConfirmation(lead, { ...appt, mode: "visio", location: "https://meet.google.com/abc-defg-hij" }, ctx);
    expect(visio.html).toContain("Rejoindre la visio");
    expect(visio.html).toContain("https://meet.google.com/abc-defg-hij");
  });

  it("renders in English for English leads", () => {
    const en = rdvConfirmation({ ...lead, lang: "en" }, appt, ctx);
    expect(en.subject).toBe("Confirmed: our meeting on Tuesday 6 October at 10:00");
    expect(en.html).toContain('lang="en"');
  });
});

describe("reminder", () => {
  it("says tomorrow and keeps the reschedule link", () => {
    const mail = rdvReminder(lead, appt, ctx);
    expect(mail.subject).toBe("Demain à 10:00 : notre rendez-vous");
    expect(mail.text).toContain("Besoin de décaler ? Écrivez-moi : https://wa.me/68987058275");
  });
});

describe("reschedule and cancel", () => {
  it("reschedule shows both times and bumps the invite sequence on the same UID", () => {
    const moved = { ...appt, startsAt: new Date("2026-10-07T21:00:00Z"), sequence: 1 };
    const mail = rdvRescheduled(lead, moved, appt.startsAt, ctx);
    expect(mail.text).toContain("Nouvelle date : mercredi 7 octobre à 11:00");
    expect(mail.text).toContain("Au lieu de : mardi 6 octobre à 10:00");
    expect(mail.ics?.content).toContain("SEQUENCE:1");
    expect(mail.ics?.content).toContain("UID:rdv-A1@redlinestudio.agency");
  });

  it("cancel sends a CANCEL invite", () => {
    const mail = rdvCancelled(lead, { ...appt, sequence: 2 }, ctx);
    expect(mail.ics?.content).toContain("METHOD:CANCEL");
    expect(mail.ics?.content).toContain("STATUS:CANCELLED");
    expect(mail.ics?.filename).toBe("rdv-redline-annule.ics");
  });
});

describe("follow-up and no-show", () => {
  it("follow-up lists the recap and next step", () => {
    const mail = rdvFollowUp(lead, ctx, { recap: ["Refonte de la page d'accueil", "Pixel Meta à installer"], nextStep: "Devis envoyé vendredi" });
    expect(mail.text).toContain("> • Pixel Meta à installer");
    expect(mail.text).toContain("Prochaine étape : Devis envoyé vendredi");
    expect(mail.ics).toBeUndefined();
  });

  it("no-show offers a new slot via the rebook link", () => {
    const mail = rdvNoShow(lead, appt, { ...ctx, rebookHref: "https://redlinestudio.agency/rdv/tok" });
    expect(mail.html).toContain("https://redlinestudio.agency/rdv/tok");
  });
});

describe("contact form", () => {
  it("auto-reply quotes the message, escaped", () => {
    const mail = contactAutoReply(lead, ctx, { message: "Mon site <script>alert(1)</script> ne vend pas" });
    expect(mail.html).toContain("&lt;script&gt;");
    expect(mail.html).not.toContain("<script>");
    expect(mail.subject).toBe("Bien reçu, Maya : je vous réponds sous 24 h");
  });

  it("auto-reply works without a message", () => {
    expect(contactAutoReply(lead, ctx, {}).text).not.toContain("vous m'avez écrit");
  });

  it("internal contact has no signature and links to reply", () => {
    const mail = internalContact(lead, ctx, { message: "Bonjour", service: "Site vitrine" });
    expect(mail.subject).toBe("[Contact] Maya Teriitahi (Site vitrine)");
    expect(mail.text).not.toContain("WhatsApp :");
    expect(mail.html).toContain("mailto:maya@example.com");
  });
});

describe("internal RDV", () => {
  it("shows Curtis's time and the lead's time when zones differ", () => {
    const paris = { ...appt, timeZone: "Europe/Paris" };
    const mail = internalRdv({ ...lead, company: undefined }, paris, ctx, "set", "https://redlinestudio.agency/admin/leads/L1");
    expect(mail.text).toContain("Quand (chez toi) : mardi 6 octobre à 10:00 (heure de Tahiti)");
    expect(mail.text).toContain("Chez le lead : mardi 6 octobre à 22:00 (heure de Paris)");
    expect(mail.subject).toBe("[RDV] RDV pris · Maya Teriitahi · mardi 6 octobre 10:00");
  });
});

describe("layout safety", () => {
  it("drops non-https links", () => {
    expect(safeHref("javascript:alert(1)")).toBeNull();
    expect(safeHref("http://insecure.test")).toBeNull();
    const { html } = renderEmail({ lang: "fr", preheader: "p", title: "t", blocks: [], cta: { label: "x", href: "javascript:alert(1)" } }, ctx);
    expect(html).not.toContain("javascript:");
  });

  it("escapes quotes", () => {
    expect(esc(`"a'<b>`)).toBe("&quot;a&#39;&lt;b&gt;");
  });
});

describe("buildIcs", () => {
  it("uses CRLF and folds long lines under 75 octets", () => {
    const ics = buildIcs({
      uid: "u",
      sequence: 0,
      method: "REQUEST",
      start: appt.startsAt,
      durationMin: 30,
      summary: "Réunion ".repeat(20),
      organizer: { name: "O", email: "o@example.com" },
      attendee: { name: "A", email: "a@example.com" },
      now: new Date("2026-01-01T00:00:00Z"),
    });
    const lines = ics.split("\r\n");
    expect(lines.every((l) => new TextEncoder().encode(l).length <= 75)).toBe(true);
    expect(lines.some((l) => l.startsWith(" "))).toBe(true);
    expect(ics).toContain("DTSTAMP:20260101T000000Z");
  });

  it("escapes separators in text", () => {
    const ics = buildIcs({
      uid: "u",
      sequence: 0,
      method: "REQUEST",
      start: appt.startsAt,
      durationMin: 30,
      summary: "A, B; C",
      organizer: { name: "O", email: "o@example.com" },
      attendee: { name: 'Jean "JJ"', email: "a@example.com" },
    });
    expect(ics).toContain("SUMMARY:A\\, B\\; C");
    expect(ics).toContain(`ATTENDEE;CN="Jean 'JJ'"`);
  });
});
