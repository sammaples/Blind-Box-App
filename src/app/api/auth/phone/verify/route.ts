import { NextResponse } from "next/server";
import { normalisePhone, signInWithPhone, startSession } from "@/lib/auth";
import { SmsError, canTextCodes, normaliseSmsCode, sms } from "@/lib/sms";

/** Signs in with the code texted to a phone number. */
export async function POST(request: Request) {
  let body: { phone?: unknown; code?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request body" }, { status: 400 });
  }

  if (!canTextCodes()) {
    return NextResponse.json({ error: "Phone sign-in isn’t available right now." }, { status: 503 });
  }

  const phone = normalisePhone(body.phone);
  const code = normaliseSmsCode(body.code);
  if (!phone || !code) {
    return NextResponse.json({ error: "Enter the code from the text" }, { status: 400 });
  }

  let ok: boolean;
  try {
    ok = await sms.check(phone, code);
  } catch (err) {
    if (err instanceof SmsError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[auth] could not check a texted code:", err);
    return NextResponse.json({ error: "We couldn’t check that code just now. Please try again." }, { status: 502 });
  }
  if (!ok) {
    return NextResponse.json(
      { error: "That code didn’t work. Check it, or ask for a new one." },
      { status: 401 },
    );
  }

  const account = await signInWithPhone(phone);
  const claimed = await startSession(account);
  return NextResponse.json({ ok: true, claimed });
}
