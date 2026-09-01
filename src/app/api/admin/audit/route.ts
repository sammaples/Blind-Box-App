import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { recentAudit } from "@/lib/stock";

/** The inventory edit log, newest first. */
export async function GET(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  }
  const limit = Number(new URL(request.url).searchParams.get("limit") ?? 60);
  const audit = await recentAudit(Number.isFinite(limit) ? limit : 60);
  return NextResponse.json({ audit });
}
