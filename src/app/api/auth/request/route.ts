import { NextResponse } from "next/server";
import { issueLoginToken, normaliseEmail } from "@/lib/auth";
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
  let body: { email?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request body" }, { status: 400 });
  }

  if (!canSendLoginLinks()) {
    return NextResponse.json(
      {
        error:
          "Sign-in is unavailable: no email provider is configured. " +
          "Implement EmailProvider in src/lib/email.ts.",
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

  const token = await issueLoginToken(address);
  const url = new URL(`/auth/callback?token=${token}`, request.url).toString();
  await sender.sendLoginLink({ to: address, url });

  return NextResponse.json({
    ok: true,
    // Only when there is no real sender and this is not production. A live
    // sign-in link in an API response would let anyone sign in as anyone.
    devLink: canRevealLinkInResponse() ? url : undefined,
  });
}
