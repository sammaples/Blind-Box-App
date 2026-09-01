import { BIG_PIECES, SERIES_PIECES } from "./catalog";
import type { Piece, Rarity, Scale } from "./types";

/**
 * WHAT IS CURRENTLY IN THE WAREHOUSE.
 *
 * This is the file you edit when new inventory lands. Everything else follows
 * from it: which pieces a box can contain, what each one's pull rate is, and
 * when a piece disappears because the last unit sold. Nothing is hardcoded
 * downstream — a box contains whatever is in stock at its scale.
 *
 * Pull rates are not set by hand. A piece's rate is its share of the units on
 * the shelf, so stocking six of something makes it exactly six times as likely
 * as stocking one.
 */

/* ------------------------------------------------------------------ *
 * 1. How many units a piece arrives with, by how rare it is
 * ------------------------------------------------------------------ */

const UNITS_BY_RARITY: Record<Scale, Record<Rarity, number>> = {
  "100%": { common: 24, uncommon: 18, rare: 10, ultra: 4, secret: 1, grail: 1 },
  "400%": { common: 60, uncommon: 40, rare: 18, ultra: 6, secret: 2, grail: 1 },
};

/* ------------------------------------------------------------------ *
 * 2. The 100% shelf — which series are on it right now
 * ------------------------------------------------------------------ */

/** Add a series number to stock the whole series. Remove one to pull it. */
export const STOCKED_SERIES: readonly number[] = [3, 12, 24, 38, 52];

/* ------------------------------------------------------------------ *
 * 3. The 400% shelf
 * ------------------------------------------------------------------ */

/** The 400% line is stocked as a whole collection. Set to false to pull it. */
export const STOCK_ALL_400 = true;

/* ------------------------------------------------------------------ *
 * 4. One-off adjustments
 * ------------------------------------------------------------------ */

/**
 * Units for individual pieces, on top of (or instead of) the shelves above.
 * Use this for a single piece that arrives outside a normal drop, or to
 * override the default count for one that did.
 *
 * Set a piece to 0 to keep it out of the boxes entirely.
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

function defaultUnits(piece: Piece): number {
  return UNITS_BY_RARITY[piece.scale][piece.rarity];
}

/**
 * Total units ever put into circulation, per piece. This only ever grows: a
 * restock raises the number here, and how many are left is this minus what has
 * sold. That way adding inventory never needs a migration.
 */
export function stockedUnits(): Map<string, number> {
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
