import { describe, expect, it } from "vitest";
import { availableSlots, groupByLeadDay } from "./slots";
import { utcToZoned } from "./rdv-time";

const local = (d: Date, tz: string) => {
  const z = utcToZoned(d, tz);
  return `${z.date} ${z.time}`;
};
const weekday = (d: Date, tz: string) => new Date(`${utcToZoned(d, tz).date}T12:00:00Z`).getUTCDay();

// Monday 2026-10-05 06:00 Tahiti = 18:00 Paris (summer time).
const now = new Date("2026-10-05T16:00:00Z");

describe("availableSlots (French market, Curtis's evenings)", () => {
  it("gives Paris leads weekday mornings 08:00–10:30 in summer", () => {
    const paris = availableSlots(now, "Europe/Paris", []);
    const times = new Set(paris.map((s) => utcToZoned(s, "Europe/Paris").time));
    expect([...times].sort()).toEqual(["08:00", "08:30", "09:00", "09:30", "10:00", "10:30"]);
    expect(paris.every((s) => weekday(s, "Europe/Paris") >= 1 && weekday(s, "Europe/Paris") <= 5)).toBe(true);
    expect(local(paris[0], "Europe/Paris")).toBe("2026-10-06 08:00"); // Tuesday = Monday 20:00 in Tahiti
  });

  it("keeps the calls inside 19:00–23:00 in Tahiti", () => {
    for (const s of availableSlots(now, "Europe/Paris", [])) {
      const t = utcToZoned(s, "Pacific/Tahiti").time;
      expect(t >= "19:00" && t <= "22:30").toBe(true);
    }
  });

  it("gives Paris leads 08:00–09:30 in winter time (one hour less)", () => {
    const winterNow = new Date("2026-11-09T16:00:00Z");
    const times = new Set(availableSlots(winterNow, "Europe/Paris", []).map((s) => utcToZoned(s, "Europe/Paris").time));
    expect([...times].sort()).toEqual(["08:00", "08:30", "09:00", "09:30"]);
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
