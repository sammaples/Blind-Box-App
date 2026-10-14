import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { ACCESS_MAX_AGE, TESTER_PREFIX } from "./access";
import { startSession } from "./auth";
import { backend } from "./db";
import { secret } from "./secret";
import type { Collector } from "./types";

/**
 * Tester accounts: one per browser, made the first time somebody comes
 * through the gate, and remembered by a signed cookie so signing out and
 * choosing "Continue as tester" again finds the same vault, not an empty one.
 */

const TESTER_COOKIE = "bb_tester";

const signId = (id: string) => createHmac("sha256", secret()).update(`tester:${id}`).digest("hex");

async function rememberedTester(): Promise<Collector | null> {
  const raw = (await cookies()).get(TESTER_COOKIE)?.value;
  if (!raw) return null;
  const [id, sig] = raw.split(".");
  if (!id?.startsWith(TESTER_PREFIX) || !sig) return null;
  const want = Buffer.from(signId(id));
  const got = Buffer.from(sig);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  const account = await backend().upsertCollector(id, {});
  return account.deletedAt ? null : account;
}

/** Signs this browser in as its tester account, making one if it has none. */
export async function signInAsTester(): Promise<Collector> {
  const account =
    (await rememberedTester()) ??
    (await backend().upsertCollector(`${TESTER_PREFIX}${randomBytes(9).toString("hex")}`, { displayName: "Tester" }));
  (await cookies()).set(TESTER_COOKIE, `${account.id}.${signId(account.id)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ACCESS_MAX_AGE,
  });
  await startSession(account);
  return account;
}
