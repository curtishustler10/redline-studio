import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findLeadByToken, getScheduledAppointment, listBusyRanges } from "@/lib/crm";
import { formatWhen } from "@/lib/email/templates";
import { ZONES, isValidZone, utcToZoned } from "@/lib/rdv-time";
import { HORIZON_DAYS, SLOT_MINUTES, availableSlots, groupByLeadDay } from "@/lib/slots";
import { bookSlot } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Réserver un appel · Redline Studio",
  // Personal link: never indexed.
  robots: { index: false, follow: false },
};

const COPY = {
  fr: {
    hello: (n: string) => `Bonjour ${n},`,
    title: "Choisissez le moment qui vous arrange",
    sub: "Un appel de 30 minutes : nous vous appelons, vous n'avez rien à installer.",
    current: "Votre rendez-vous actuel",
    move: "Pour le décaler, choisissez simplement un autre créneau ci-dessous.",
    zone: "Heures affichées pour",
    change: "Changer",
    phone: "Votre numéro (nous vous appelons dessus)",
    book: "Réserver ce créneau",
    none: "Plus aucun créneau libre dans les deux semaines à venir. Écrivez-nous et nous trouverons un moment.",
    booked: "C'est réservé ! La confirmation arrive par email, avec l'invitation pour votre agenda.",
    moved: "C'est décalé. Le nouveau créneau arrive par email, et l'invitation met votre agenda à jour.",
    err: {
      taken: "Ce créneau vient d'être pris. Choisissez-en un autre.",
      phone: "Indiquez un numéro de téléphone pour que nous puissions vous appeler.",
      slot: "Choisissez un créneau.",
      server: "Un souci technique est survenu. Réessayez dans un instant.",
    } as Record<string, string>,
  },
  en: {
    hello: (n: string) => `Hi ${n},`,
    title: "Pick a time that suits you",
    sub: "A 30-minute call: we'll ring you, nothing to install.",
    current: "Your current booking",
    move: "To move it, just pick another slot below.",
    zone: "Times shown for",
    change: "Change",
    phone: "Your number (we'll call you on it)",
    book: "Book this slot",
    none: "No free slot left in the next two weeks. Message us and we'll find a time.",
    booked: "Booked! The confirmation is on its way by email, with a calendar invite.",
    moved: "Moved. The new time is on its way by email, and the invite updates your calendar.",
    err: {
      taken: "That slot was just taken. Please pick another one.",
      phone: "Please enter a phone number so we can call you.",
      slot: "Please pick a slot.",
      server: "Something went wrong on our side. Please try again in a moment.",
    } as Record<string, string>,
  },
};

const field = "w-full rounded-xl border border-[#E4D8C6] bg-white px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#C8321F]";

export default async function RdvPage({ params, searchParams }: { params: { token: string }; searchParams: { tz?: string; ok?: string; err?: string } }) {
  const lead = await findLeadByToken(params.token);
  if (!lead) notFound();

  const t = COPY[lead.lang];
  const zone = searchParams.tz && isValidZone(searchParams.tz) ? searchParams.tz : lead.time_zone;
  const now = new Date();
  const current = await getScheduledAppointment(lead.id);
  const busy = (await listBusyRanges(now, new Date(now.getTime() + (HORIZON_DAYS + 1) * 86_400_000))).filter(
    (b) => !current || b.start.getTime() !== new Date(current.starts_at).getTime(),
  );
  const days = groupByLeadDay(availableSlots(now, zone, busy, SLOT_MINUTES), zone);
  const locale = lead.lang === "fr" ? "fr-FR" : "en-GB";
  const dayLabel = (date: string) => new Intl.DateTimeFormat(locale, { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" }).format(new Date(`${date}T12:00:00Z`));
  const zones = ZONES.some((z) => z.id === zone) ? ZONES : [{ id: zone, label: zone }, ...ZONES];
  const firstName = lead.name.split(/\s+/)[0];
  const ok = searchParams.ok === "booked" ? t.booked : searchParams.ok === "moved" ? t.moved : null;
  const err = searchParams.err ? t.err[searchParams.err] : null;

  return (
    <main className="min-h-screen bg-[#FBF6EE] text-[#1E1A17]">
      <div className="mx-auto max-w-2xl px-5 py-12">
        <p className="text-lg font-semibold">
          redline <span className="font-normal text-[#6F655C]">studio</span>
        </p>

        <p className="mt-10 text-[#6F655C]">{t.hello(firstName)}</p>
        <h1 className="mt-1 font-serif text-4xl leading-tight md:text-5xl">{t.title}</h1>
        <p className="mt-3 text-[#6F655C]">{t.sub}</p>

        {ok && <p role="status" className="mt-8 rounded-2xl bg-[#1F8A84]/10 p-5 font-medium">{ok}</p>}
        {err && <p role="alert" className="mt-8 rounded-2xl bg-[#C8321F]/10 p-5 font-medium text-[#C8321F]">{err}</p>}

        {current && (
          <div className="mt-8 rounded-2xl bg-[#1E1A17] p-5 text-[#FBF6EE]">
            <p className="text-sm text-[#B9AEA2]">{t.current}</p>
            <p className="mt-1 text-xl font-semibold">{formatWhen(new Date(current.starts_at), zone, lead.lang).full}</p>
            <p className="mt-2 text-sm text-[#B9AEA2]">{t.move}</p>
          </div>
        )}

        <form method="get" className="mt-8 flex flex-wrap items-end gap-3 text-sm">
          <label className="flex-1 min-w-[12rem]">
            <span className="text-[#6F655C]">{t.zone}</span>
            <select name="tz" defaultValue={zone} className={field}>
              {zones.map((z) => <option key={z.id} value={z.id}>{z.label}</option>)}
            </select>
          </label>
          <button className="rounded-full border border-[#1E1A17] px-5 py-3 font-medium hover:bg-[#1E1A17] hover:text-[#FBF6EE]">{t.change}</button>
        </form>

        {days.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-[#E4D8C6] bg-white p-5">{t.none}</p>
        ) : (
          <form action={bookSlot} className="mt-8 space-y-8">
            <input type="hidden" name="token" value={params.token} />
            <input type="hidden" name="tz" value={zone} />
            {days.map((d) => (
              <fieldset key={d.date}>
                <legend className="font-semibold first-letter:uppercase">{dayLabel(d.date)}</legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {d.slots.map((s) => (
                    <label key={s.toISOString()} className="cursor-pointer">
                      <input type="radio" name="slot" value={s.toISOString()} required className="peer sr-only" />
                      <span className="inline-block rounded-full border border-[#E4D8C6] bg-white px-4 py-2 text-sm transition-colors peer-checked:border-[#C8321F] peer-checked:bg-[#C8321F] peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-[#C8321F] peer-focus-visible:ring-offset-2 hover:border-[#1E1A17]">
                        {utcToZoned(s, zone).time}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
            <label className="block">
              <span className="text-sm text-[#6F655C]">{t.phone}</span>
              <input name="phone" type="tel" required autoComplete="tel" defaultValue={lead.phone ?? ""} className={field} />
            </label>
            <button className="w-full rounded-full bg-[#C8321F] py-4 text-base font-semibold text-white hover:bg-[#B32A1F] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C8321F] focus-visible:ring-offset-2 sm:w-auto sm:px-10">
              {t.book}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
