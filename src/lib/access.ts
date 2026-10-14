import { createHmac, timingSafeEqual } from "node:crypto";
import { secret } from "./secret";

/**
 * The tester gate: one access code in front of the whole site, for the beta.
 *
 * Whoever types it gets a pass for that browser and is signed in as a tester
 * account of their own, so they can buy, open, spin and trade without an
 * email or a phone. Testers never administer the shop. The real sign-in
 * stays where it is, for when this comes down.
 *
 * The code is ACCESS_CODE in the environment, "blindbox" when unset, and
 * "off" turns the gate off altogether. Changing it signs every pass out,
 * because a pass is a signature over the code.
 */

export const ACCESS_COOKIE = "bb_access";
export const ACCESS_MAX_AGE = 60 * 60 * 24 * 365;

/** Tester accounts are told apart by their id, so nothing new is stored. */
export const TESTER_PREFIX = "tst_";
export const isTesterId = (id: string | null | undefined) => !!id && id.startsWith(TESTER_PREFIX);

/** The code, tidied the way a typed one is; null when the gate is off. */
export function accessCode(): string | null {
  const code = tidy(process.env.ACCESS_CODE ?? "blindbox");
  return code === "" || code === "off" ? null : code;
}

export function accessGateOn(): boolean {
  return accessCode() !== null;
}

/** Case and spaces are not part of it: a phone capitalises the first letter. */
function tidy(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, "");
}

export function codeMatches(input: unknown): boolean {
  const code = accessCode();
  if (code === null) return true;
  return typeof input === "string" && same(tidy(input), code);
}

/** What the pass cookie holds. */
export function accessPass(): string {
  return createHmac("sha256", secret()).update(`access:${accessCode() ?? ""}`).digest("hex");
}

export function hasAccess(cookieValue: string | undefined): boolean {
  if (!accessGateOn()) return true;
  return !!cookieValue && same(cookieValue, accessPass());
}

function same(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
