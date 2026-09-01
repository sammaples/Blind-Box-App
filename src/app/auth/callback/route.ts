import { NextResponse } from "next/server";
import { redeemLoginToken, startSession } from "@/lib/auth";

/**
 * Opens a sign-in link. Redeeming is single-use, so a link that has already
 * been opened — or has expired — sends the visitor back to try again rather
 * than failing at them.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  const account = token ? await redeemLoginToken(token) : null;
  if (!account) {
    return NextResponse.redirect(new URL("/?signin=expired", url.origin));
  }

  const claimed = await startSession(account);
  const destination = new URL("/", url.origin);
  destination.searchParams.set("signin", "ok");
  if (claimed > 0) destination.searchParams.set("claimed", String(claimed));

  return NextResponse.redirect(destination);
}
