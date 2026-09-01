import { BIG_PIECES, SERIES_PIECES } from "./catalog";
import type { Piece, Rarity, Scale } from "./types";

/**
 * THE OPENING STOCK.
 *
 * This file seeds the warehouse the first time the app runs. After that, stock
 * lives in the database and is managed from the admin console at /admin —
 * editing this file will not change a warehouse that has already been seeded.
 *
 * Pull rates are never set by hand, here or in the console. A piece's rate is
 * its share of the units on the shelf, so stocking six of something makes it
 * exactly six times as likely as stocking one.
 */

/* ------------------------------------------------------------------ *
 * 1. How many units a piece arrives with, by how rare it is
 * ------------------------------------------------------------------ */

/** Also used by the admin console to suggest a count when stocking a piece. */
export const UNITS_BY_RARITY: Record<Scale, Record<Rarity, number>> = {
  "100%": { common: 24, uncommon: 18, rare: 10, ultra: 4, secret: 1, grail: 1 },
  "400%": { common: 60, uncommon: 40, rare: 18, ultra: 6, secret: 2, grail: 1 },
};

/* ------------------------------------------------------------------ *
 * 2. The 100% shelf — which series are on it right now
 * ------------------------------------------------------------------ */

/** Series on the shelf at launch. Add or pull series from /admin afterwards. */
export const STOCKED_SERIES: readonly number[] = [3, 12, 24, 38, 52];

/* ------------------------------------------------------------------ *
 * 3. The 400% shelf
 * ------------------------------------------------------------------ */

/** Whether the 400% line is on the shelf at launch. */
export const STOCK_ALL_400 = true;

/* ------------------------------------------------------------------ *
 * 4. One-off adjustments
 * ------------------------------------------------------------------ */

/**
 * Units for individual pieces, on top of (or instead of) the shelves above.
 * Set a piece to 0 to keep it off the opening shelf entirely.
 */
export const EXTRA_UNITS: Readonly<Record<string, number>> = {
  // A single secret from a series that is otherwise not on the shelf.
  "s7-secret-0": 1,
  // The 1/1 really is a 1/1.
  "big-27-artist-proof-1-1": 1,
};

/* ------------------------------------------------------------------ *
 * Derived — you should not need to edit below this line
 * ------------------------------------------------------------------ */

/** The count the console offers when you stock a piece you have not before. */
export function defaultUnits(piece: Piece): number {
  return UNITS_BY_RARITY[piece.scale][piece.rarity];
}

/**
 * The opening shelf, used once to seed an empty warehouse. Thereafter the
 * database holds total units ever put into circulation per piece — a number
 * that only ever grows, with availability being that minus what has sold, so
 * a restock never needs a migration.
 */
export function seedStock(): Map<string, number> {
  const units = new Map<string, number>();

  for (const seriesNo of STOCKED_SERIES) {
    for (const piece of SERIES_PIECES.get(seriesNo) ?? []) {
      units.set(piece.id, defaultUnits(piece));
    }
  }

  if (STOCK_ALL_400) {
    for (const piece of BIG_PIECES) {
      units.set(piece.id, defaultUnits(piece));
    }
  }

  for (const [pieceId, count] of Object.entries(EXTRA_UNITS)) {
    if (count <= 0) units.delete(pieceId);
    else units.set(pieceId, count);
  }

  return units;
}
