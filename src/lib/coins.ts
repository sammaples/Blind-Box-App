/**
 * Coins.
 *
 * A reward, not a currency. Every box you open earns coins, and coins
 * redeem for boxes. Nothing else goes in or out: coins are not bought, a
 * piece is not sold for them, and there is no path back out to a card.
 * Rewards for other things — a daily sign-in and whatever follows — credit
 * the same balance, through the same ledger, from the Rewards tab.
 *
 * The two rates below are the whole economy, and they are meant to be tuned.
 * Change a number here and every page, the checkout and the server move
 * with it.
 */

/**
 * Every dollar spent on a box earns ten coins.
 *
 * Tied to the price rather than set per box, so the rate holds everywhere:
 * a $25 box earns 250, a $250 box earns 2,500, and a new box at any price
 * earns its share without anybody choosing a number for it.
 */
export const COINS_EARNED_PER_DOLLAR = 10;

/**
 * And a box costs a hundred coins per dollar of its price, redeemed.
 *
 * Ten times what it earns — so ten boxes bought pays for the next one at the
 * same price, which is the whole deal in one sentence.
 */
export const COINS_PER_DOLLAR_REDEEMED = 100;

/** Coins earned by opening a box bought at this price. */
export function boxReward(priceCents: number): number {
  return Math.round((priceCents / 100) * COINS_EARNED_PER_DOLLAR);
}

/** Coins it takes to redeem a box at this price. */
export function redeemCost(priceCents: number): number {
  return Math.round((priceCents / 100) * COINS_PER_DOLLAR_REDEEMED);
}

/**
 * Whether opening this order earns coins.
 *
 * A box bought with money does. A box redeemed with coins does not: if it
 * did, every redemption would pay back a tenth of itself, and coins would
 * slowly mint themselves out of nothing.
 */
export function earnsCoins(order: { paidCoins: number | null }): boolean {
  return order.paidCoins === null;
}

/**
 * Reads a coin value off a spreadsheet cell or a form field.
 *
 * Pieces still carry an optional coin value from when they could be traded
 * in. Nothing spends it now, but the column is kept so an older catalogue
 * still imports cleanly. An empty cell is null, not zero.
 */
export function parseCoinValue(input: unknown): number | null | undefined {
  if (input === undefined || input === null) return null;
  const raw = String(input).trim().replace(/^[¢$]/, "").replace(/,/g, "");
  if (raw === "") return null;

  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) return undefined;
  return Math.trunc(value);
}

/** Coins, written the way they are shown everywhere. */
export function formatCoins(amount: number): string {
  return amount.toLocaleString();
}
