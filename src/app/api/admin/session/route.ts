import { NextResponse } from "next/server";
import {
  adminMode,
  checkPassword,
  grantSession,
  revokeSession,
} from "@/lib/admin";

/** Signs in to the admin console. */
export async function POST(request: Request) {
  if (adminMode() === "disabled") {
    return NextResponse.json(
      { error: "Set ADMIN_PASSWORD to enable the admin console." },
      { status: 503 },
    );
  }
  if (adminMode() === "open") {
    return NextResponse.json({ ok: true, mode: "open" });
  }

  let body: { password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request body" }, { status: 400 });
  }

  if (!checkPassword(body.password)) {
    return NextResponse.json({ error: "That password is not right" }, { status: 401 });
  }

  await grantSession();
  return NextResponse.json({ ok: true, mode: "password" });
}

/** Signs out. */
export async function DELETE() {
  await revokeSession();
  return NextResponse.json({ ok: true });
}
