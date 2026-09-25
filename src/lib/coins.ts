import type { Piece, Rarity, Tier } from "./types";

/**
 * Coins.
 *
 * A shop currency worth exactly one dollar, because the alternative is
 * pretending to know what a piece is worth. These are not traded anywhere
 * with enough volume to have a price, so any exchange rate invented here
 * would be a number with nothing behind it — and a number with nothing
 * behind it is one people argue about. One coin is a dollar. A box that
 * costs twenty-five dollars costs twenty-five coins, and that sentence is
 * the whole exchange rate.
 *
 * What a coin is NOT is money. They come from trading a piece in and they
 * go into boxes; there is no path back out to a card. That is deliberate
 * and it is what keeps this a shop feature rather than a balance somebody
 * can ask to withdraw.
 */

/** A dollar. Everything else here follows from this one line. */
export const CENTS_PER_COIN = 100;

/** What a box costs in coins. Prices are whole dollars, so this is exact. */
export function coinPrice(priceCents: number): number {
  return Math.ceil(priceCents / CENTS_PER_COIN);
}

/**
 * What a piece is worth traded in, when nobody has said otherwise.
 *
 * A ladder rather than a formula. A formula would tie trade-in value to the
 * draw rate, and the draw rate moves every time stock changes — so the value
 * of a piece already sitting in somebody's vault would drift while they were
 * not looking, which is the one thing a currency must not do.
 *
 * Commons, rares and ultras are flat across every box: a common is a common
 * wherever it came out of, and paying more for one because it arrived in an
 * expensive box would reward buying the expensive box twice over.
 *
 * Chases are the exception, and they have to be. A chase is the piece the box
 * exists to hide, so its worth is the scarcity of the box it hides in — and
 * those differ by a factor of ten in price. One flat chase value would make
 * the diamond chase a bad trade and the bronze chase a way to print coins.
 */
export const TRADE_VALUE: Record<Rarity, number | Record<Tier, number>> = {
  common: 5,
  rare: 15,
  ultra: 50,
  chase: { bronze: 200, silver: 300, gold: 400, diamond: 500 },
};

/**
 * What this piece trades for.
 *
 * A piece's own `coinValue` wins when it has one, which is the point of the
 * column: the ladder is a starting position, not a rule, and a grail that is
 * worth more than its rarity says can be told so without moving it.
 */
export function tradeValue(piece: Pick<Piece, "rarity" | "tier" | "coinValue">): number {
  if (typeof piece.coinValue === "number" && piece.coinValue >= 0) {
    return Math.trunc(piece.coinValue);
  }
  return defaultTradeValue(piece.rarity, piece.tier);
}

/** The ladder on its own, for the importer and the console to show as a hint. */
export function defaultTradeValue(rarity: Rarity, tier: Tier): number {
  const value = TRADE_VALUE[rarity];
  return typeof value === "number" ? value : value[tier];
}

/**
 * Reads a coin value off a spreadsheet cell or a form field.
 *
 * An empty cell is not zero. It means "no opinion", which is what null is
 * for — a piece with no value of its own falls back to the ladder, and an
 * importer that read blanks as zero would quietly make every piece in an
 * uploaded catalogue worthless.
 */
export function parseCoinValue(input: unknown): number | null | undefined {
  if (input === undefined || input === null) return null;
  const raw = String(input).trim().replace(/^[¢$]/, "").replace(/,/g, "");
  if (raw === "") return null;

  const value = Number(raw);
  // `undefined` is the refusal, distinct from the null that means "no
  // opinion" — a caller has to be able to tell a blank from a typo.
  if (!Number.isFinite(value) || value < 0) return undefined;
  return Math.trunc(value);
}

/** Coins, written the way they are shown everywhere. */
export function formatCoins(amount: number): string {
  return amount.toLocaleString();
}
