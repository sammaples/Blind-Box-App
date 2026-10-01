import { NextResponse } from "next/server";
import { issueLoginToken, normaliseEmail, safeNext } from "@/lib/auth";
import {
  canRevealLinkInResponse,
  canSendLoginLinks,
  email as sender,
} from "@/lib/email";

/**
 * Asks for a sign-in link.
 *
 * The response is the same whether or not the address has an account, so this
 * cannot be used to find out who has one.
 */
export async function POST(request: Request) {
  let body: { email?: unknown; next?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request body" }, { status: 400 });
  }

  if (!canSendLoginLinks()) {
    return NextResponse.json(
      {
        // Shown on the sign-in screen as is, so it is written for a collector.
        // The fix is RESEND_API_KEY and EMAIL_FROM; see src/lib/email.ts.
        error: "Email sign-in isn’t available right now.",
      },
      { status: 503 },
    );
  }

  const address = normaliseEmail(body.email);
  if (!address) {
    return NextResponse.json(
      { error: "That does not look like an email address" },
      { status: 400 },
    );
  }

  const { token, code } = await issueLoginToken(address);
  // Where to land afterwards, so a link opened to reach the inventory console
  // does not drop the admin on the shop's front page.
  const link = new URL("/auth/callback", request.url);
  link.searchParams.set("token", token);
  link.searchParams.set("next", safeNext(body.next));
  const url = link.toString();

  try {
    await sender.sendLoginLink({ to: address, url, code });
  } catch (err) {
    // Never answer "check your email" for a message that failed to send. The
    // token simply expires unused; asking again issues a fresh one.
    console.error("[auth] could not send a sign-in link:", err);
    return NextResponse.json(
      { error: "We could not send that email just now. Please try again." },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    // Only when there is no real sender and this is not production. A live
    // sign-in link in an API response would let anyone sign in as anyone.
    devLink: canRevealLinkInResponse() ? url : undefined,
    devCode: canRevealLinkInResponse() ? code : undefined,
  });
}
