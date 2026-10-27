import { describe, expect, it } from "vitest";
import { availableSlots, groupByLeadDay } from "./slots";
import { utcToZoned } from "./rdv-time";

const weekday = (d: Date, tz: string) => new Date(`${utcToZoned(d, tz).date}T12:00:00Z`).getUTCDay();

// Monday 2026-10-05 06:00 Tahiti = 18:00 Paris (summer time).
const now = new Date("2026-10-05T16:00:00Z");

describe("availableSlots (French market, both ends of Curtis's day)", () => {
  const timesOf = (slots: Date[]) => [...new Set(slots.map((s) => utcToZoned(s, "Europe/Paris").time))].sort();

  it("gives Paris leads mornings and late afternoons in summer", () => {
    const paris = availableSlots(now, "Europe/Paris", []);
    expect(timesOf(paris)).toEqual([
      "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
      "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
    ]);
    expect(paris.every((s) => weekday(s, "Europe/Paris") >= 1 && weekday(s, "Europe/Paris") <= 5)).toBe(true);
  });

  it("gives Paris leads 08:00–10:30 and 16:00–18:30 in winter", () => {
    const winterNow = new Date("2026-11-09T16:00:00Z");
    const paris = availableSlots(winterNow, "Europe/Paris", []);
    expect(timesOf(paris)).toEqual(["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30"]);
    expect(paris.every((s) => weekday(s, "Europe/Paris") >= 1 && weekday(s, "Europe/Paris") <= 5)).toBe(true);
  });

  it("keeps every call inside Curtis's 05:00–08:00 or 19:00–24:00", () => {
    for (const s of availableSlots(now, "Europe/Paris", [])) {
      const t = utcToZoned(s, "Pacific/Tahiti").time;
      expect((t >= "05:00" && t <= "07:30") || (t >= "19:00" && t <= "23:30")).toBe(true);
    }
  });

  it("removes slots overlapping an existing RDV", () => {
    const all = availableSlots(now, "Europe/Paris", []);
    const busy = [{ start: all[0], end: new Date(all[0].getTime() + 45 * 60_000) }];
    const left = availableSlots(now, "Europe/Paris", busy);
    expect(left).not.toContainEqual(all[0]);
    expect(left).not.toContainEqual(all[1]);
    expect(left).toContainEqual(all[2]);
  });

  it("never proposes a slot inside the 12 h notice", () => {
    for (const s of availableSlots(now, "Europe/Paris", [])) expect(s.getTime()).toBeGreaterThanOrEqual(now.getTime() + 12 * 3_600_000);
  });
});

describe("groupByLeadDay", () => {
  it("groups by the lead's calendar day", () => {
    const groups = groupByLeadDay(availableSlots(now, "Europe/Paris", []), "Europe/Paris");
    expect(groups.length).toBeGreaterThan(5);
    for (const g of groups) for (const s of g.slots) expect(utcToZoned(s, "Europe/Paris").date).toBe(g.date);
  });
});
