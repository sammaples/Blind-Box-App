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
 * With ADMIN_EMAILS unset the console refuses to load in production, and in
 * development treats the first signed-in account as the owner so the app can
 * be tried without configuring anything. Note what that fallback does *not*
 * do: it never lets a signed-out visitor in. Signing in is the floor in every
 * mode, because "convenient in development" is how an unprotected inventory
 * editor ends up on a public URL.
 */

export type AdminMode = "accounts" | "bootstrap" | "disabled";

export function adminMode(): AdminMode {
  if (adminEmails().size > 0) return "accounts";
  return process.env.NODE_ENV === "production" ? "disabled" : "bootstrap";
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

/**
 * Why the current request may or may not administer the shop.
 *
 * The reason is returned, not just a yes or no, because the console has to
 * tell someone what to do next — "sign in" and "that account is not an admin"
 * are different problems with different fixes, and answering the second with
 * the first is how people end up convinced the sign-in is broken.
 */
export type AdminCheck =
  | { ok: true }
  | { ok: false; reason: "disabled" | "signed-out" | "not-admin" };

export async function checkAdmin(): Promise<AdminCheck> {
  const mode = adminMode();
  if (mode === "disabled") return { ok: false, reason: "disabled" };

  const accountId = await currentAccountId();
  if (!accountId) return { ok: false, reason: "signed-out" };

  const account = await backend().upsertCollector(accountId, {});
  if (mode === "bootstrap" || account.isAdmin === true) return { ok: true };
  return { ok: false, reason: "not-admin" };
}

/** Whether the current request may read or change the shop's inventory. */
export async function isAdmin(): Promise<boolean> {
  return (await checkAdmin()).ok;
}
