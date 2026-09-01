import { NextResponse } from "next/server";
import { requireCollectorId } from "@/lib/session";
import { upsertCollector } from "@/lib/store";

/** Marks onboarding complete and stores the optional email for order updates. */
export async function POST(request: Request) {
  const collectorId = await requireCollectorId();

  let body: { email?: unknown; displayName?: unknown };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const email =
    typeof body.email === "string" && body.email.includes("@")
      ? body.email.trim().slice(0, 200)
      : null;
  const displayName =
    typeof body.displayName === "string" && body.displayName.trim() !== ""
      ? body.displayName.trim().slice(0, 80)
      : null;

  const collector = await upsertCollector(collectorId, {
    onboardedAt: new Date().toISOString(),
    ...(email ? { email } : {}),
    ...(displayName ? { displayName } : {}),
  });

  return NextResponse.json({ collector });
}
