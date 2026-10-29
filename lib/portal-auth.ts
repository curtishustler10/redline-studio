// Client access to "Mon projet": access codes and the project-scoped session.
// Pure crypto, no I/O, so it is unit-tested; the lookup and the attempt counter
// live in lib/projects.ts, the cookie plumbing in app/portal.
//
// A code looks like AHK-7QF4-M9XC: a readable project prefix plus 8 characters
// from an alphabet with no look-alikes (no 0/O, 1/I/L). 31^8 ≈ 8.5e11 values,
// behind a 5-failures-per-15-minutes lockout. Only a salted scrypt hash is stored.
import crypto from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(crypto.scrypt) as (pw: string, salt: Buffer, keylen: number, opts: crypto.ScryptOptions) => Promise<Buffer>;

export const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const BODY_LENGTH = 8;
const PREFIX = /^[A-Z]{2,5}$/;

export const PORTAL_COOKIE = "rl_portal";
export const PORTAL_PATH = "/portal";
export const PORTAL_SESSION_MS = 30 * 24 * 60 * 60 * 1000;

// ─── Codes ───────────────────────────────────────────────────────────────────

export function generateCode(prefix: string): string {
  if (!PREFIX.test(prefix)) throw new Error("Code prefix must be 2 to 5 capital letters.");
  let body = "";
  for (let i = 0; i < BODY_LENGTH; i++) body += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
  return `${prefix}-${body.slice(0, 4)}-${body.slice(4)}`;
}

/**
 * What the client typed → the canonical code, or null when it cannot be one.
 * Case, spaces and dashes do not matter: "ahk 7qf4m9xc" reads as AHK-7QF4-M9XC.
 */
export function normalizeCode(input: string): { code: string; prefix: string } | null {
  const raw = String(input ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (raw.length < 2 + BODY_LENGTH || raw.length > 5 + BODY_LENGTH) return null;
  const prefix = raw.slice(0, raw.length - BODY_LENGTH);
  const body = raw.slice(-BODY_LENGTH);
  if (!PREFIX.test(prefix) || [...body].some((c) => !CODE_ALPHABET.includes(c))) return null;
  return { code: `${prefix}-${body.slice(0, 4)}-${body.slice(4)}`, prefix };
}

/**
 * A password Curtis picks for a client (e.g. "Ahukini88@") instead of a generated code.
 * Kept exactly as typed, case and symbols included; only surrounding spaces are dropped.
 */
export const MIN_PASSWORD_LENGTH = 8;
export function normalizePassword(input: string): string | null {
  const pw = String(input ?? "").trim();
  return pw.length >= MIN_PASSWORD_LENGTH && pw.length <= 64 ? pw : null;
}

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 32 } as const;

/** Salted scrypt, self-describing so the parameters can change later: scrypt$N$r$p$salt$hash. */
export async function hashCode(code: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(code, salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
  return ["scrypt", SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString("base64url"), key.toString("base64url")].join("$");
}

export async function verifyCode(code: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [N, r, p] = parts.slice(1, 4).map(Number);
  if (![N, r, p].every((n) => Number.isInteger(n) && n > 0) || N > 1 << 17) return false;
  const expected = Buffer.from(parts[5], "base64url");
  const key = await scrypt(code, Buffer.from(parts[4], "base64url"), expected.length, { N, r, p, maxmem: 256 * 1024 * 1024 });
  return key.length === expected.length && crypto.timingSafeEqual(key, expected);
}

/** Burns the same time as a real check, so a wrong prefix is not faster than a wrong code. */
let dummyHash: Promise<string> | null = null;
export async function verifyNothing(code: string): Promise<false> {
  dummyHash ??= hashCode("ZZ-ZZZZ-ZZZZ");
  await verifyCode(code, await dummyHash);
  return false;
}

// ─── Session ─────────────────────────────────────────────────────────────────

/**
 * The session key is derived from ADMIN_SECRET with a fixed label, so a portal
 * token can never pass as an admin token (different key, different payload) and
 * no new secret has to be provisioned. No fallback: without ADMIN_SECRET nobody
 * gets in.
 */
function key(): Buffer {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) throw new Error("ADMIN_SECRET is required for the client portal.");
  return crypto.createHmac("sha256", secret).update("redline-portal-session-v1").digest();
}

function mac(payload: string): string {
  return crypto.createHmac("sha256", key()).update(payload).digest("base64url");
}

/**
 * Ties a session to the code it was opened with: regenerating a project's code
 * changes the stamp and logs every open session out.
 */
export function codeStamp(codeHash: string): string {
  return crypto.createHash("sha256").update(codeHash).digest("base64url").slice(0, 16);
}

export type PortalSession = { projectId: number; stamp: string; issuedAt: number };

export function signPortalSession(projectId: number, stamp: string, issuedAt: number = Date.now()): string {
  const payload = Buffer.from(`portal:${projectId}:${stamp}:${issuedAt}`).toString("base64url");
  return `${payload}.${mac(payload)}`;
}

export function readPortalSession(token: string | undefined | null, now: number = Date.now()): PortalSession | null {
  if (!token) return null;
  const [payload, given, extra] = token.split(".");
  if (!payload || !given || extra !== undefined) return null;

  let expected: string;
  try {
    expected = mac(payload);
  } catch {
    return null;
  }
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  const m = /^portal:(\d+):([A-Za-z0-9_-]{16}):(\d+)$/.exec(Buffer.from(payload, "base64url").toString());
  if (!m) return null;
  const projectId = Number(m[1]);
  const issuedAt = Number(m[3]);
  if (!Number.isSafeInteger(projectId) || issuedAt > now || now - issuedAt >= PORTAL_SESSION_MS) return null;
  return { projectId, stamp: m[2], issuedAt };
}
