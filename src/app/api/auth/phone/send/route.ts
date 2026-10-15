import { NextResponse } from "next/server";
import { normalisePhone } from "@/lib/auth";
import { SmsError, canRevealCodeInResponse, canTextCodes, sms } from "@/lib/sms";

/** Texts a sign-in code to a phone number. */
export async function POST(request: Request) {
  let body: { phone?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request body" }, { status: 400 });
  }

  if (!canTextCodes()) {
    // Written for a collector: it is shown on the sign-in screen as is. The
    // fix is the TWILIO_* variables; see src/lib/sms.ts.
    return NextResponse.json({ error: "Phone sign-in isn’t available right now." }, { status: 503 });
  }

  const phone = normalisePhone(body.phone);
  if (!phone) {
    return NextResponse.json(
      { error: "That doesn’t look like a phone number. Outside the US, start with + and the country code." },
      { status: 400 },
    );
  }

  try {
    const { devCode } = await sms.send(phone);
    return NextResponse.json({
      ok: true,
      phone,
      devCode: canRevealCodeInResponse() ? devCode : undefined,
    });
  } catch (err) {
    if (err instanceof SmsError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[auth] could not text a sign-in code:", err);
    return NextResponse.json(
      { error: "We couldn’t send that text just now. Please try again." },
      { status: 502 },
    );
  }
}
