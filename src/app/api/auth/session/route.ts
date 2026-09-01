import { NextResponse } from "next/server";
import { currentAccountId, endSession } from "@/lib/auth";
import { backend } from "@/lib/db";

/** Who is signed in, if anyone. */
export async function GET() {
  const accountId = await currentAccountId();
  if (!accountId) return NextResponse.json({ account: null });

  // Touch nothing: this is a read, and an unknown id simply is not signed in.
  const account = await backend().upsertCollector(accountId, {});
  return NextResponse.json({
    account: { id: account.id, email: account.email },
  });
}

/** Signs out. */
export async function DELETE() {
  await endSession();
  return NextResponse.json({ ok: true });
}
