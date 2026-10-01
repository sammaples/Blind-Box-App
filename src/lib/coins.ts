import type { Tier } from "./types";

/**
 * Coins.
 *
 * A reward, not a currency. Every box you open earns coins, and coins
 * redeem for boxes. Nothing else goes in or out: coins are not bought, a
 * piece is not sold for them, and there is no path back out to a card.
 * Rewards for other things — a daily sign-in and whatever follows — credit
 * the same balance, through the same ledger, from the Rewards tab.
 *
 * Both tables below are the whole economy, and they are meant to be tuned.
 * Change a number here and every page, the checkout and the server move
 * with it.
 */

/** What opening a box earns, by the box it was. */
export const BOX_REWARD: Record<Tier, number> = {
  bronze: 50,
  silver: 100,
  gold: 500,
  diamond: 1000,
};

/**
 * What a box costs redeemed with coins.
 *
 * Ten times what it earns: open ten of a box and the eleventh is on the
 * house. One rule rather than four prices, so it can be said in a sentence.
 */
export const REDEEM_COST: Record<Tier, number> = {
  bronze: BOX_REWARD.bronze * 10,
  silver: BOX_REWARD.silver * 10,
  gold: BOX_REWARD.gold * 10,
  diamond: BOX_REWARD.diamond * 10,
};

/** Coins earned by opening a box of this tier. */
export function boxReward(tier: Tier): number {
  return BOX_REWARD[tier];
}

/** Coins it takes to redeem a box of this tier. */
export function redeemCost(tier: Tier): number {
  return REDEEM_COST[tier];
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
