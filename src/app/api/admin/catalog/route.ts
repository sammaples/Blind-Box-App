import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { toCategory } from "@/lib/catalog";
import {
  allPieces,
  buildPiece,
  createPiece,
  deletePiece,
  findPiece,
  loadDemoCatalogue,
  RARITIES,
  resetShop,
  savePieces,
  SCALES,
  setPieceArchived,
} from "@/lib/pieces";
import { applyStockChanges } from "@/lib/stock";
import type { Rarity, Scale } from "@/lib/types";

/** What has to be typed to empty the shop. Shown in the console beside the box. */
const RESET_PHRASE = "RESET";

/** The whole catalogue, archived pieces included. */
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  }
  return NextResponse.json({ pieces: await allPieces() });
}

/**
 * Adds or edits one piece, archives or deletes one, loads the demo set, or
 * empties the shop.
 */
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

  if (body.action === "resetShop") {
    // A typed word, not just an admin session. Every other action here is
    // recoverable by hand; this one removes the orders that would tell you
    // what used to be there, so it asks for something a misplaced click
    // cannot produce.
    if (body.confirm !== RESET_PHRASE) {
      return NextResponse.json(
        { error: `Type ${RESET_PHRASE} to confirm` },
        { status: 400 },
      );
    }
    const summary = await resetShop();
    return NextResponse.json({ ok: true, reset: summary });
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

  const series =
    body.series === null || body.series === undefined || body.series === ""
      ? null
      : Number(body.series);

  // Required on a numbered series piece, optional on a one-off. Which slot a
  // figure fills is part of what a series is, so a series piece without one is
  // an incomplete listing; a collab or a single release often fits no slot at
  // all. Checked here and not only in the form, because the form is not the
  // only way to reach this.
  const category = toCategory(body.category);
  if (series !== null && category === null) {
    return NextResponse.json(
      { error: "A series piece needs a category" },
      { status: 400 },
    );
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

  // An id means "edit this one", which is why the form sends it back rather
  // than letting a rename mint a second piece. Its absence means "list a new
  // one", and those two want opposite things from a clash: an edit must land
  // on the row it names, while a new listing must never land on someone
  // else's — two products are allowed to share a title.
  const editingId = typeof body.id === "string" && body.id.trim() !== "" ? body.id : undefined;
  const draft = buildPiece({
    id: editingId,
    name,
    setName: typeof body.setName === "string" ? body.setName : "",
    series,
    scale,
    rarity,
    category,
    imageUrl: body.imageUrl,
    notes: typeof body.notes === "string" ? body.notes : "",
  });

  let piece = draft;
  if (editingId) {
    await savePieces([draft]);
  } else {
    piece = await createPiece(draft);
  }

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
