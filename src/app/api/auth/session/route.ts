import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin";
import { currentAccountId, endSession } from "@/lib/auth";
import { backend } from "@/lib/db";

/** Who is signed in, if anyone. */
export async function GET() {
  const accountId = await currentAccountId();
  if (!accountId) return NextResponse.json({ account: null });

  // Touch nothing: this is a read, and an unknown id simply is not signed in.
  const account = await backend().upsertCollector(accountId, {});

  // Whether this account administers the shop, so the app can offer the
  // console rather than making its owner remember the URL. Asked through the
  // same check the console itself gates on — one answer, not two that can
  // drift. Telling you about your own admin rights reveals nothing: the
  // console refuses anyone who is not one, however they arrive.
  const admin = await checkAdmin();

  return NextResponse.json({
    account: { id: account.id, email: account.email, isAdmin: admin.ok },
  });
}

/** Signs out. */
export async function DELETE() {
  await endSession();
  return NextResponse.json({ ok: true });
}
