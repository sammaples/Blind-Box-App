import "server-only";
import { ALL_PIECES as DEMO_PIECES } from "./catalog";
import { backend } from "./db";
import type { ResetSummary } from "./db/types";
import type { Piece, Rarity, Scale } from "./types";

/**
 * The shop's catalogue: the pieces it actually sells.
 *
 * These come from the database, uploaded and edited in the admin console. The
 * generated set in catalog.ts is only demo data now — something to load into an
 * empty shop so it has something to show, not the source of truth.
 */

export const SCALES: readonly Scale[] = ["100%", "400%"];
export const RARITIES: readonly Rarity[] = ["common", "rare", "ultra", "chase"];

/** Every piece, archived included. Archived ones still resolve for old orders. */
export async function allPieces(): Promise<Piece[]> {
  return backend().listPieces();
}

/** The pieces that can be stocked and sold. */
export async function livePieces(): Promise<Piece[]> {
  return (await allPieces()).filter((p) => !p.archived);
}

export async function findPiece(id: string): Promise<Piece | null> {
  return (await allPieces()).find((p) => p.id === id) ?? null;
}

/** Looks up many at once, for pages that resolve a list of orders. */
export async function pieceMap(): Promise<Map<string, Piece>> {
  return new Map((await allPieces()).map((p) => [p.id, p]));
}

export async function savePieces(pieces: readonly Piece[]): Promise<void> {
  await backend().savePieces(pieces);
}

/** How many times to try a free id before giving up on a very popular title. */
const ID_ATTEMPTS = 200;

/**
 * Lists a brand-new piece, keeping its id distinct from every other.
 *
 * An id is derived from the title, so two products called the same thing want
 * the same one — and saving the second over the first is not what "add a
 * product" means. Two pieces really can share a title: a repaint, a size
 * variant, a second run, or simply a name a shop uses twice. So the first
 * takes the plain slug and the next takes `-2`, `-3`, and so on.
 *
 * The database decides who gets an id, not a lookup beforehand, so two
 * additions at the same instant end up as two listings rather than one
 * overwriting the other.
 */
export async function createPiece(piece: Piece): Promise<Piece> {
  const base = piece.id;
  for (let n = 1; n <= ID_ATTEMPTS; n++) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    const attempt = { ...piece, id: candidate };
    if (await backend().createPiece(attempt)) return attempt;
  }
  throw new Error(
    `Could not find a free id for "${piece.name}" after ${ID_ATTEMPTS} tries. ` +
      "Give this one a slightly different title.",
  );
}

/**
 * Removes a piece outright. Refuses, reporting the sold count, when units have
 * shipped — see the seam for why that has to be one operation.
 */
export async function deletePiece(
  pieceId: string,
): Promise<{ deleted: boolean; sold: number }> {
  return backend().deletePiece(pieceId);
}

/**
 * Empties the shop of product data — pieces, stock, orders, change log,
 * photos — and keeps the accounts. For the crossover from testing to real
 * inventory, where deleting a few hundred test pieces one at a time is not a
 * plan. Irreversible.
 */
export async function resetShop(): Promise<ResetSummary> {
  return backend().resetShop();
}

export async function setPieceArchived(
  pieceId: string,
  archived: boolean,
): Promise<Piece | null> {
  return backend().setPieceArchived(pieceId, archived);
}

/* ------------------------------------------------------------------ *
 * Building a piece from user input
 * ------------------------------------------------------------------ */

export interface PieceInput {
  id?: string;
  name: string;
  setName?: string;
  series?: number | null;
  scale: Scale;
  rarity?: Rarity;
  imageUrl?: unknown;
  notes?: string;
}

/** Turns a name into a stable, readable id, so a re-import updates in place. */
export function slugFor(name: string, scale: Scale): string {
  const slug = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const size = scale === "400%" ? "400" : "100";
  return `${size}-${slug || "piece"}`;
}

/**
 * Only http(s) and site-relative images are accepted. A `javascript:` or
 * `data:` URL in an image field is either a mistake or an attack, and this
 * value is rendered into pages.
 */
export function cleanImageUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed === "") return null;
  if (trimmed.startsWith("/")) return trimmed.slice(0, 500);
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString().slice(0, 500);
  } catch {
    return null;
  }
}

export function buildPiece(input: PieceInput): Piece {
  const scale: Scale = SCALES.includes(input.scale) ? input.scale : "100%";
  const rarity: Rarity =
    input.rarity && RARITIES.includes(input.rarity) ? input.rarity : "common";

  return {
    id: input.id?.trim() || slugFor(input.name, scale),
    name: input.name.trim().slice(0, 160),
    setName: (input.setName ?? "").trim().slice(0, 160),
    series:
      input.series === null || input.series === undefined || Number.isNaN(input.series)
        ? null
        : Math.trunc(input.series),
    type: "",
    scale,
    rarity,
    pattern: "solid",
    palette: { base: "", accent: "", detail: "", wash: "" },
    weight: 1,
    blurb: (input.notes ?? "").trim().slice(0, 500),
    imageUrl: cleanImageUrl(input.imageUrl),
    archived: false,
  };
}

/* ------------------------------------------------------------------ *
 * Demo data
 * ------------------------------------------------------------------ */

/** Loads the generated set so an empty shop has something to show. */
export async function loadDemoCatalogue(): Promise<number> {
  await savePieces(DEMO_PIECES.map((p) => ({ ...p, archived: false })));
  return DEMO_PIECES.length;
}
