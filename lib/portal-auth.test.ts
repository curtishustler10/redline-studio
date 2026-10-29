import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  CODE_ALPHABET,
  PORTAL_SESSION_MS,
  codeStamp,
  generateCode,
  hashCode,
  normalizeCode,
  normalizePassword,
  readPortalSession,
  signPortalSession,
  verifyCode,
} from "./portal-auth";
import { signAdmin, verifyAdmin } from "./admin-auth";

describe("access codes", () => {
  it("generates PREFIX-XXXX-XXXX from the unambiguous alphabet", () => {
    for (let i = 0; i < 200; i++) {
      const code = generateCode("AHK");
      expect(code).toMatch(/^AHK-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
      for (const c of code.slice(4).replace("-", "")) expect(CODE_ALPHABET).toContain(c);
      expect(code.slice(4)).not.toMatch(/[01OIL]/);
    }
  });

  it("never produces the same code twice in a run", () => {
    const seen = new Set(Array.from({ length: 500 }, () => generateCode("AHK")));
    expect(seen.size).toBe(500);
  });

  it("refuses a bad prefix", () => {
    expect(() => generateCode("ahk")).toThrow();
    expect(() => generateCode("TOOLONG")).toThrow();
  });

  it("normalizes case, spaces and dashes", () => {
    expect(normalizeCode("ahk 7qf4 m9xc")).toEqual({ code: "AHK-7QF4-M9XC", prefix: "AHK" });
    expect(normalizeCode("AHK7QF4M9XC")).toEqual({ code: "AHK-7QF4-M9XC", prefix: "AHK" });
    expect(normalizeCode("  AHK-7QF4-M9XC ")?.code).toBe("AHK-7QF4-M9XC");
  });

  it("rejects what cannot be a code", () => {
    expect(normalizeCode("")).toBeNull();
    expect(normalizeCode("AHK-7QF4")).toBeNull();
    expect(normalizeCode("AHK-7QF4-M9X0")).toBeNull(); // 0 is not in the alphabet
    expect(normalizeCode("A1K-7QF4-M9XC")).toBeNull();
    expect(normalizeCode("AHKAHKAHK-7QF4-M9XC")).toBeNull();
  });

  it("keeps a chosen password exactly as typed", () => {
    expect(normalizePassword("  Ahukini88@ ")).toBe("Ahukini88@");
    expect(normalizePassword("short")).toBeNull();
    expect(normalizePassword("x".repeat(65))).toBeNull();
  });

  it("verifies a chosen password case-sensitively", async () => {
    const stored = await hashCode("Ahukini88@");
    expect(await verifyCode("Ahukini88@", stored)).toBe(true);
    expect(await verifyCode("ahukini88@", stored)).toBe(false);
    expect(await verifyCode("Ahukini88", stored)).toBe(false);
  });

  it("hashes with a salt and verifies only the right code", async () => {
    const a = await hashCode("AHK-7QF4-M9XC");
    const b = await hashCode("AHK-7QF4-M9XC");
    expect(a).toMatch(/^scrypt\$16384\$8\$1\$[\w-]+\$[\w-]+$/);
    expect(a).not.toBe(b);
    expect(a).not.toContain("7QF4");
    expect(await verifyCode("AHK-7QF4-M9XC", a)).toBe(true);
    expect(await verifyCode("AHK-7QF4-M9XD", a)).toBe(false);
    expect(await verifyCode("AHK-7QF4-M9XC", "plain")).toBe(false);
    expect(await verifyCode("AHK-7QF4-M9XC", a.replace("16384", "999999999"))).toBe(false);
  });
});

describe("portal session cookie", () => {
  const saved = process.env.ADMIN_SECRET;
  beforeEach(() => {
    process.env.ADMIN_SECRET = "test-secret-for-portal";
  });
  afterEach(() => {
    process.env.ADMIN_SECRET = saved;
  });

  const stamp = codeStamp("scrypt$16384$8$1$salt$hash");

  it("round-trips project id and code stamp", () => {
    const now = 1_800_000_000_000;
    const token = signPortalSession(7, stamp, now);
    expect(readPortalSession(token, now + 1000)).toEqual({ projectId: 7, stamp, issuedAt: now });
  });

  it("changes stamp when the code hash changes", () => {
    expect(codeStamp("scrypt$a")).not.toBe(codeStamp("scrypt$b"));
    expect(stamp).toHaveLength(16);
  });

  it("rejects a tampered, foreign or expired token", () => {
    const now = 1_800_000_000_000;
    const token = signPortalSession(7, stamp, now);
    const [payload, sig] = token.split(".");
    const forged = Buffer.from(`portal:8:${stamp}:${now}`).toString("base64url");
    expect(readPortalSession(`${forged}.${sig}`, now)).toBeNull();
    expect(readPortalSession(`${payload}.${sig.slice(0, -2)}xx`, now)).toBeNull();
    expect(readPortalSession(`${token}.extra`, now)).toBeNull();
    expect(readPortalSession(token, now + PORTAL_SESSION_MS)).toBeNull();
    expect(readPortalSession(token, now - 1)).toBeNull();
    expect(readPortalSession(undefined)).toBeNull();
    expect(readPortalSession("garbage")).toBeNull();
  });

  it("is not interchangeable with the admin session", () => {
    const now = Date.now();
    expect(verifyAdmin(signPortalSession(1, stamp, now), now)).toBe(false);
    expect(readPortalSession(signAdmin(now), now)).toBeNull();
  });

  it("denies everything without a secret", () => {
    const token = signPortalSession(7, stamp);
    delete process.env.ADMIN_SECRET;
    expect(readPortalSession(token)).toBeNull();
    expect(() => signPortalSession(7, stamp)).toThrow();
  });
});
