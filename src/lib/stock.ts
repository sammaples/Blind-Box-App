import "server-only";
import { randomUUID } from "node:crypto";
import { getPiece, getProduct } from "./catalog";
import { seedStock } from "./inventory";
import type { Db } from "./store";
import { transact } from "./store";
import type { AuditEntry, Piece, PoolSnapshot, StockEntry } from "./types";

/**
 * Live availability. The database holds how many units of each piece were ever
 * put into circulation and how many have sold; what is left is the pool a box
 * draws from, and each piece's pull rate is its share of it.
 *
 * Stock is edited from the admin console. An empty warehouse is seeded once
 * from src/lib/inventory.ts and never again.
 */

/** Seeds an untouched warehouse from the opening inventory, once. */
function stockLevels(db: Db): Record<string, number> {
  if (Object.keys(db.stock).length === 0 && Object.keys(db.sold).length === 0) {
    for (const [pieceId, units] of seedStock()) db.stock[pieceId] = units;
  }
  return db.stock;
}

/** Units left of each piece belonging to a product, sold-out pieces dropped. */
function availableUnits(db: Db, productId: string): Map<string, number> {
  const product = getProduct(productId);
  const left = new Map<string, number>();
  if (!product) return left;

  for (const [pieceId, stocked] of Object.entries(stockLevels(db))) {
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

    for (const [pieceId, stocked] of Object.entries(stockLevels(db))) {
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

/* ------------------------------------------------------------------ *
 * Admin operations
 * ------------------------------------------------------------------ */

export type StockOp = "add" | "set" | "pull";

export interface StockChange {
  pieceId: string;
  op: StockOp;
  /** Units to add, or the new total. Ignored by "pull". */
  units?: number;
}

export interface StockChangeResult {
  pieceId: string;
  stocked: number;
  sold: number;
  available: number;
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
export async function applyStockChanges(
  changes: readonly StockChange[],
): Promise<StockChangeResult[]> {
  return transact((db) => {
    const results: StockChangeResult[] = [];
    const entries: AuditEntry[] = [];
    // One id for the whole batch, so stocking a series reads as a single act
    // in the log rather than fifteen unrelated edits.
    const batchId = randomUUID();
    const at = new Date().toISOString();

    for (const change of changes) {
      const piece = getPiece(change.pieceId);
      if (!piece) continue;

      const sold = db.sold[change.pieceId] ?? 0;
      const current = db.stock[change.pieceId] ?? 0;
      const units = Number.isFinite(change.units) ? Math.floor(change.units!) : 0;

      let next: number;
      if (change.op === "add") next = current + Math.max(0, units);
      else if (change.op === "set") next = Math.max(0, units);
      else next = sold; // pull: nothing left available, history preserved

      // Never below what has sold, or availability would go negative.
      next = Math.max(next, sold);

      if (next === 0) delete db.stock[change.pieceId];
      else db.stock[change.pieceId] = next;

      results.push({
        pieceId: change.pieceId,
        stocked: next,
        sold,
        available: next - sold,
      });

      // A no-op edit is not worth a line in the log.
      if (next !== current) {
        entries.push({
          id: randomUUID(),
          batchId,
          at,
          pieceId: change.pieceId,
          op: change.op,
          before: current,
          after: next,
          sold,
        });
      }
    }

    // Newest first, and capped: this is an operational log, not an archive.
    db.audit = [...entries.reverse(), ...db.audit].slice(0, AUDIT_LIMIT);

    return results;
  });
}

/** How many inventory edits the log keeps before the oldest fall off. */
export const AUDIT_LIMIT = 1000;

/** The most recent inventory edits, newest first. */
export async function recentAudit(limit = 60): Promise<AuditEntry[]> {
  return transact((db) => db.audit.slice(0, Math.max(1, Math.min(limit, AUDIT_LIMIT))));
}

export interface WarehouseRow {
  piece: Piece;
  stocked: number;
  sold: number;
  available: number;
}

/** Every piece the warehouse has a record of, stocked or sold out. */
export async function warehouse(): Promise<WarehouseRow[]> {
  return transact((db) => {
    const levels = stockLevels(db);
    const ids = new Set([...Object.keys(levels), ...Object.keys(db.sold)]);

    const rows: WarehouseRow[] = [];
    for (const pieceId of ids) {
      const piece = getPiece(pieceId);
      if (!piece) continue;
      const stocked = levels[pieceId] ?? 0;
      const sold = db.sold[pieceId] ?? 0;
      rows.push({ piece, stocked, sold, available: Math.max(0, stocked - sold) });
    }
    return rows;
  });
}
