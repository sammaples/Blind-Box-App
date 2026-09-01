import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Admin access.
 *
 * Set ADMIN_PASSWORD and the console asks for it. Leave it unset and the
 * console is open in development (so you can try it with no setup) and refuses
 * to load in production — an unprotected inventory editor on a public URL is
 * not a default anyone should get by accident.
 */

const COOKIE = "bb_admin";

export type AdminMode = "password" | "open" | "disabled";

export function adminMode(): AdminMode {
  if (process.env.ADMIN_PASSWORD) return "password";
  return process.env.NODE_ENV === "production" ? "disabled" : "open";
}

/** The cookie value proving a correct password, derived from the password. */
function token(password: string): string {
  return createHmac("sha256", password).update("bb-admin-v1").digest("hex");
}

function sameToken(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function checkPassword(candidate: unknown): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || typeof candidate !== "string") return false;
  return sameToken(token(candidate), token(expected));
}

export async function grantSession(): Promise<void> {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return;
  const jar = await cookies();
  jar.set(COOKIE, token(password), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function revokeSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

/** Whether the current request may read or change inventory. */
export async function isAdmin(): Promise<boolean> {
  const mode = adminMode();
  if (mode === "disabled") return false;
  if (mode === "open") return true;

  const jar = await cookies();
  const present = jar.get(COOKIE)?.value;
  const expected = token(process.env.ADMIN_PASSWORD!);
  return !!present && sameToken(present, expected);
}
