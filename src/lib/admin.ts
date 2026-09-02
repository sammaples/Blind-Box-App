import "server-only";
import { currentAccountId } from "./auth";
import { backend } from "./db";
import type { Collector } from "./types";

/**
 * Admin access.
 *
 * Admin is a property of an account, reached through the same emailed sign-in
 * as everyone else — there is no second password to share or leak. List the
 * addresses that should have it in ADMIN_EMAILS; an account is promoted the
 * next time it signs in.
 *
 * With ADMIN_EMAILS unset the console is open in development, so it can be
 * tried with no setup, and refuses to load in production. An unprotected
 * inventory editor on a public URL should never be the accidental default.
 */

export type AdminMode = "accounts" | "open" | "disabled";

export function adminMode(): AdminMode {
  if (adminEmails().size > 0) return "accounts";
  return process.env.NODE_ENV === "production" ? "disabled" : "open";
}

/** The addresses allowed to administer the shop, lowercased. */
export function adminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter((value) => value !== ""),
  );
}

/** Whether this address should hold admin, by configuration. */
export function shouldBeAdmin(email: string | null): boolean {
  if (!email) return false;
  return adminEmails().has(email.trim().toLowerCase());
}

/**
 * Brings an account's admin flag in line with ADMIN_EMAILS. Called on sign-in,
 * so adding or removing an address takes effect the next time they sign in
 * rather than needing a database edit.
 */
export async function syncAdmin(account: Collector): Promise<Collector> {
  if (adminMode() !== "accounts") return account;

  const expected = shouldBeAdmin(account.email);
  if (expected === account.isAdmin) return account;

  await backend().setAdmin(account.id, expected);
  return { ...account, isAdmin: expected };
}

/** Whether the current request may read or change the shop's inventory. */
export async function isAdmin(): Promise<boolean> {
  const mode = adminMode();
  if (mode === "disabled") return false;
  if (mode === "open") return true;

  const accountId = await currentAccountId();
  if (!accountId) return false;

  const account = await backend().upsertCollector(accountId, {});
  return account.isAdmin === true;
}
