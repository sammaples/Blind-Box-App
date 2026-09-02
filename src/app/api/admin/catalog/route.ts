import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import {
  allPieces,
  buildPiece,
  loadDemoCatalogue,
  RARITIES,
  savePieces,
  SCALES,
  setPieceArchived,
} from "@/lib/pieces";
import type { Rarity, Scale } from "@/lib/types";

/** The whole catalogue, archived pieces included. */
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  }
  return NextResponse.json({ pieces: await allPieces() });
}

/** Adds or edits one piece, archives one, or loads the demo set. */
export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Malformed request body" }, { status: 400 });
  }

  if (body.action === "loadDemo") {
    const count = await loadDemoCatalogue();
    return NextResponse.json({ ok: true, loaded: count });
  }

  if (body.action === "archive" || body.action === "restore") {
    const pieceId = typeof body.pieceId === "string" ? body.pieceId : "";
    const piece = await setPieceArchived(pieceId, body.action === "archive");
    if (!piece) {
      return NextResponse.json({ error: "No piece with that id" }, { status: 404 });
    }
    return NextResponse.json({ piece });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (name === "") {
    return NextResponse.json({ error: "A piece needs a name" }, { status: 400 });
  }

  const scale = body.scale as Scale;
  if (!SCALES.includes(scale)) {
    return NextResponse.json(
      { error: "Scale must be 100% or 400%" },
      { status: 400 },
    );
  }

  const rarity = (body.rarity ?? "common") as Rarity;
  if (!RARITIES.includes(rarity)) {
    return NextResponse.json({ error: "That is not a rarity" }, { status: 400 });
  }

  const piece = buildPiece({
    id: typeof body.id === "string" ? body.id : undefined,
    name,
    setName: typeof body.setName === "string" ? body.setName : "",
    series:
      body.series === null || body.series === undefined || body.series === ""
        ? null
        : Number(body.series),
    scale,
    rarity,
    imageUrl: body.imageUrl,
    notes: typeof body.notes === "string" ? body.notes : "",
  });

  await savePieces([piece]);
  return NextResponse.json({ piece });
}
