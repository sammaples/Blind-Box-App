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

/* ------------------------------- buying them ----------------------------- */

/**
 * Packs, for somebody topping up on purpose.
 *
 * Round numbers that map onto the shelf: 25 is a bronze box, 50 a silver,
 * 100 a gold, 250 a diamond. Nobody has to do arithmetic to work out which
 * one gets them what they were looking at.
 *
 * No bonus coins on the bigger packs. A pack that pays 110 for 100 breaks the
 * one rule this currency has — that a coin is a dollar — and the moment it is
 * broken every price in the app becomes a question about which dollars.
 */
export const COIN_PACKS: readonly number[] = [25, 50, 100, 250];

/**
 * The floor on a single top-up.
 *
 * Not a taste call: card processing costs roughly thirty cents plus three
 * percent, so a one-dollar top-up hands a third of itself to the processor.
 * Five is where that becomes tolerable rather than absurd.
 */
export const MIN_TOPUP = 5;

/**
 * What to sell somebody who is short.
 *
 * The shortfall, rounded up to a multiple of five and never less than the
 * floor — so the offer is "buy what you are missing" rather than "buy a pack
 * four times the size of the gap", which is the version that reads as a shop
 * trying its luck.
 */
export function topUpFor(shortfall: number): number {
  return Math.max(MIN_TOPUP, Math.ceil(shortfall / 5) * 5);
}

/** What a number of coins costs, in cents. One coin, one dollar. */
export function topUpCost(coins: number): number {
  return coins * CENTS_PER_COIN;
}

/**
 * Whether this is an amount the shop will sell.
 *
 * Checked server-side against the same rule the page offers by, because the
 * quantity arrives in a request body and a shop that credits whatever number
 * it is handed is a shop that credits any number.
 */
export function sellableCoins(input: unknown): number | null {
  const value = Number(input);
  if (!Number.isFinite(value) || value <= 0) return null;
  const coins = Math.trunc(value);
  if (coins !== value) return null;
  if (coins < MIN_TOPUP) return null;
  // A multiple of five, so it is either a pack or a rounded-up shortfall.
  // Anything else is not something any part of this app would have asked for.
  if (coins % 5 !== 0) return null;
  // A ceiling, because a runaway or fat-fingered quantity should be refused
  // rather than charged.
  if (coins > 2000) return null;
  return coins;
}
