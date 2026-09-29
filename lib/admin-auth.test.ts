import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LOCKOUT_WINDOW_MS, SESSION_MS, checkPassword, isLockedOut, newBookingToken, signAdmin, verifyAdmin } from "./admin-auth";

const env = { ...process.env };

beforeEach(() => {
  process.env.ADMIN_SECRET = "test-secret";
  process.env.ADMIN_PASSWORD = "correct horse battery staple";
});

afterEach(() => {
  process.env = { ...env };
});

describe("admin session", () => {
  it("accepts a fresh token", () => {
    expect(verifyAdmin(signAdmin())).toBe(true);
  });

  it("rejects an expired token", () => {
    const now = Date.now();
    expect(verifyAdmin(signAdmin(now - SESSION_MS - 1), now)).toBe(false);
  });

  it("rejects a token issued in the future", () => {
    const now = Date.now();
    expect(verifyAdmin(signAdmin(now + 60_000), now)).toBe(false);
  });

  it("rejects a tampered payload", () => {
    const [, sig] = signAdmin().split(".");
    const forged = Buffer.from(`admin:${Date.now() + SESSION_MS * 10}`).toString("base64url");
    expect(verifyAdmin(`${forged}.${sig}`)).toBe(false);
  });

  it("rejects a token signed with another secret", () => {
    const token = signAdmin();
    process.env.ADMIN_SECRET = "other";
    expect(verifyAdmin(token)).toBe(false);
  });

  it("denies everything when no secret is configured", () => {
    const token = signAdmin();
    delete process.env.ADMIN_SECRET;
    expect(verifyAdmin(token)).toBe(false);
  });

  it("rejects garbage", () => {
    expect(verifyAdmin(undefined)).toBe(false);
    expect(verifyAdmin("")).toBe(false);
    expect(verifyAdmin("no-dot")).toBe(false);
  });
});

describe("checkPassword", () => {
  it("matches only the exact password", () => {
    expect(checkPassword("correct horse battery staple")).toBe(true);
    expect(checkPassword("correct horse battery")).toBe(false);
    expect(checkPassword("")).toBe(false);
  });

  it("throws when no password is configured", () => {
    delete process.env.ADMIN_PASSWORD;
    expect(() => checkPassword("x")).toThrow(/ADMIN_PASSWORD/);
  });
});

describe("isLockedOut", () => {
  const now = new Date("2026-09-28T12:00:00Z");
  const ago = (ms: number) => new Date(now.getTime() - ms);

  it("locks after five recent failures", () => {
    expect(isLockedOut([1, 2, 3, 4].map((m) => ago(m * 60_000)), now)).toBe(false);
    expect(isLockedOut([1, 2, 3, 4, 5].map((m) => ago(m * 60_000)), now)).toBe(true);
  });

  it("ignores failures outside the window", () => {
    expect(isLockedOut([1, 2, 3, 4, 5].map(() => ago(LOCKOUT_WINDOW_MS + 1)), now)).toBe(false);
  });
});

describe("newBookingToken", () => {
  it("is url-safe and unique", () => {
    const a = newBookingToken();
    expect(a).toMatch(/^[A-Za-z0-9_-]{24}$/);
    expect(newBookingToken()).not.toBe(a);
  });
});
