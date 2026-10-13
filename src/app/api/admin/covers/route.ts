import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { coverKey } from "@/lib/collections";
import { backend } from "@/lib/db";
import { toLine } from "@/lib/lines";

/**
 * Sets or clears a collection's cover photo — the picture in its bar on the
 * front page. The photo itself is uploaded first through /api/admin/images;
 * this only records which one to show. Null puts the drawn placeholder back.
 */
export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  }

  let body: { line?: unknown; url?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request body" }, { status: 400 });
  }

  const line = toLine(body.line);
  if (!line) return NextResponse.json({ error: "That is not a collection" }, { status: 400 });

  // Our own uploads only: a cover is shown on the front page to everyone,
  // so it is not a field for pasting in somebody else's link.
  const url = body.url === null || body.url === "" ? "" : typeof body.url === "string" ? body.url : null;
  if (url === null || (url !== "" && !/^\/api\/images\/[A-Za-z0-9._-]+$/.test(url))) {
    return NextResponse.json({ error: "Upload the photo first, then set it as the cover" }, { status: 400 });
  }

  await backend().setSetting(coverKey(line), url);
  return NextResponse.json({ ok: true, line, url: url || null });
}
