import { NextResponse } from "next/server";
import { parseCoinValue } from "@/lib/coins";
import { isAdmin } from "@/lib/admin";
import { toCategory } from "@/lib/catalog";
import { DEFAULT_LINE, toLine } from "@/lib/lines";
import { listingBase, listingIdFor } from "@/lib/listings";
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
  TIERS,
  setPieceArchived,
} from "@/lib/pieces";
import { applyStockChanges } from "@/lib/stock";
import type { Piece, Rarity, Scale, Tier } from "@/lib/types";

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

  // Which boxes a piece is in, changed from its own sheet: everything else
  // about it stays as it is.
  if (body.action === "setBoxes") {
    const pieceId = typeof body.pieceId === "string" ? body.pieceId : "";
    const piece = await findPiece(pieceId);
    if (!piece) {
      return NextResponse.json({ error: "No piece with that id" }, { status: 404 });
    }
    const asked: unknown[] = Array.isArray(body.tiers) ? body.tiers : [];
    if (asked.length === 0 || asked.some((t) => !TIERS.includes(t as Tier))) {
      return NextResponse.json({ error: "Pick at least one box" }, { status: 400 });
    }
    // Units to add, box by box: `add` is { bronze: 5, silver: 10, ... }.
    const add: Partial<Record<Tier, number>> = {};
    const rawAdd = (body.add ?? {}) as Record<string, unknown>;
    for (const t of TIERS) {
      const raw = rawAdd[t];
      if (raw === undefined || raw === null || raw === "") continue;
      const n = Math.trunc(Number(raw));
      if (!Number.isFinite(n) || n < 0 || n > 100_000) {
        return NextResponse.json({ error: "Units must be a number of zero or more" }, { status: 400 });
      }
      if (n > 0) add[t] = n;
    }
    const placed = await placeInBoxes(
      { ...piece, archived: false },
      pieceId,
      TIERS.filter((t) => asked.includes(t)),
      null,
    );
    if (!placed) {
      return NextResponse.json({ error: "No piece with that id" }, { status: 404 });
    }
    // After the placing, so a box it has only just gone into has a listing to
    // take the units.
    const changes = placed.pieces
      .filter((p) => add[p.tier])
      .map((p) => ({ pieceId: p.id, op: "add" as const, units: add[p.tier] }));
    const stock = changes.length > 0 ? await applyStockChanges(changes) : null;
    return NextResponse.json({ pieces: placed.pieces, stock });
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
      { error: "Scale must be 100%, 400% or 400%/100%" },
      { status: 400 },
    );
  }

  // Which boxes sell it: `tiers`, or the older single `tier`. Validated here
  // and not only in the form, because the form is not the only way to reach
  // this — and a piece in the wrong box is sold at the wrong price to the
  // wrong pool.
  const asked: unknown[] = Array.isArray(body.tiers) ? body.tiers : [body.tier ?? "bronze"];
  if (asked.length === 0 || asked.some((t) => !TIERS.includes(t as Tier))) {
    return NextResponse.json(
      { error: "Pick at least one box: bronze, silver, gold or diamond" },
      { status: 400 },
    );
  }
  // Cheapest first, once each.
  const tiers = TIERS.filter((t) => asked.includes(t));
  const tier = tiers[0];

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
  // Categories are Bearbrick's (flag, cute, jellybean...), so only a
  // Bearbrick series piece must have one.
  const line = toLine(body.line) ?? DEFAULT_LINE;
  if (series !== null && category === null && line === DEFAULT_LINE) {
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
  // Blank clears it back to "whatever this rarity is worth", which is a real
  // choice and has to stay reachable — an editor that can only ever set a
  // number leaves a piece stuck on a value somebody typed once by mistake.
  const coinValue = parseCoinValue(body.coinValue);
  if (coinValue === undefined) {
    return NextResponse.json(
      { error: "Coin value must be a whole number of zero or more" },
      { status: 400 },
    );
  }

  const editingId = typeof body.id === "string" && body.id.trim() !== "" ? body.id : undefined;
  const draft = buildPiece({
    id: editingId,
    line,
    name,
    setName: typeof body.setName === "string" ? body.setName : "",
    series,
    scale,
    tier,
    rarity,
    category,
    imageUrl: body.imageUrl,
    notes: typeof body.notes === "string" ? body.notes : "",
    coinValue,
  });

  const placed = await placeInBoxes(draft, editingId, tiers, quantity);
  if (!placed) {
    return NextResponse.json({ error: "No piece with that id" }, { status: 404 });
  }
  const piece = placed.pieces.find((p) => p.id === editingId) ?? placed.pieces[0];
  return NextResponse.json({ piece, pieces: placed.pieces, stock: placed.stock });
}

/**
 * Puts a product in exactly the boxes asked for and saves `draft`'s details
 * onto every one of them. A product in several boxes is one listing per box
 * (see lib/listings). Null when `editingId` names no piece.
 */
async function placeInBoxes(
  draft: Piece,
  editingId: string | undefined,
  tiers: readonly Tier[],
  quantity: number | null,
): Promise<{ pieces: Piece[]; stock: unknown } | null> {
  // A product in several boxes is one listing per box (see lib/listings).
  // `placed` are the listings it ends up with; `fresh` are the ones this save
  // put in a box they were not in, which is where new units go.
  const placed: Piece[] = [];
  const fresh: Piece[] = [];

  if (!editingId) {
    const first = await createPiece(draft);
    placed.push(first);
    for (const t of tiers.slice(1)) {
      placed.push(await createPiece({ ...draft, id: listingIdFor(first.id, t), tier: t }));
    }
    fresh.push(...placed);
  } else {
    const base = listingBase(editingId);
    const members = (await allPieces()).filter((p) => listingBase(p.id) === base);
    if (!members.some((m) => m.id === editingId)) {
      return null;
    }
    for (const t of TIERS) {
      const live = members.find((m) => m.tier === t && !m.archived);
      if (tiers.includes(t)) {
        // Already in this box: the edit applies here too. Taken out of it
        // before: brought back, history and all. Never in it: a new listing.
        const kept = live ?? members.find((m) => m.tier === t);
        if (kept) {
          const updated = { ...draft, id: kept.id, tier: t };
          await savePieces([updated]);
          if (kept.archived) {
            await setPieceArchived(kept.id, false);
            fresh.push(updated);
          }
          placed.push(updated);
        } else {
          const created = await createPiece({ ...draft, id: listingIdFor(base, t), tier: t });
          placed.push(created);
          fresh.push(created);
        }
      } else if (live) {
        // Taken out of this box. Deleted if none ever sold, otherwise archived
        // so the orders that pulled it still resolve — as Delete does.
        const removed = await deletePiece(live.id);
        if (!removed.deleted) await setPieceArchived(live.id, true);
      }
    }
  }

  // Listing a product and putting the box of them on the shelf is usually one
  // errand, so the form can do both — the same count in each box it went
  // into. Stock has to follow the save: there is nothing to attach units to
  // until the piece exists.
  let stock = null;
  if (quantity !== null && fresh.length > 0) {
    stock = await applyStockChanges(
      fresh.map((p) => ({ pieceId: p.id, op: "set" as const, units: quantity })),
    );
  }

  return { pieces: placed, stock };
}
