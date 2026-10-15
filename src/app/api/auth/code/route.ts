import { NextResponse } from "next/server";
import { normaliseCode, normaliseEmail, redeemLoginCode, startSession } from "@/lib/auth";

/**
 * Signs in with the code from a sign-in email.
 *
 * The typed counterpart of the emailed link, for the app on a home screen:
 * a link opens in the browser, whose sign-in the app cannot see, so the app
 * asks for the code instead and the session is started right here, in it.
 */
export async function POST(request: Request) {
  let body: { email?: unknown; code?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request body" }, { status: 400 });
  }

  const address = normaliseEmail(body.email);
  const code = normaliseCode(body.code);
  if (!address || !code) {
    return NextResponse.json({ error: "Enter the 8-character code from the email" }, { status: 400 });
  }

  const account = await redeemLoginCode(address, code);
  if (!account) {
    return NextResponse.json(
      { error: "That code didn’t work. Check it, or ask for a new one." },
      { status: 401 },
    );
  }

  const claimed = await startSession(account);
  return NextResponse.json({ ok: true, claimed });
}
