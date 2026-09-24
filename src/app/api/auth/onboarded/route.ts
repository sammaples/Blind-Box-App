import { NextResponse } from "next/server";
import { currentAccountId } from "@/lib/auth";
import { backend } from "@/lib/db";

/**
 * Marks the onboarding as seen.
 *
 * On the account rather than in the browser, so somebody who signs in on a
 * phone and later opens the site on a laptop is not walked through it twice.
 * A visitor with no account has nowhere to write it, which is why the client
 * also keeps a local flag — that one is the fallback, this is the record.
 */
export async function POST() {
  const accountId = await currentAccountId();
  if (!accountId) return NextResponse.json({ ok: false }, { status: 401 });

  await backend().upsertCollector(accountId, {
    onboardedAt: new Date().toISOString(),
  });
  return NextResponse.json({ ok: true });
}
