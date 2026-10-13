import "server-only";
import { productsFor, RARITY_ORDER } from "./catalog";
import { LINES, type Line } from "./lines";
import { shelfFor } from "./stock";
import type { Piece, StockEntry } from "./types";

/** What a collection's card on the front page needs to know. */
export interface CollectionCard {
  line: Line;
  /** The piece pictured on the card, or null for the collection's own drawing. */
  cover: Piece | null;
  /** The cheapest box in it. */
  fromCents: number;
  /** Units left across all its boxes. Zero means nothing is stocked yet. */
  units: number;
}

/**
 * The cover is the best thing on the shelf that has a photograph: a chase
 * before an ultra before a rare. With no photographs uploaded yet, Bearbrick
 * still has drawn pieces worth showing; the others fall back to their drawing.
 */
function coverFor(line: Line, shelf: StockEntry[]): Piece | null {
  const live = shelf
    .filter((e) => e.available > 0)
    .sort((a, b) => RARITY_ORDER.indexOf(a.piece.rarity) - RARITY_ORDER.indexOf(b.piece.rarity));
  const photo = live.find((e) => e.piece.imageUrl);
  if (photo) return photo.piece;
  if (line.id === "bearbrick") return live[0]?.piece ?? null;
  return null;
}

export async function collectionCards(): Promise<CollectionCard[]> {
  return Promise.all(
    LINES.map(async (line) => {
      const boxes = productsFor(line.id);
      const shelves = await Promise.all(boxes.map((b) => shelfFor(b.id)));
      const shelf = shelves.flat();
      return {
        line,
        cover: coverFor(line, shelf),
        fromCents: Math.min(...boxes.map((b) => b.priceCents)),
        units: shelf.reduce((sum, e) => sum + e.available, 0),
      };
    }),
  );
}
