import "server-only";
import { getProduct } from "./catalog";
import { backend } from "./db";
import type { BuildOrder, Draw, StockChange } from "./db/types";
import { pieceMap } from "./pieces";
import type { AuditBatch, Piece, StockEntry } from "./types";

/**
 * Live availability. The backend holds how many units of each piece were put
 * into circulation and how many have sold; what is left is the pool a box
 * draws from, and each piece's pull rate is its share of it.
 *
 * Stock is edited from the admin console. An empty warehouse is seeded once
 * from src/lib/inventory.ts and never again.
 */

export interface WarehouseRow {
  piece: Piece;
  stocked: number;
  sold: number;
  available: number;
}

/** Every piece the warehouse has a record of, stocked or sold out. */
export async function warehouse(): Promise<WarehouseRow[]> {
  const [rows, pieces] = await Promise.all([backend().stockRows(), pieceMap()]);

  const out: WarehouseRow[] = [];
  for (const row of rows) {
    // Archived pieces leave the shelf entirely: withdrawing a piece has to
    // mean it cannot be sold, not merely that it is hidden. Their stock rows
    // survive, so restoring one brings it back exactly as it was.
    const piece = pieces.get(row.pieceId);
    if (!piece || piece.archived) continue;
    out.push({
      piece,
      stocked: row.stocked,
      sold: row.sold,
      available: Math.max(0, row.stocked - row.sold),
    });
  }
  return out;
}

/**
 * The product's shelf, including sold-out pieces so the listing can still show
 * what has been and gone. Odds are computed over the units that remain.
 */
export async function shelfFor(productId: string): Promise<StockEntry[]> {
  const product = getProduct(productId);
  if (!product) return [];

  const rows = (await warehouse()).filter((r) => r.piece.scale === product.scale);
  const remaining = rows.reduce((sum, r) => sum + r.available, 0);

  return rows.map((row) => ({
    piece: row.piece,
    stocked: row.stocked,
    available: row.available,
    odds: remaining > 0 ? row.available / remaining : 0,
  }));
}

/** Total units left across a product, which is also whether it can be sold. */
export async function unitsLeft(productId: string): Promise<number> {
  const shelf = await shelfFor(productId);
  return shelf.reduce((sum, entry) => sum + entry.available, 0);
}

/**
 * Draws a piece for a product and takes its unit off the shelf in one
 * transaction, writing the order alongside — so a purchase can never take a
 * unit without an order, or record an order without taking a unit.
 */
export async function reserve(productId: string, draw: Draw, build: BuildOrder) {
  const product = getProduct(productId);
  if (!product) return null;
  return backend().reserve(product.scale, draw, build);
}

/* ------------------------------------------------------------------ *
 * Admin operations
 * ------------------------------------------------------------------ */

export type { StockOp, StockChangeResult } from "./db/types";

export interface AdminStockChange {
  pieceId: string;
  op: "add" | "set" | "pull";
  units?: number;
}

/**
 * Applies stock edits in one transaction.
 *
 * - `add`  puts more units into circulation.
 * - `set`  makes the total exactly this, floored at what has already sold —
 *          units that left the building cannot be un-shipped.
 * - `pull` takes the remaining units off the shelf, leaving the sold history
 *          intact so past orders still reconcile.
 */
export async function applyStockChanges(changes: readonly AdminStockChange[]) {
  const pieces = await pieceMap();

  const resolved: StockChange[] = [];
  for (const change of changes) {
    const piece = pieces.get(change.pieceId);
    if (!piece) continue;
    resolved.push({ ...change, scale: piece.scale });
  }
  return backend().applyStockChanges(resolved);
}

/** How many inventory edits the log keeps before the oldest fall off. */
export const AUDIT_LIMIT = 1000;

/** The most recent inventory edits as batch summaries, newest first. */
export async function recentAudit(limit = 60): Promise<AuditBatch[]> {
  return backend().recentAudit(Math.max(1, Math.min(limit, AUDIT_LIMIT)));
}
