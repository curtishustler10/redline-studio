import { describe, expect, it } from "vitest";
import { availableSlots, groupByLeadDay } from "./slots";
import { utcToZoned } from "./rdv-time";

const local = (d: Date, tz: string) => {
  const z = utcToZoned(d, tz);
  return `${z.date} ${z.time}`;
};

// Monday 2026-10-05 06:00 Tahiti (16:00 UTC)
const now = new Date("2026-10-05T16:00:00Z");

describe("availableSlots", () => {
  it("offers Tahiti leads the working windows, with 12 h notice and weekdays only", () => {
    const slots = availableSlots(now, "Pacific/Tahiti", []);
    const first = local(slots[0], "Pacific/Tahiti");
    expect(first).toBe("2026-10-05 19:00"); // 08:00–17:30 today is inside the 12 h notice
    const days = new Set(slots.map((s) => new Date(`${utcToZoned(s, "Pacific/Tahiti").date}T12:00:00Z`).getUTCDay()));
    expect([...days].every((d) => d >= 1 && d <= 5)).toBe(true);
    // Lead window stops at 20:00 local, so no 20:00 / 20:30 slot for a Tahiti lead.
    expect(slots.map((s) => local(s, "Pacific/Tahiti")).some((l) => l.endsWith("20:00"))).toBe(false);
  });

  it("gives Paris leads morning slots in summer time", () => {
    const paris = availableSlots(now, "Europe/Paris", []).map((s) => local(s, "Europe/Paris"));
    expect(paris.length).toBeGreaterThan(0);
    expect(paris.every((l) => l.slice(11) >= "08:00" && l.slice(11) <= "19:30")).toBe(true);
    expect(paris).toContain("2026-10-07 08:00"); // = Tuesday 20:00 in Tahiti
  });

  it("gives Paris leads evening slots in winter time", () => {
    const winterNow = new Date("2026-11-09T16:00:00Z"); // Monday, Paris on UTC+1
    const paris = availableSlots(winterNow, "Europe/Paris", []).map((s) => local(s, "Europe/Paris"));
    expect(paris).toContain("2026-11-10 19:00"); // = Tuesday 08:00 in Tahiti
    expect(paris.some((l) => l.slice(11) < "12:00")).toBe(false);
  });

  it("removes slots overlapping an existing RDV", () => {
    const all = availableSlots(now, "Pacific/Tahiti", []);
    const busy = [{ start: all[0], end: new Date(all[0].getTime() + 45 * 60_000) }];
    const left = availableSlots(now, "Pacific/Tahiti", busy);
    expect(left).not.toContainEqual(all[0]);
    expect(left).not.toContainEqual(all[1]); // 19:30 overlaps a 19:00–19:45 meeting
    expect(left).toContainEqual(all[2]);
  });

  it("never proposes a slot inside the notice period", () => {
    for (const s of availableSlots(now, "Australia/Sydney", [])) expect(s.getTime()).toBeGreaterThanOrEqual(now.getTime() + 12 * 3_600_000);
  });
});

describe("groupByLeadDay", () => {
  it("groups by the lead's calendar day", () => {
    const groups = groupByLeadDay(availableSlots(now, "Europe/Paris", []), "Europe/Paris");
    expect(groups[0].date < groups[1].date).toBe(true);
    for (const g of groups) for (const s of g.slots) expect(utcToZoned(s, "Europe/Paris").date).toBe(g.date);
  });
});
