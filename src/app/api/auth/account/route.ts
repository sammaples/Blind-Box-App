import { NextResponse } from "next/server";
import { currentAccountId, endSession } from "@/lib/auth";
import { backend } from "@/lib/db";

/**
 * Deletes the signed-in account, then signs out.
 *
 * Required of any app that lets people create an account, and done here
 * rather than by emailing someone. Nothing is asked of the request body: the
 * account deleted is the one the session belongs to, and only that one.
 */
export async function DELETE() {
  const accountId = await currentAccountId();
  if (!accountId) {
    return NextResponse.json({ error: "You are not signed in" }, { status: 401 });
  }

  await backend().deleteAccount(accountId);
  await endSession();
  return NextResponse.json({ ok: true });
}
