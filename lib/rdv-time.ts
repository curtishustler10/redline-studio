// Wall-clock time in an IANA zone ⇄ instant, with no date library: Intl knows
// every zone's offset (DST included), we only need to ask it the right question.

export type ZoneOption = { id: string; label: string };

/** Zones Redline's leads actually live in. Curtis's own zone first. */
export const ZONES: ZoneOption[] = [
  { id: "Pacific/Tahiti", label: "Tahiti" },
  { id: "Pacific/Marquesas", label: "Marquises" },
  { id: "Pacific/Noumea", label: "Nouméa" },
  { id: "Europe/Paris", label: "Paris" },
  { id: "Indian/Reunion", label: "La Réunion" },
  { id: "America/Martinique", label: "Martinique" },
  { id: "America/Toronto", label: "Montréal / Toronto" },
  { id: "Australia/Brisbane", label: "Brisbane" },
  { id: "Australia/Sydney", label: "Sydney" },
  { id: "Asia/Makassar", label: "Bali" },
];

export function isValidZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Offset of `tz` from UTC at instant `at`, in minutes (Tahiti → -600, Paris in summer → +120). */
export function zoneOffsetMinutes(at: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);
  const n = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(n("year"), n("month") - 1, n("day"), n("hour"), n("minute"), n("second"));
  return Math.round((asUtc - Math.floor(at.getTime() / 1000) * 1000) / 60_000);
}

/**
 * "2026-10-07" + "09:00" in "Europe/Paris" → the matching instant. Returns null
 * for malformed input or for a wall time that does not exist (skipped by a DST
 * jump), rather than silently shifting it.
 */
export function zonedTimeToUtc(date: string, time: string, tz: string): Date | null {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const t = /^(\d{2}):(\d{2})$/.exec(time);
  if (!d || !t || !isValidZone(tz)) return null;
  const [y, mo, da, h, mi] = [+d[1], +d[2], +d[3], +t[1], +t[2]];
  if (mo < 1 || mo > 12 || da < 1 || da > 31 || h > 23 || mi > 59) return null;

  const wall = Date.UTC(y, mo - 1, da, h, mi);
  // First guess with the offset at that wall time read as UTC, then correct once:
  // the offset can differ across the ±14 h we just moved (DST boundary).
  let instant = wall - zoneOffsetMinutes(new Date(wall), tz) * 60_000;
  instant = wall - zoneOffsetMinutes(new Date(instant), tz) * 60_000;

  const back = utcToZoned(new Date(instant), tz);
  return back.date === date && back.time === time ? new Date(instant) : null;
}

/** Instant → { date: "YYYY-MM-DD", time: "HH:MM" } in `tz` (for pre-filling inputs). */
export function utcToZoned(at: Date, tz: string): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(at);
  const v = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { date: `${v("year")}-${v("month")}-${v("day")}`, time: `${v("hour")}:${v("minute")}` };
}

/**
 * Day-before reminder rule, evaluated by a once-a-day cron: the RDV falls on
 * the lead's *tomorrow* (in the lead's zone), and it was booked or last moved
 * at least 24 h ahead — a RDV set this afternoon for tomorrow morning already
 * got its confirmation, a reminder on top would be noise.
 */
export function isReminderDue(apt: { startsAt: Date; bookedAt: Date; timeZone: string }, now: Date): boolean {
  if (apt.startsAt.getTime() <= now.getTime()) return false;
  if (apt.startsAt.getTime() - apt.bookedAt.getTime() < 24 * 3_600_000) return false;
  return utcToZoned(apt.startsAt, apt.timeZone).date === utcToZoned(new Date(now.getTime() + 86_400_000), apt.timeZone).date;
}
