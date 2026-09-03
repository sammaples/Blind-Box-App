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
  "100%": { common: 24, rare: 8, chase: 1 },
  "400%": { common: 60, rare: 14, chase: 2 },
};

/** The count the console offers when you stock a piece for the first time. */
export function defaultUnits(piece: Pick<Piece, "scale" | "rarity">): number {
  return UNITS_BY_RARITY[piece.scale][piece.rarity];
}
