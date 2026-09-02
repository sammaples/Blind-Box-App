import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { syncAdmin } from "./admin";
import { backend } from "./db";
import type { Collector } from "./types";

/**
 * Sign-in by emailed link, and the session cookie it produces.
 *
 * There are no passwords to store, reset or leak. A link is a single-use token
 * that is short-lived, stored only as a hash, and retired the moment a new one
 * is requested for the same address.
 */

const SESSION_COOKIE = "bb_session";
/** The pre-account cookie. Still read, so old collections can be claimed. */
const LEGACY_COOKIE = "bb_collector";

const SESSION_MAX_AGE = 60 * 60 * 24 * 90;
const TOKEN_TTL_MS = 15 * 60 * 1000;

/* --------------------------------- secret -------------------------------- */

const DEV_SECRET = "blind-box-development-secret-not-for-production";

function secret(): string {
  const configured = process.env.AUTH_SECRET;
  if (configured) return configured;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "AUTH_SECRET must be set in production. Without it, session cookies " +
        "would be signed with a key that is published in the source.",
    );
  }
  return DEV_SECRET;
}

/* --------------------------------- tokens -------------------------------- */

function hashToken(token: string): string {
  return createHmac("sha256", secret()).update(`token:${token}`).digest("hex");
}

function sameString(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/**
 * A destination to land on after signing in.
 *
 * Only this site's own paths are allowed. An open redirect on the end of a
 * sign-in link is worth more to an attacker than most bugs: the link is one
 * the recipient was expecting, from a domain they trust, and it can be aimed
 * anywhere. `//host` and `/\\host` are rejected too — browsers read both as
 * "another origin", not as a path.
 */
export function safeNext(input: unknown, fallback = "/"): string {
  if (typeof input !== "string") return fallback;
  const value = input.trim();
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value.slice(0, 300);
}

export function normaliseEmail(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const value = input.trim().toLowerCase();
  // Deliberately loose: the address only counts once a link sent to it is
  // opened, so delivery is the real check.
  if (value.length < 3 || value.length > 200) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return null;
  return value;
}

/** Issues a single-use sign-in token and returns the raw value for the link. */
export async function issueLoginToken(email: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await backend().createLoginToken({
    tokenHash: hashToken(token),
    email,
    expiresAt: new Date(Date.now() + TOKEN_TTL_MS).toISOString(),
  });
  return token;
}

/** Redeems a token and returns the account it signs in, or null. */
export async function redeemLoginToken(token: string): Promise<Collector | null> {
  const email = await backend().consumeLoginToken(
    hashToken(token),
    new Date().toISOString(),
  );
  if (!email) return null;

  const account = await backend().accountForEmail(email);
  // Admin follows ADMIN_EMAILS, applied at sign-in rather than by hand.
  return syncAdmin(account);
}

/* -------------------------------- sessions ------------------------------- */

function sign(accountId: string, issuedAt: string): string {
  return createHmac("sha256", secret())
    .update(`session:${accountId}:${issuedAt}`)
    .digest("hex");
}

/**
 * Starts a session and claims anything this browser bought before signing in,
 * so a collection built without an account is never orphaned by making one.
 */
export async function startSession(account: Collector): Promise<number> {
  const jar = await cookies();
  const issuedAt = String(Date.now());

  jar.set(SESSION_COOKIE, `${account.id}.${issuedAt}.${sign(account.id, issuedAt)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  const legacy = jar.get(LEGACY_COOKIE)?.value;
  if (!legacy || legacy === account.id) return 0;

  const claimed = await backend().claimOrders(legacy, account.id);
  jar.delete(LEGACY_COOKIE);
  return claimed;
}

export async function endSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

/** The signed-in account id, or null. Never throws on a malformed cookie. */
export async function currentAccountId(): Promise<string | null> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  const parts = raw.split(".");
  if (parts.length !== 3) return null;
  const [accountId, issuedAt, signature] = parts;

  if (!sameString(signature, sign(accountId, issuedAt))) return null;
  return accountId;
}

/**
 * The identity an order belongs to. A signed-in account, or — for collections
 * bought before accounts existed — the browser's old cookie.
 */
export async function currentCollectorId(): Promise<string | null> {
  const account = await currentAccountId();
  if (account) return account;

  const jar = await cookies();
  return jar.get(LEGACY_COOKIE)?.value ?? null;
}
