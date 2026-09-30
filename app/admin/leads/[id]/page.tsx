import Link from "next/link";
import { notFound } from "next/navigation";
import { getLead, listAppointments, listEmails, type AppointmentRow, type LeadRow } from "@/lib/crm";
import { bookingHref } from "@/lib/notifications";
import { ZONES, utcToZoned, zonedTimeToUtc } from "@/lib/rdv-time";
import {
  bookingLinkAction,
  closeRdvAction,
  followUpAction,
  requireAdmin,
  rescheduleRdvAction,
  setRdvAction,
  updateLeadAction,
} from "../../actions";
import { ERR_MESSAGES, MAIL_LABEL, OK_MESSAGES, OWNER_ZONE, STATUS_LABEL, STATUS_STYLE, parseMailSummary, shortDate, when, zoneLabel } from "../../_lib/ui";

export const dynamic = "force-dynamic";

const input = "w-full rounded-xl border border-[#E4D8C6] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8321F]";
const primary = "rounded-full bg-[#C8321F] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#B32A1F] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#C8321F]";
const secondary = "rounded-full border border-[#1E1A17] px-4 py-2 text-sm font-medium hover:bg-[#1E1A17] hover:text-[#FBF6EE]";
const card = "rounded-2xl border border-[#E4D8C6] bg-white p-5";

const MODE_LABEL = { phone: "Téléphone", visio: "Visio", "in-person": "Sur place" } as const;
const APT_STATUS = { scheduled: "À venir", cancelled: "Annulé", done: "Fait", no_show: "Absent" } as const;

/** Zone options for typing a time: the lead's zone first, then Curtis's, then the rest. */
function inputZones(lead: LeadRow) {
  const first = [lead.time_zone, OWNER_ZONE].filter((z, i, a) => a.indexOf(z) === i);
  return [...first.map((id) => ({ id, label: zoneLabel(id) })), ...ZONES.filter((z) => !first.includes(z.id))];
}

function DateTimeZone({ lead, at }: { lead: LeadRow; at: Date }) {
  const v = utcToZoned(at, lead.time_zone);
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <label className="text-sm">Date<input type="date" name="date" required defaultValue={v.date} className={input} /></label>
      <label className="text-sm">Heure<input type="time" name="time" required step={300} defaultValue={v.time} className={input} /></label>
      <label className="text-sm">
        Heure de
        <select name="inputZone" defaultValue={lead.time_zone} className={input}>
          {inputZones(lead).map((z) => <option key={z.id} value={z.id}>{z.label}</option>)}
        </select>
      </label>
    </div>
  );
}

function tomorrowAtTen(lead: LeadRow): Date {
  const tomorrow = new Date(Date.now() + 86_400_000);
  return zonedTimeToUtc(utcToZoned(tomorrow, lead.time_zone).date, "10:00", lead.time_zone) ?? tomorrow;
}

function ScheduledRdv({ lead, apt }: { lead: LeadRow; apt: AppointmentRow }) {
  const hidden = (
    <>
      <input type="hidden" name="leadId" value={lead.id} />
      <input type="hidden" name="appointmentId" value={apt.id} />
    </>
  );
  return (
    <div className="rounded-2xl bg-[#1E1A17] p-5 text-[#FBF6EE]">
      <p className="text-sm text-[#B9AEA2]">RDV à venir · {MODE_LABEL[apt.mode]} · {apt.duration_min} min</p>
      <p className="mt-1 text-xl font-semibold">{when(apt.starts_at, lead.time_zone)}</p>
      {lead.time_zone !== OWNER_ZONE && <p className="text-sm text-[#B9AEA2]">Chez toi : {when(apt.starts_at, OWNER_ZONE)}</p>}
      {apt.location && <p className="mt-2 text-sm break-all">{apt.location}</p>}
      {apt.phone && <p className="mt-2 text-sm">Appeler le {apt.phone}</p>}

      <div className="mt-5 flex flex-wrap gap-2">
        <form action={closeRdvAction}>
          {hidden}
          <input type="hidden" name="outcome" value="done" />
          <button className="rounded-full bg-[#FBF6EE] px-4 py-2 text-sm font-semibold text-[#1E1A17] hover:bg-white">C'est fait</button>
        </form>
        <details className="group">
          <summary className="cursor-pointer list-none rounded-full border border-[#FBF6EE]/40 px-4 py-2 text-sm hover:border-[#FBF6EE]">Absent…</summary>
          <form action={closeRdvAction} className="mt-2">
            {hidden}
            <input type="hidden" name="outcome" value="no_show" />
            <button className="rounded-full bg-[#E03C2D] px-4 py-2 text-sm font-semibold text-white">Confirmer : envoyer « On s'est manqués »</button>
          </form>
        </details>
        <details>
          <summary className="cursor-pointer list-none rounded-full border border-[#FBF6EE]/40 px-4 py-2 text-sm hover:border-[#FBF6EE]">Annuler…</summary>
          <form action={closeRdvAction} className="mt-2">
            {hidden}
            <input type="hidden" name="outcome" value="cancelled" />
            <button className="rounded-full bg-[#E03C2D] px-4 py-2 text-sm font-semibold text-white">Confirmer l'annulation (email au lead)</button>
          </form>
        </details>
      </div>

      <details className="mt-5 rounded-xl bg-[#FBF6EE] p-4 text-[#1E1A17]">
        <summary className="cursor-pointer font-semibold">Décaler</summary>
        <form action={rescheduleRdvAction} className="mt-3 space-y-3">
          {hidden}
          <DateTimeZone lead={lead} at={new Date(apt.starts_at)} />
          <button className={primary}>Décaler et prévenir le lead</button>
        </form>
      </details>
    </div>
  );
}

function NewRdvForm({ lead }: { lead: LeadRow }) {
  return (
    <form action={setRdvAction} className="space-y-4">
      <input type="hidden" name="leadId" value={lead.id} />
      <DateTimeZone lead={lead} at={tomorrowAtTen(lead)} />
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm">
          Durée
          <select name="duration" defaultValue="30" className={input}>
            {[15, 30, 45, 60, 90].map((m) => <option key={m} value={m}>{m} min</option>)}
          </select>
        </label>
        <label className="text-sm">
          Format
          <select name="mode" defaultValue="phone" className={input}>
            <option value="phone">Téléphone (je l'appelle)</option>
            <option value="visio">Visio</option>
            <option value="in-person">Sur place</option>
          </select>
        </label>
        <label className="text-sm">
          Numéro à appeler
          <input name="phone" defaultValue={lead.phone ?? ""} placeholder="+33 …" className={input} />
        </label>
      </div>
      <label className="block text-sm">
        Lien visio ou adresse (si visio / sur place)
        <input name="location" placeholder="https://meet.google.com/… ou adresse" className={input} />
      </label>
      <p className="text-xs text-[#6F655C]">
        Le lead reçoit la confirmation (avec invitation agenda) dans son fuseau : {zoneLabel(lead.time_zone)}. Toi, la notif interne.
      </p>
      <button className={primary}>Poser le RDV et envoyer la confirmation</button>
    </form>
  );
}

function FollowUpForm({ lead, apt }: { lead: LeadRow; apt: AppointmentRow }) {
  return (
    <form action={followUpAction} className="mt-3 space-y-3">
      <input type="hidden" name="leadId" value={lead.id} />
      <input type="hidden" name="appointmentId" value={apt.id} />
      <label className="block text-sm">
        Ce qu'on s'est dit (un point par ligne)
        <textarea name="recap" required rows={4} className={input} />
      </label>
      <label className="block text-sm">Prochaine étape<input name="nextStep" required placeholder="Je vous envoie une proposition vendredi" className={input} /></label>
      <label className="block text-sm">Lien de la proposition (facultatif)<input name="proposalHref" type="url" placeholder="https://…" className={input} /></label>
      <button className={primary}>Envoyer le suivi</button>
    </form>
  );
}

export default async function LeadPage({ params, searchParams }: { params: { id: string }; searchParams: { ok?: string; err?: string; mail?: string } }) {
  await requireAdmin();
  const leadId = Number(params.id);
  if (!Number.isInteger(leadId) || leadId <= 0) notFound();
  const [lead, appointments, emails] = await Promise.all([getLead(leadId), listAppointments(leadId), listEmails(leadId)]);
  if (!lead) notFound();

  const scheduled = appointments.find((a) => a.status === "scheduled");
  const followedUp = new Set(emails.filter((e) => e.kind === "rdv_follow_up" && e.status === "sent").map((e) => e.appointment_id));
  const needsFollowUp = appointments.find((a) => a.status === "done" && !followedUp.has(a.id));
  const ok = searchParams.ok ? OK_MESSAGES[searchParams.ok] : null;
  const err = searchParams.err ? ERR_MESSAGES[searchParams.err] : null;
  const mails = parseMailSummary(searchParams.mail);
  const testRedirect = process.env.MAIL_TEST_REDIRECT?.trim();

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <Link href="/admin/leads" className="text-sm text-[#6F655C] hover:text-[#1E1A17]">← Tous les leads</Link>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">{lead.company || lead.name}</h1>
          <p className="mt-1 text-[#6F655C]">
            {lead.company && <>{lead.name} · </>}
            <a href={`mailto:${lead.email}`} className="underline decoration-[#E03C2D] underline-offset-4">{lead.email}</a>
            {lead.phone && <> · <a href={`tel:${lead.phone.replace(/\s+/g, "")}`} className="underline decoration-[#E03C2D] underline-offset-4">{lead.phone}</a></>}
          </p>
          <p className="mt-1 text-sm text-[#6F655C]">
            Arrivé le {shortDate(lead.created_at)} via {lead.source} · {zoneLabel(lead.time_zone)} · {lead.lang.toUpperCase()}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-medium ${STATUS_STYLE[lead.status]}`}>{STATUS_LABEL[lead.status]}</span>
      </header>

      {testRedirect && (
        <p className="mt-6 rounded-xl border border-dashed border-[#C8321F] px-4 py-3 text-sm">
          <b>Mode test :</b> les emails destinés aux leads partent vers {testRedirect}, marqués [TEST]. Retire <code>MAIL_TEST_REDIRECT</code> dans Vercel pour passer en réel.
        </p>
      )}

      <div id="rdv" className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="space-y-6">
          {(ok || err || mails.length > 0) && (
            <div
              role="status"
              className={`rounded-2xl p-4 text-sm ${err ? "bg-[#C8321F]/10 text-[#C8321F]" : mails.some((m) => m.status === "failed") ? "border border-[#C8321F] bg-white" : "bg-[#1F8A84]/10"}`}
            >
              {ok && <p className="font-semibold">{ok}</p>}
              {err && <p className="font-semibold">{err}</p>}
              {mails.length > 0 && (
                <ul className="mt-2 space-y-0.5">
                  {mails.map((m, i) => (
                    <li key={i}>
                      {m.status === "sent" ? "✓" : m.status === "failed" ? "✕" : "·"} {m.label} :{" "}
                      {m.status === "sent" ? "envoyé" : m.status === "failed" ? "échec (détail dans l'historique)" : "déjà envoyé, ignoré"}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className={card}>
            <h2 className="text-lg font-semibold">Rendez-vous</h2>
            <div className="mt-4">
              {scheduled ? <ScheduledRdv key={`${scheduled.id}:${scheduled.sequence}`} lead={lead} apt={scheduled} /> : <NewRdvForm key={`new:${appointments.length}`} lead={lead} />}
            </div>
          </div>

          {needsFollowUp && (
            <div className={card}>
              <h2 className="text-lg font-semibold">Suivi du RDV du {when(needsFollowUp.starts_at, OWNER_ZONE)}</h2>
              <p className="mt-1 text-sm text-[#6F655C]">Le récap part au lead avec la prochaine étape. Un seul suivi par RDV.</p>
              <FollowUpForm key={needsFollowUp.id} lead={lead} apt={needsFollowUp} />
            </div>
          )}

          <div className={card}>
            <h2 className="text-lg font-semibold">Lien de réservation</h2>
            <p className="mt-1 text-sm text-[#6F655C]">Le lead choisit lui-même son créneau ; les mêmes emails partent. Le lien sert aussi de « décaler » dans ses emails.</p>
            {lead.booking_token ? (
              <input readOnly value={bookingHref(lead.booking_token)} aria-label="Lien de réservation" className={`${input} mt-3 font-mono`} />
            ) : (
              <form action={bookingLinkAction} className="mt-3">
                <input type="hidden" name="leadId" value={lead.id} />
                <button className={secondary}>Générer le lien</button>
              </form>
            )}
          </div>

          {appointments.filter((a) => a.status !== "scheduled").length > 0 && (
            <div className={card}>
              <h2 className="text-lg font-semibold">RDV passés</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {appointments.filter((a) => a.status !== "scheduled").map((a) => (
                  <li key={a.id} className="flex justify-between gap-4">
                    <span>{when(a.starts_at, OWNER_ZONE)} · {MODE_LABEL[a.mode]}</span>
                    <span className="text-[#6F655C]">{APT_STATUS[a.status]}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <aside className="space-y-6">
          {/* key: uncontrolled fields keep their old DOM value across a server-action refresh unless the form remounts. */}
          <form key={lead.updated_at} action={updateLeadAction} className={`${card} space-y-3`}>
            <h2 className="text-lg font-semibold">Fiche</h2>
            <input type="hidden" name="leadId" value={lead.id} />
            <label className="block text-sm">
              Statut
              <select name="status" defaultValue={lead.status} className={input}>
                {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                Fuseau
                <select name="timeZone" defaultValue={lead.time_zone} className={input}>
                  {inputZones(lead).map((z) => <option key={z.id} value={z.id}>{z.label}</option>)}
                </select>
              </label>
              <label className="text-sm">
                Langue des emails
                <select name="lang" defaultValue={lead.lang} className={input}>
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                </select>
              </label>
            </div>
            <label className="block text-sm">Téléphone<input name="phone" defaultValue={lead.phone ?? ""} className={input} /></label>
            <label className="block text-sm">Entreprise<input name="company" defaultValue={lead.company ?? ""} className={input} /></label>
            <label className="block text-sm">Notes<textarea name="notes" rows={5} defaultValue={lead.notes ?? ""} className={input} /></label>
            <button className={secondary}>Enregistrer</button>
          </form>

          {(lead.message || lead.service) && (
            <div className={card}>
              <h2 className="text-lg font-semibold">Sa demande</h2>
              {lead.service && <p className="mt-2 text-sm font-medium">{lead.service}</p>}
              {lead.message && <p className="mt-2 whitespace-pre-wrap border-l-2 border-[#E03C2D] pl-3 text-sm text-[#6F655C]">{lead.message}</p>}
            </div>
          )}

          <div className={card}>
            <h2 className="text-lg font-semibold">Emails envoyés</h2>
            {emails.length === 0 ? (
              <p className="mt-2 text-sm text-[#6F655C]">Aucun email pour l'instant.</p>
            ) : (
              <ul className="mt-3 space-y-3 text-sm">
                {emails.map((e) => (
                  <li key={e.id}>
                    <div className="flex justify-between gap-3">
                      <span className="font-medium">{MAIL_LABEL[e.kind]}</span>
                      <span className={e.status === "sent" ? "text-[#1F8A84]" : e.status === "failed" ? "text-[#C8321F]" : "text-[#6F655C]"}>
                        {e.status === "sent" ? "envoyé" : e.status === "failed" ? "échec" : "en cours"}
                      </span>
                    </div>
                    <div className="text-[#6F655C]">{shortDate(e.sent_at ?? e.created_at)} · {e.recipient}</div>
                    {e.error && <div className="text-[#C8321F]">{e.error}</div>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
