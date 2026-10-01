import "server-only";
import { backend } from "./db";
import { pieceMap } from "./pieces";
import type { Pull } from "./types";

/**
 * What has come out of the boxes lately.
 *
 * The shop shows this under whichever box you are looking at, so it is read
 * once for every box at a time rather than once per box: one trip for the
 * newest pulls overall, then split by product here. A shop with four boxes and
 * one busy tier would otherwise do four queries to fill three empty rows.
 */

/** How many to read. A row shows a handful; the rest is headroom for a tier
 *  that has not sold in a while, so its row is not empty just because another
 *  tier has been busy. */
const LOOKBACK = 120;

/** Per box, newest first, at most `perProduct` each. */
export async function recentPullsByProduct(
  perProduct = 8,
): Promise<Record<string, Pull[]>> {
  const [pulls, pieces] = await Promise.all([
    backend().recentPulls(LOOKBACK),
    pieceMap(),
  ]);

  const out: Record<string, Pull[]> = {};
  for (const pull of pulls) {
    const piece = pieces.get(pull.pieceId);
    // A piece deleted from the catalogue outright takes its pulls off the feed
    // with it; an archived one is only withdrawn from sale, and what somebody
    // already pulled still happened.
    if (!piece) continue;

    const list = (out[pull.productId] ??= []);
    if (list.length >= perProduct) continue;
    list.push({ orderId: pull.orderId, piece, at: pull.at });
  }
  return out;
}
