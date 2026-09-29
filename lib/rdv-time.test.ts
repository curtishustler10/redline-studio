import { describe, expect, it } from "vitest";
import { isReminderDue, isValidZone, utcToZoned, zoneOffsetMinutes, zonedTimeToUtc } from "./rdv-time";

describe("zoneOffsetMinutes", () => {
  it("knows fixed and DST zones", () => {
    expect(zoneOffsetMinutes(new Date("2026-07-01T00:00:00Z"), "Pacific/Tahiti")).toBe(-600);
    expect(zoneOffsetMinutes(new Date("2026-07-01T00:00:00Z"), "Europe/Paris")).toBe(120);
    expect(zoneOffsetMinutes(new Date("2026-01-01T00:00:00Z"), "Europe/Paris")).toBe(60);
    expect(zoneOffsetMinutes(new Date("2026-01-01T00:00:00Z"), "Pacific/Marquesas")).toBe(-570);
  });
});

describe("zonedTimeToUtc", () => {
  it("converts Tahiti wall time (UTC-10, no DST)", () => {
    expect(zonedTimeToUtc("2026-10-06", "10:00", "Pacific/Tahiti")?.toISOString()).toBe("2026-10-06T20:00:00.000Z");
  });

  it("converts Paris in summer and in winter", () => {
    expect(zonedTimeToUtc("2026-10-07", "09:00", "Europe/Paris")?.toISOString()).toBe("2026-10-07T07:00:00.000Z");
    expect(zonedTimeToUtc("2026-11-05", "09:00", "Europe/Paris")?.toISOString()).toBe("2026-11-05T08:00:00.000Z");
  });

  it("handles the day of the DST switch", () => {
    // Paris leaves summer time on 2026-10-25 at 03:00 → 02:00.
    expect(zonedTimeToUtc("2026-10-25", "10:00", "Europe/Paris")?.toISOString()).toBe("2026-10-25T09:00:00.000Z");
  });

  it("rejects a wall time skipped by DST", () => {
    // 2026-03-29 02:30 does not exist in Paris (02:00 → 03:00).
    expect(zonedTimeToUtc("2026-03-29", "02:30", "Europe/Paris")).toBeNull();
  });

  it("rejects malformed input and unknown zones", () => {
    expect(zonedTimeToUtc("2026-13-01", "10:00", "Europe/Paris")).toBeNull();
    expect(zonedTimeToUtc("2026-02-30", "10:00", "Europe/Paris")).toBeNull();
    expect(zonedTimeToUtc("2026-10-06", "25:00", "Europe/Paris")).toBeNull();
    expect(zonedTimeToUtc("2026-10-06", "10:00", "Mars/Olympus")).toBeNull();
  });

  it("round-trips through utcToZoned", () => {
    const at = zonedTimeToUtc("2026-12-24", "18:30", "Australia/Sydney")!;
    expect(utcToZoned(at, "Australia/Sydney")).toEqual({ date: "2026-12-24", time: "18:30" });
  });
});

describe("isValidZone", () => {
  it("accepts IANA ids only", () => {
    expect(isValidZone("Pacific/Tahiti")).toBe(true);
    expect(isValidZone("Tahiti")).toBe(false);
  });
});


describe("isReminderDue (cron at 18:00 UTC)", () => {
  const cron = new Date("2026-10-05T18:00:00Z"); // Mon 08:00 Tahiti, Mon 20:00 Paris
  const booked = new Date("2026-09-30T00:00:00Z");

  it("reminds a Tahiti lead for any time tomorrow (Tuesday) in Tahiti", () => {
    expect(isReminderDue({ startsAt: new Date("2026-10-06T18:00:00Z"), bookedAt: booked, timeZone: "Pacific/Tahiti" }, cron)).toBe(true); // Tue 08:00
    expect(isReminderDue({ startsAt: new Date("2026-10-07T09:00:00Z"), bookedAt: booked, timeZone: "Pacific/Tahiti" }, cron)).toBe(true); // Tue 23:00
    expect(isReminderDue({ startsAt: new Date("2026-10-06T08:00:00Z"), bookedAt: booked, timeZone: "Pacific/Tahiti" }, cron)).toBe(false); // Mon 22:00 = today
  });

  it("uses the lead's calendar, not Curtis's", () => {
    // Tue 06:00 UTC = Tue 08:00 Paris (tomorrow for Paris) but Mon 20:00 Tahiti.
    expect(isReminderDue({ startsAt: new Date("2026-10-06T06:00:00Z"), bookedAt: booked, timeZone: "Europe/Paris" }, cron)).toBe(true);
    expect(isReminderDue({ startsAt: new Date("2026-10-06T06:00:00Z"), bookedAt: booked, timeZone: "Pacific/Tahiti" }, cron)).toBe(false);
  });

  it("skips RDVs booked less than a day ahead, and past ones", () => {
    const start = new Date("2026-10-06T18:00:00Z");
    expect(isReminderDue({ startsAt: start, bookedAt: new Date(start.getTime() - 20 * 3_600_000), timeZone: "Pacific/Tahiti" }, cron)).toBe(false);
    expect(isReminderDue({ startsAt: new Date("2026-10-05T17:00:00Z"), bookedAt: booked, timeZone: "Pacific/Tahiti" }, cron)).toBe(false);
  });
});
