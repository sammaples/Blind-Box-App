import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin";
import { appleConfigured } from "@/lib/apple";
import { currentAccountId, endSession } from "@/lib/auth";
import { backend } from "@/lib/db";

/** Who is signed in, if anyone. */
export async function GET() {
  // Whether the Apple door is open at all. The sign-in sheet has to know
  // before it can decide what to offer, and this is the call it already
  // makes on mount — a second endpoint would be a second round trip to
  // learn one boolean. It leaks nothing: a visitor finds out by pressing
  // the button anyway.
  const apple = appleConfigured();

  const accountId = await currentAccountId();
  if (!accountId) return NextResponse.json({ account: null, apple });

  // Touch nothing: this is a read, and an unknown id simply is not signed in.
  const account = await backend().upsertCollector(accountId, {});

  // Whether this account administers the shop, so the app can offer the
  // console rather than making its owner remember the URL. Asked through the
  // same check the console itself gates on — one answer, not two that can
  // drift. Telling you about your own admin rights reveals nothing: the
  // console refuses anyone who is not one, however they arrive.
  const admin = await checkAdmin();

  return NextResponse.json({
    apple,
    account: {
      id: account.id,
      email: account.email,
      displayName: account.displayName,
      isAdmin: admin.ok,
      /** Coins in hand, so the header can show them without a second call. */
      coins: account.coins ?? 0,
      // What the onboarding gates on, so a returning collector never sees it
      // again on a new device — the answer travels with the account rather
      // than with the browser.
      onboarded: account.onboardedAt !== null,
    },
  });
}

/** Signs out. */
export async function DELETE() {
  await endSession();
  return NextResponse.json({ ok: true });
}
