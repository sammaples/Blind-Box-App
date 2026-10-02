import { NextResponse } from "next/server";
import { redeemLoginToken, safeNext, startSession } from "@/lib/auth";
import { maySignIn } from "@/lib/invites";

/**
 * Opens a sign-in link. Redeeming is single-use, so a link that has already
 * been opened — or has expired — sends the visitor back to try again rather
 * than failing at them.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  const account = token ? await redeemLoginToken(token) : null;
  const retry = (reason: string) => {
    const to = new URL(safeNext(url.searchParams.get("next")), url.origin);
    to.searchParams.set("signin", reason);
    return NextResponse.redirect(to);
  };
  if (!account) return retry("expired");
  // A link sent before its address came off the invite list no longer works.
  if (!(await maySignIn({ email: account.email }))) return retry("invite");

  const claimed = await startSession(account);
  const destination = new URL(safeNext(url.searchParams.get("next")), url.origin);
  destination.searchParams.set("signin", "ok");
  if (claimed > 0) destination.searchParams.set("claimed", String(claimed));

  return NextResponse.redirect(destination);
}
