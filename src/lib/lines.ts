/**
 * Collections: the kinds of collectible the shop sells.
 *
 * The front page is a row of these; each one opens the same box shop — the
 * four tiers, Bronze to Diamond — over its own pieces and its own stock. A
 * piece belongs to exactly one collection, and a box only ever draws from its
 * own collection's shelf.
 *
 * Adding one is an entry here and a cover in CollectionArt. Everything else —
 * its boxes, its shop page, its place in the console's pickers and in the
 * spreadsheet import — follows from this list.
 */

export type LineId = "bearbrick" | "popmart" | "squishy" | "tapcap";

export interface Line {
  id: LineId;
  name: string;
  /** The colour its card and cover are washed in. */
  accent: string;
  /** Whether its pieces come in sizes (100%, 400%...). Bearbrick does. */
  sized: boolean;
}

/** In the order they appear on the front page. */
export const LINES: readonly Line[] = [
  { id: "bearbrick", name: "Be@rbrick", accent: "#e0465b", sized: true },
  { id: "popmart", name: "Pop Mart", accent: "#f2a7c8", sized: false },
  { id: "squishy", name: "Squishy", accent: "#7ad3c4", sized: false },
  { id: "tapcap", name: "TapCap", accent: "#9be22f", sized: false },
];

/** Where everything that predates collections belongs. */
export const DEFAULT_LINE: LineId = "bearbrick";

export function getLine(id: string): Line | undefined {
  return LINES.find((l) => l.id === id);
}

/**
 * Reads a collection off a form field or a spreadsheet cell: "Pop Mart",
 * "popmart" and "POP-MART" are all the same one. Null when it is none of them.
 */
export function toLine(value: unknown): LineId | null {
  if (typeof value !== "string") return null;
  const key = value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  if (key === "") return null;
  const found = LINES.find((l) => l.id === key || l.name.toLowerCase().replace(/[^a-z0-9]/g, "") === key);
  if (found) return found.id;
  // The names people actually type for the first one.
  if (key === "bearbricks" || key === "berbrick" || key === "bearbick") return "bearbrick";
  if (key === "squishies" || key === "squish") return "squishy";
  if (key === "tapcaps" || key === "tapcapp") return "tapcap";
  return null;
}
