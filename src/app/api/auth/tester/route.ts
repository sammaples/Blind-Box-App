import { NextResponse } from "next/server";
import { accessGateOn } from "@/lib/access";
import { signInAsTester } from "@/lib/tester";

/**
 * "Continue as tester" on the sign-in screen. Only while the tester gate is
 * up — the proxy has already checked this browser holds a pass.
 */
export async function POST() {
  if (!accessGateOn()) {
    return NextResponse.json({ error: "Tester sign-in is off" }, { status: 404 });
  }
  await signInAsTester();
  return NextResponse.json({ ok: true });
}
