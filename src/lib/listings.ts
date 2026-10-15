import type { Tier } from "./types";

/**
 * One product in more than one box.
 *
 * Each box has its own shelf, so a product sold in several is several
 * listings — one per box, each with its own units and pull rate, so selling
 * one out of Bronze does not empty Silver. They are tied together by id: the
 * first keeps the plain id and every other is that id plus `-in-<box>`. That
 * way the console can find them all from any one of them without a column to
 * keep in step.
 *
 * Free of `server-only` so the console can group them too.
 */

const COPY = /-in-(?:bronze|silver|gold|diamond)(?:-\d+)?$/;

/** The id every listing of a product shares. */
export function listingBase(id: string): string {
  return id.replace(COPY, "");
}

/** The id a product's listing in another box starts from. */
export function listingIdFor(base: string, tier: Tier): string {
  return `${base}-in-${tier}`;
}
