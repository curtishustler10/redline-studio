// Self-booking availability: Curtis's working windows (in his zone) crossed with
// reasonable hours for the lead (in theirs), minus every RDV already taken.
// Pure — the page passes `now` and the busy ranges — so it is unit-tested.
import { utcToZoned, zonedTimeToUtc } from "./rdv-time";

export const OWNER_ZONE = "Pacific/Tahiti";

/**
 * Curtis's bookable windows per weekday (0 = Sunday), in Tahiti time. Redline
 * sells to mainland France, so both ends of Curtis's day face the French one:
 *  - 05:00–08:00 Tahiti = 16:00–19:00 Paris in winter (UTC+1), 17:00–20:00 in
 *    summer — the same calendar day, so Monday→Friday in Tahiti.
 *  - 19:00–24:00 Tahiti = 06:00–11:00 Paris in winter, 07:00–12:00 in summer —
 *    the next calendar day, so Sunday→Thursday in Tahiti = Monday→Friday in France.
 * LEAD_WINDOW then trims both to the lead's 08:00–20:00.
 */
const MORNING: [string, string] = ["05:00", "08:00"];
const EVENING: [string, string] = ["19:00", "24:00"];
export const OWNER_WINDOWS: Record<number, [string, string][]> = {
  0: [EVENING],
  1: [MORNING, EVENING],
  2: [MORNING, EVENING],
  3: [MORNING, EVENING],
  4: [MORNING, EVENING],
  5: [MORNING],
};

/** Hours we are willing to ask of the lead, in their own zone. */
export const LEAD_WINDOW: [string, string] = ["08:00", "20:00"];

export const SLOT_MINUTES = 30;
export const MIN_NOTICE_HOURS = 12;
export const HORIZON_DAYS = 14;

export type Range = { start: Date; end: Date };

const minutes = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

function addDays(date: string, n: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function weekday(date: string): number {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}

/** Minutes since local midnight of `at` in `tz`, plus that local date. */
function localClock(at: Date, tz: string): { date: string; min: number } {
  const z = utcToZoned(at, tz);
  return { date: z.date, min: minutes(z.time) };
}

export function availableSlots(now: Date, leadZone: string, busy: Range[], durationMin = SLOT_MINUTES): Date[] {
  const earliest = now.getTime() + MIN_NOTICE_HOURS * 3_600_000;
  const today = utcToZoned(now, OWNER_ZONE).date;
  const [leadFrom, leadTo] = LEAD_WINDOW.map(minutes);
  const out: Date[] = [];

  for (let d = 0; d <= HORIZON_DAYS; d++) {
    const date = addDays(today, d);
    for (const [from, to] of OWNER_WINDOWS[weekday(date)] ?? []) {
      for (let m = minutes(from); m + durationMin <= minutes(to); m += SLOT_MINUTES) {
        const start = zonedTimeToUtc(date, hhmm(m), OWNER_ZONE);
        if (!start || start.getTime() < earliest) continue;
        const end = new Date(start.getTime() + durationMin * 60_000);

        // Must start and end inside the lead's window on the same local day.
        const ls = localClock(start, leadZone);
        const le = localClock(end, leadZone);
        if (ls.date !== le.date || ls.min < leadFrom || le.min > leadTo) continue;

        if (busy.some((b) => start < b.end && end > b.start)) continue;
        out.push(start);
      }
    }
  }
  return out;
}

/** Slots grouped by the lead's local date, for display. */
export function groupByLeadDay(slots: Date[], leadZone: string): { date: string; slots: Date[] }[] {
  const days = new Map<string, Date[]>();
  for (const s of slots) {
    const key = utcToZoned(s, leadZone).date;
    days.set(key, [...(days.get(key) ?? []), s]);
  }
  return [...days.entries()].map(([date, list]) => ({ date, slots: list }));
}
