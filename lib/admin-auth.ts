// Admin session for the Redline back-office. Pure crypto, no I/O, so it is
// unit-tested; the cookie plumbing lives in app/admin and the lockout counter
// in lib/crm (Postgres).
//
// No fallback secret on purpose: an admin that silently starts with a guessable
// secret is worse than one that refuses to start. (The old /dashboard defaulted
// to "redline".)
import crypto from "node:crypto";

export const ADMIN_COOKIE = "rl_admin";
export const SESSION_MS = 8 * 60 * 60 * 1000;

/** Five failures inside fifteen minutes locks that IP for the rest of the window. */
export const LOCKOUT_THRESHOLD = 5;
export const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for the admin area.`);
  return value;
}

function mac(payload: string): string {
  return crypto.createHmac("sha256", required("ADMIN_SECRET")).update(payload).digest("base64url");
}

/** Issues a session token. `issuedAt` is injectable so expiry can be tested. */
export function signAdmin(issuedAt: number = Date.now()): string {
  const payload = Buffer.from(`admin:${issuedAt}`).toString("base64url");
  return `${payload}.${mac(payload)}`;
}

export function verifyAdmin(token: string | undefined | null, now: number = Date.now()): boolean {
  if (!token) return false;
  const [payload, given] = token.split(".");
  if (!payload || !given) return false;

  let expected: string;
  try {
    expected = mac(payload);
  } catch {
    return false; // no secret configured: deny rather than guess
  }

  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;

  const decoded = Buffer.from(payload, "base64url").toString();
  const issuedAt = Number(decoded.startsWith("admin:") ? decoded.slice(6) : NaN);
  if (!Number.isFinite(issuedAt) || issuedAt > now) return false;
  return now - issuedAt < SESSION_MS;
}

/** Constant-time comparison against ADMIN_PASSWORD. */
export function checkPassword(candidate: string): boolean {
  const expected = required("ADMIN_PASSWORD");
  // timingSafeEqual throws on a length mismatch, which would leak the length;
  // compare equal-size digests instead.
  const ha = crypto.createHash("sha256").update(String(candidate)).digest();
  const hb = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(ha, hb);
}

/** Pure lockout policy: given one IP's recent failed attempts, is it barred? */
export function isLockedOut(attempts: Date[], now: Date = new Date()): boolean {
  const cutoff = now.getTime() - LOCKOUT_WINDOW_MS;
  return attempts.filter((a) => a.getTime() >= cutoff).length >= LOCKOUT_THRESHOLD;
}

/** Unguessable token for the public /rdv/<token> self-booking page. */
export function newBookingToken(): string {
  return crypto.randomBytes(18).toString("base64url");
}
