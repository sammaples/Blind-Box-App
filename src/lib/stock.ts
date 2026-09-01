import "server-only";
import { getPiece, getProduct } from "./catalog";
import { stockedUnits } from "./inventory";
import type { Db } from "./store";
import { transact } from "./store";
import type { PoolSnapshot, StockEntry } from "./types";

/**
 * Live availability. Inventory says how many units of each piece were ever put
 * into circulation; the database says how many have sold. What is left is the
 * pool a box draws from, and each piece's pull rate is its share of it.
 */

/** Units left of each piece belonging to a product, sold-out pieces dropped. */
function availableUnits(db: Db, productId: string): Map<string, number> {
  const product = getProduct(productId);
  const left = new Map<string, number>();
  if (!product) return left;

  for (const [pieceId, stocked] of stockedUnits()) {
    const piece = getPiece(pieceId);
    if (!piece || piece.scale !== product.scale) continue;

    const available = stocked - (db.sold[pieceId] ?? 0);
    if (available > 0) left.set(pieceId, available);
  }
  return left;
}

function toSnapshot(units: Map<string, number>): PoolSnapshot {
  // Sorted so a snapshot is stable and a replay walks it in the same order.
  return [...units.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([pieceId, count]) => [pieceId, count] as const);
}

/**
 * The product's shelf, including sold-out pieces so the listing can still show
 * what has been and gone. Odds are computed over the units that remain.
 */
export async function shelfFor(productId: string): Promise<StockEntry[]> {
  return transact((db) => {
    const product = getProduct(productId);
    if (!product) return [];

    const entries: Omit<StockEntry, "odds">[] = [];
    let remaining = 0;

    for (const [pieceId, stocked] of stockedUnits()) {
      const piece = getPiece(pieceId);
      if (!piece || piece.scale !== product.scale) continue;

      const available = Math.max(0, stocked - (db.sold[pieceId] ?? 0));
      remaining += available;
      entries.push({ piece, stocked, available });
    }

    return entries.map((entry) => ({
      ...entry,
      odds: remaining > 0 ? entry.available / remaining : 0,
    }));
  });
}

/** Total units left across a product, which is also whether it can be sold. */
export async function unitsLeft(productId: string): Promise<number> {
  const shelf = await shelfFor(productId);
  return shelf.reduce((sum, entry) => sum + entry.available, 0);
}

export interface Reservation {
  pieceId: string;
  seed: string;
  rollValue: number;
  poolSnapshot: PoolSnapshot;
}

/**
 * Draws a piece and takes its unit off the shelf in a single transaction, then
 * hands the caller the drawn piece plus everything needed to audit the roll.
 * `write` runs inside the same transaction so the order is persisted atomically
 * with the stock decrement — a purchase can never take a unit without an order,
 * or record an order without taking a unit.
 */
export async function reserve(
  productId: string,
  draw: (snapshot: PoolSnapshot) => { pieceId: string; seed: string; rollValue: number },
  write: (db: Db, reservation: Reservation) => void,
): Promise<Reservation | null> {
  return transact((db) => {
    const units = availableUnits(db, productId);
    if (units.size === 0) return null;

    const poolSnapshot = toSnapshot(units);
    const { pieceId, seed, rollValue } = draw(poolSnapshot);
    if (!units.has(pieceId)) return null;

    db.sold[pieceId] = (db.sold[pieceId] ?? 0) + 1;

    const reservation = { pieceId, seed, rollValue, poolSnapshot };
    write(db, reservation);
    return reservation;
  });
}
