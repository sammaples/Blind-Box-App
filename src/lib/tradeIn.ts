import { productsFor } from "./catalog";
import type { LineId } from "./lines";
import type { Product } from "./types";

/**
 * Trade-ins: three pieces you don't want, all from one collection, go into
 * the whirlpool and a sealed Bronze box of that collection comes out.
 *
 * One collection at a time so a box of the cheapest collection can't be made
 * out of pieces of a dearer one, and so the box that comes out is the same
 * kind of thing that went in.
 */
export const TRADE_IN_COUNT = 3;

/** The box a trade-in makes, for a collection. */
export function tradeInBox(line: LineId): Product | undefined {
  return productsFor(line).find((p) => p.tier === "bronze");
}
