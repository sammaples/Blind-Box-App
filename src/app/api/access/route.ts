import { NextResponse } from "next/server";
import { ACCESS_COOKIE, ACCESS_MAX_AGE, accessPass, codeMatches } from "@/lib/access";
import { currentAccountId } from "@/lib/auth";
import { signInAsTester } from "@/lib/tester";

/**
 * Checks the access code. Right, and this browser gets its pass and — unless
 * it is already signed in — its tester account, in one step, so the first
 * thing a tester sees is the app working rather than another sign-in.
 */
export async function POST(request: Request) {
  let body: { code?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request body" }, { status: 400 });
  }
  if (!codeMatches(body.code)) {
    // A beat before answering, so guessing is slow.
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ error: "That code isn’t right." }, { status: 401 });
  }

  if (!(await currentAccountId())) await signInAsTester();

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ACCESS_COOKIE, accessPass(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ACCESS_MAX_AGE,
  });
  return res;
}
