// Renders every notification template with sample data into a local gallery.
// Usage: npx jiti scripts/preview-emails.ts [outDir]
// Default outDir: ../redline-studio/docs/emails (the agency's local docs folder).

import fs from "fs";
import path from "path";
import { WHATSAPP_HREF } from "../lib/constants";
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
  type Appointment,
  type LeadInfo,
  type MailContext,
  type RenderedMail,
} from "../lib/email/templates";

const outDir = path.resolve(process.argv[2] ?? path.join(__dirname, "..", "..", "redline-studio", "docs", "emails"));
const SITE = "https://redlinestudio.agency";

const ctx: MailContext = { siteUrl: SITE, whatsappHref: WHATSAPP_HREF, organizerEmail: "curtis@example.com", ownerTimeZone: "Pacific/Tahiti" };
const lead: LeadInfo = { id: "L42", name: "Maya Teriitahi", email: "maya@example.com", phone: "+689 87 00 00 00", company: "Maya Hair", lang: "fr" };
const parisLead: LeadInfo = { id: "L43", name: "Julie Martin", email: "julie@example.com", company: "Café Miaou", lang: "fr" };
const appt: Appointment = { id: "A7", startsAt: new Date("2026-10-06T20:00:00Z"), durationMin: 30, mode: "phone", phone: lead.phone, timeZone: "Pacific/Tahiti", sequence: 0 };
// 07:00 UTC = 09:00 in Paris, 21:00 the evening before in Tahiti.
const visio: Appointment = { ...appt, id: "A8", startsAt: new Date("2026-10-07T07:00:00Z"), mode: "visio", location: "https://meet.google.com/abc-defg-hij", timeZone: "Europe/Paris" };
const admin = `${SITE}/admin/leads/${lead.id}`;

const mails: { file: string; group: string; trigger: string; mail: RenderedMail }[] = [
  { file: "01-rdv-confirmation", group: "RDV · lead", trigger: "Immédiat, quand le RDV est posé sur la fiche", mail: rdvConfirmation(lead, appt, ctx) },
  { file: "02-rdv-confirmation-visio-paris", group: "RDV · lead", trigger: "Idem, variante visio pour un lead à Paris", mail: rdvConfirmation(parisLead, visio, ctx) },
  { file: "03-rdv-rappel-veille", group: "RDV · lead", trigger: "J-1 (24 h avant)", mail: rdvReminder(lead, appt, ctx) },
  { file: "04-rdv-report", group: "RDV · lead", trigger: "Quand tu changes la date sur la fiche", mail: rdvRescheduled(lead, { ...appt, startsAt: new Date("2026-10-07T21:00:00Z"), sequence: 1 }, appt.startsAt, ctx) },
  { file: "05-rdv-annulation", group: "RDV · lead", trigger: "Quand tu annules le RDV", mail: rdvCancelled(lead, { ...appt, sequence: 2 }, ctx) },
  { file: "06-rdv-absent", group: "RDV · lead", trigger: "Manuel : bouton « absent » sur la fiche", mail: rdvNoShow(lead, appt, ctx) },
  {
    file: "07-rdv-suivi",
    group: "RDV · lead",
    trigger: "Manuel : après le RDV, avec ton récap",
    mail: rdvFollowUp(lead, ctx, {
      recap: ["Les réservations arrivent surtout par Messenger, souvent le soir", "Aucun pixel Meta sur le site : les pubs ne sont pas mesurées", "Objectif : 20 réservations en ligne par mois d'ici janvier"],
      nextStep: "Je vous envoie une proposition chiffrée vendredi",
      proposalHref: `${SITE}/portal`,
    }),
  },
  { file: "08-contact-reponse-auto", group: "Formulaire · visiteur", trigger: "Immédiat, à chaque envoi du formulaire", mail: contactAutoReply(lead, ctx, { service: "Site vitrine", message: "Bonjour, je voudrais que mes clientes puissent réserver en ligne sans passer par Messenger. Vous pouvez m'aider ?" }) },
  { file: "09-interne-rdv", group: "Interne · Curtis", trigger: "Immédiat, avec l'invitation pour ton agenda", mail: internalRdv(parisLead, visio, ctx, "set", `${SITE}/admin/leads/${parisLead.id}`) },
  { file: "10-interne-contact", group: "Interne · Curtis", trigger: "Immédiat, à chaque envoi du formulaire", mail: internalContact(lead, ctx, { service: "Site vitrine", message: "Bonjour, je voudrais que mes clientes puissent réserver en ligne." }, admin) },
];

fs.mkdirSync(outDir, { recursive: true });
fs.copyFileSync(path.join(__dirname, "..", "public", "email", "fil.png"), path.join(outDir, "fil.png"));

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

for (const { file, mail } of mails) {
  // The header image is absolute (prod URL) in real mails; point previews at the local copy.
  fs.writeFileSync(path.join(outDir, `${file}.html`), mail.html.replace(`${SITE}/email/fil.png`, "fil.png"));
  fs.writeFileSync(path.join(outDir, `${file}.txt`), `Objet : ${mail.subject}\n\n${mail.text}`);
  if (mail.ics) fs.writeFileSync(path.join(outDir, `${file}.ics`), mail.ics.content);
}

const cards = mails
  .map(
    ({ file, group, trigger, mail }) => `<article>
  <header><span class="group">${esc(group)}</span><h2>${esc(mail.subject)}</h2><p>${esc(trigger)}${mail.ics ? " · <b>.ics joint</b>" : ""} · <a href="${file}.txt">texte brut</a></p></header>
  <iframe src="${file}.html" loading="lazy" title="${esc(mail.subject)}"></iframe>
</article>`,
  )
  .join("\n");

fs.writeFileSync(
  path.join(outDir, "index.html"),
  `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>Redline Studio · emails de notification</title>
<style>
body{margin:0;background:#F3E9DA;font-family:'Space Grotesk',Helvetica,Arial,sans-serif;color:#1E1A17}
main{max-width:1320px;margin:0 auto;padding:48px 32px}
h1{font-family:'DM Serif Display',Georgia,serif;font-weight:400;font-size:44px;margin:0 0 8px}
.lead{color:#6F655C;margin:0 0 36px;max-width:680px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(400px,1fr));gap:24px}
article{background:#FBF6EE;border:1px solid #E4D8C6;border-radius:16px;overflow:hidden}
article header{padding:18px 20px 14px}
.group{font-size:12px;color:#C8321F}
h2{font-size:16px;margin:4px 0 6px;line-height:1.3}
article p{margin:0;font-size:13px;color:#6F655C}
article a{color:#C8321F}
iframe{width:100%;height:640px;border:0;border-top:1px solid #E4D8C6;background:#FBF6EE}
</style></head><body><main>
<h1>Emails de notification</h1>
<p class="lead">${mails.length} emails : parcours rendez-vous, formulaire de contact et notifications internes. Rendu avec des données fictives ; les fichiers .ics sont générés à côté de chaque aperçu.</p>
<div class="grid">${cards}</div>
</main></body></html>`,
);

console.log(`${mails.length} emails → ${outDir}/index.html`);
