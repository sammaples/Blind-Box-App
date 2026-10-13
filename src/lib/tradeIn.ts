import { productsFor } from "./catalog";
import type { LineId } from "./lines";
import type { Product, Tier } from "./types";

/**
 * Trade-ins: pieces you don't want, all from one collection, go into the
 * whirlpool and a sealed box of that collection comes out. The better the
 * box, the more pieces it takes.
 *
 * One collection at a time so a box of one collection can't be made out of
 * pieces of another, and so what comes out is the same kind of thing that
 * went in.
 */
export const TRADE_IN_COST: Record<Tier, number> = {
  bronze: 3,
  silver: 5,
  gold: 10,
  diamond: 25,
};

export const TRADE_IN_TIERS: readonly Tier[] = ["bronze", "silver", "gold", "diamond"];

/** The most pieces any trade takes. */
export const TRADE_IN_MAX = Math.max(...Object.values(TRADE_IN_COST));

/** The box a trade-in makes, for a collection and a tier. */
export function tradeInBox(line: LineId, tier: Tier = "bronze"): Product | undefined {
  return productsFor(line).find((p) => p.tier === tier);
}

export function toTradeTier(value: unknown): Tier | null {
  return typeof value === "string" && (TRADE_IN_TIERS as readonly string[]).includes(value) ? (value as Tier) : null;
}
