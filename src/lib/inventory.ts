import type { Piece, Rarity, Scale, Tier } from "./types";

/**
 * Default quantities.
 *
 * Stock itself lives in the database and is managed at /admin — this only
 * supplies the number the console offers when you stock a piece you have not
 * stocked before, so a whole series can go on the shelf without typing a
 * quantity fifteen times.
 */

export const UNITS_BY_RARITY: Record<Scale, Record<Rarity, number>> = {
  "100%": { common: 24, rare: 8, ultra: 3, chase: 1 },
  "400%": { common: 60, rare: 14, ultra: 5, chase: 2 },
};

/**
 * How often a box should hit its chase, by tier.
 *
 * This is the one number a buyer is really asking about, and it is the reason
 * to pay more: bronze is a long shot, and the odds shorten every rung up the
 * ladder. Keeping them here rather than in the product copy means the figure
 * on the card cannot drift from the figure the draw actually runs at.
 *
 * It is a target rather than a setting, because nothing in this shop can set a
 * probability directly. A pull rate is a piece's share of the units left, so
 * the way to reach one in twelve is to put the right number of chase units on
 * the shelf — which is what `chaseUnitsFor` works out.
 */
export const CHASE_ODDS: Record<Tier, number> = {
  bronze: 1 / 12,
  silver: 1 / 9,
  gold: 1 / 6,
  diamond: 1 / 4,
};

/** "1 in 12", for saying a target out loud. */
export function oddsLabel(tier: Tier): string {
  return `1 in ${Math.round(1 / CHASE_ODDS[tier])}`;
}

/**
 * Units to put on each chase so the shelf lands on its tier's target.
 *
 * Solving `chase / (chase + rest) = p` for the chase total gives
 * `rest × p / (1 - p)`, split evenly across however many chases the shelf
 * holds. Rounding moves the real rate a little either way, which is why the
 * targets above are written as "around" — a shelf of whole figures cannot hit
 * an arbitrary fraction exactly, and pretending otherwise would put a number
 * on the card the draw does not honour.
 */
export function chaseUnitsFor(
  tier: Tier,
  nonChaseUnits: number,
  chasePieces: number,
): number {
  if (chasePieces <= 0 || nonChaseUnits <= 0) return 0;
  const p = CHASE_ODDS[tier];
  return Math.max(1, Math.round((nonChaseUnits * p) / (1 - p) / chasePieces));
}

/** The count the console offers when you stock a piece for the first time. */
export function defaultUnits(piece: Pick<Piece, "scale" | "rarity">): number {
  return UNITS_BY_RARITY[piece.scale][piece.rarity];
}
