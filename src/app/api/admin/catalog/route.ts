import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import {
  allPieces,
  buildPiece,
  deletePiece,
  findPiece,
  loadDemoCatalogue,
  RARITIES,
  savePieces,
  SCALES,
  setPieceArchived,
} from "@/lib/pieces";
import { applyStockChanges } from "@/lib/stock";
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

  if (body.action === "delete") {
    const pieceId = typeof body.pieceId === "string" ? body.pieceId : "";
    const piece = await findPiece(pieceId);
    if (!piece) {
      return NextResponse.json({ error: "No piece with that id" }, { status: 404 });
    }

    const result = await deletePiece(pieceId);
    if (result.deleted) return NextResponse.json({ ok: true, deleted: true });

    // Something has shipped under this name, so the row has to stay for the
    // orders that point at it. Archiving is the honest version of the same
    // intent: gone from the shop, still resolvable for the people who own one.
    await setPieceArchived(pieceId, true);
    return NextResponse.json({
      ok: true,
      deleted: false,
      archived: true,
      sold: result.sold,
      message:
        `${piece.name} has sold ${result.sold} ` +
        `unit${result.sold === 1 ? "" : "s"}, so it was archived instead of ` +
        "deleted — those orders still need to name what they pulled.",
    });
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

  // A quantity is optional, but when it comes it has to be a real count —
  // silently reading NaN as zero would quietly unstock a piece.
  let quantity: number | null = null;
  if (body.quantity !== undefined && body.quantity !== null && body.quantity !== "") {
    quantity = Number(body.quantity);
    if (!Number.isFinite(quantity) || quantity < 0) {
      return NextResponse.json(
        { error: "Units must be a number of zero or more" },
        { status: 400 },
      );
    }
    quantity = Math.trunc(quantity);
  }

  // An id means "edit this one". savePieces upserts, so the same call both
  // creates and updates — but only if the id survives the round trip, which is
  // why the form sends it back rather than letting a rename mint a new piece.
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

  // Listing a product and putting the box of them on the shelf is usually one
  // errand, so the form can do both. Stock has to follow the save: there is
  // nothing to attach units to until the piece exists.
  let stock = null;
  if (quantity !== null) {
    const [applied] = await applyStockChanges([
      { pieceId: piece.id, op: "set", units: quantity },
    ]);
    stock = applied ?? null;
  }

  return NextResponse.json({ piece, stock });
}
