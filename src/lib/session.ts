import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "bb_collector";
const MAX_AGE = 60 * 60 * 24 * 365;

/** Reads the collector id from the cookie, without creating one. */
export async function readCollectorId(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(COOKIE)?.value ?? null;
}

/**
 * Returns the current collector id, minting one if this is a first visit.
 * Only callable from a route handler or server action, since it sets a cookie.
 */
export async function requireCollectorId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(COOKIE)?.value;
  if (existing) return existing;

  const id = `col_${randomBytes(12).toString("hex")}`;
  jar.set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
  return id;
}
