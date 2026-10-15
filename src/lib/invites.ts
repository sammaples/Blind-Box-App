import "server-only";
import { adminMode, shouldBeAdmin } from "./admin";
import { normaliseEmail, normalisePhone } from "./auth";
import { backend } from "./db";

/**
 * Invite-only sign-in.
 *
 * While the shop is being tried out, only the people on the invite list can
 * sign in. The list is kept in the console, not in code or configuration, so
 * adding a friend takes effect at once and nobody's address ends up in the
 * repository. Browsing needs no invite; signing in does.
 *
 * Admins are always let in, so the owner can never lock themselves out, and
 * so is everyone while the console is in its local bootstrap mode, where
 * there is no admin list to tell an owner apart from anyone else.
 */

const SETTING = "invite_only";
const OPEN_SETTING = "open_testing";

/** Shown on the sign-in sheet as is. */
export const NOT_INVITED =
  "Blind Box is invite-only right now. Ask for an invite, then try again.";

/** Whether the list is being enforced. On unless it has been switched off. */
export async function inviteOnly(): Promise<boolean> {
  return (await backend().getSetting(SETTING)) !== "false";
}

export async function setInviteOnly(on: boolean): Promise<void> {
  await backend().setSetting(SETTING, on ? "true" : "false");
}

/**
 * Open testing: anyone signs in with just their email, no code, and the
 * invite list is set aside. For the beta, while emailed codes only reach the
 * owner. Admin addresses never take this shortcut — they still need the code
 * — so typing the owner's address gets nobody into the console. On unless
 * switched off (Invites page).
 */
export async function openTesting(): Promise<boolean> {
  return (await backend().getSetting(OPEN_SETTING)) !== "false";
}

export async function setOpenTesting(on: boolean): Promise<void> {
  await backend().setSetting(OPEN_SETTING, on ? "true" : "false");
}

/** Whether this address may sign in by typing it alone. Never an admin's. */
export async function mayEnterWithoutCode(email: string): Promise<boolean> {
  if (shouldBeAdmin(email)) return false;
  return openTesting();
}

/** An email (lowercased) or a phone number (E.164), or null if it is neither. */
export function normaliseInvite(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const raw = input.trim();
  if (raw.includes("@")) return normaliseEmail(raw);
  return normalisePhone(raw);
}

/** Whether this email or phone number may sign in right now. */
export async function maySignIn(who: { email?: string | null; phone?: string | null }): Promise<boolean> {
  if (adminMode() === "bootstrap") return true;
  if (await openTesting()) return true;
  if (!(await inviteOnly())) return true;
  const email = who.email ? normaliseEmail(who.email) : null;
  if (email && shouldBeAdmin(email)) return true;
  if (email && (await backend().hasInvite(email))) return true;
  const phone = who.phone ? normalisePhone(who.phone) : null;
  if (phone && (await backend().hasInvite(phone))) return true;
  return false;
}
