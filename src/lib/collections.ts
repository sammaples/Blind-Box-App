import "server-only";
import { productsFor } from "./catalog";
import { backend } from "./db";
import { LINES, type Line, type LineId } from "./lines";
import { shelfFor } from "./stock";

/** What a collection's bar on the front page needs to know. */
export interface CollectionCard {
  line: Line;
  /** The uploaded cover photo, or null for the drawn placeholder. */
  coverUrl: string | null;
  /** The cheapest box in it. */
  fromCents: number;
  /** Units left across all its boxes. Zero means nothing is stocked yet. */
  units: number;
}

/** Where a collection's cover photo is kept: a shop setting per collection. */
export const coverKey = (line: LineId) => `cover:${line}`;

export async function collectionCards(): Promise<CollectionCard[]> {
  return Promise.all(
    LINES.map(async (line) => {
      const boxes = productsFor(line.id);
      const [shelves, coverUrl] = await Promise.all([
        Promise.all(boxes.map((b) => shelfFor(b.id))),
        backend().getSetting(coverKey(line.id)),
      ]);
      return {
        line,
        coverUrl: coverUrl || null,
        fromCents: Math.min(...boxes.map((b) => b.priceCents)),
        units: shelves.flat().reduce((sum, e) => sum + e.available, 0),
      };
    }),
  );
}
