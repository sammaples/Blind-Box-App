import type { Piece, Rarity, Scale } from "./types";

/**
 * Default quantities.
 *
 * Stock itself lives in the database and is managed at /admin — this only
 * supplies the number the console offers when you stock a piece you have not
 * stocked before, so a whole series can go on the shelf without typing a
 * quantity fifteen times.
 */

export const UNITS_BY_RARITY: Record<Scale, Record<Rarity, number>> = {
  "100%": { common: 24, uncommon: 18, rare: 10, ultra: 4, secret: 1, grail: 1 },
  "400%": { common: 60, uncommon: 40, rare: 18, ultra: 6, secret: 2, grail: 1 },
};

/** The count the console offers when you stock a piece for the first time. */
export function defaultUnits(piece: Pick<Piece, "scale" | "rarity">): number {
  return UNITS_BY_RARITY[piece.scale][piece.rarity];
}
