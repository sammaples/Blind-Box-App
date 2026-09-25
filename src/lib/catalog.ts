import type { Category, Palette, PatternKind, Piece, Product, Rarity, Tier } from "./types";

/**
 * The reference catalogue: every piece that exists, generated deterministically
 * from the tables below. It is a pure module with no Node built-ins, so both
 * the server and client components can build it locally.
 *
 * This is NOT what a box can contain. What is actually buyable is decided by
 * src/lib/inventory.ts — the pieces currently in stock. A piece can sit in this
 * catalogue for years without ever being on the shelf.
 */

/* ------------------------------------------------------------------ *
 * Deterministic helpers
 * ------------------------------------------------------------------ */

function hash(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function pick<T>(items: readonly T[], key: string): T {
  return items[hash(key) % items.length];
}

function hsl(h: number, s: number, l: number): string {
  return `hsl(${((h % 360) + 360) % 360} ${s}% ${l}%)`;
}

/* ------------------------------------------------------------------ *
 * Series table — 52 numbered series, each with its own colour identity
 * ------------------------------------------------------------------ */

interface SeriesTheme {
  name: string;
  hue: number;
}

const SERIES_THEMES: readonly SeriesTheme[] = [
  { name: "Origin", hue: 8 },
  { name: "Playground", hue: 32 },
  { name: "Neon Alley", hue: 300 },
  { name: "Deep Current", hue: 205 },
  { name: "Paper Lantern", hue: 24 },
  { name: "Static", hue: 0 },
  { name: "Greenhouse", hue: 132 },
  { name: "Midnight Arcade", hue: 268 },
  { name: "Sandstorm", hue: 40 },
  { name: "Cold Open", hue: 190 },
  { name: "Sugar Riot", hue: 330 },
  { name: "Blueprint", hue: 218 },
  { name: "Lucky Cat", hue: 12 },
  { name: "Aurora", hue: 160 },
  { name: "Concrete", hue: 220 },
  { name: "Wildfire", hue: 18 },
  { name: "Tidepool", hue: 178 },
  { name: "Velvet Hour", hue: 286 },
  { name: "Citrus Grove", hue: 52 },
  { name: "Ghost Town", hue: 250 },
  { name: "Cosmic Drift", hue: 244 },
  { name: "Bubblegum", hue: 336 },
  { name: "Ironworks", hue: 200 },
  { name: "Mossy", hue: 108 },
  { name: "Sunset Boulevard", hue: 20 },
  { name: "Porcelain", hue: 210 },
  { name: "Thunder", hue: 232 },
  { name: "Marigold", hue: 44 },
  { name: "Riptide", hue: 186 },
  { name: "Carnival", hue: 348 },
  { name: "Obsidian", hue: 264 },
  { name: "Peach Fuzz", hue: 16 },
  { name: "Cobalt", hue: 224 },
  { name: "Fernwood", hue: 144 },
  { name: "Ash & Ember", hue: 6 },
  { name: "Lilac Static", hue: 278 },
  { name: "Goldrush", hue: 46 },
  { name: "Glacier", hue: 196 },
  { name: "Crimson Tape", hue: 356 },
  { name: "Seafoam", hue: 168 },
  { name: "Ultraviolet", hue: 292 },
  { name: "Amber Room", hue: 36 },
  { name: "Monochrome", hue: 214 },
  { name: "Koi Pond", hue: 4 },
  { name: "Electric Grass", hue: 96 },
  { name: "Nightshade", hue: 272 },
  { name: "Copperline", hue: 26 },
  { name: "Arctic Signal", hue: 192 },
  { name: "Rosewater", hue: 342 },
  { name: "Jade Gate", hue: 152 },
  { name: "Solar Flare", hue: 30 },
  { name: "Final Cut", hue: 256 },
];

/* ------------------------------------------------------------------ *
 * Type table — the lineup inside every series. Weights sum to 1000, so
 * each series contributes the same total probability to a mixed pool.
 * ------------------------------------------------------------------ */

/**
 * Where one piece sits: which box it comes out of, and how it ranks inside
 * that box.
 *
 * Rarity is relative to the tier, not to the shop. A Flag is the rare of a
 * bronze box and would be unremarkable in a gold one; grading it against
 * every piece on sale would leave the cheap box with no rare in it at all,
 * which is the one thing a blind box cannot be.
 */
interface Grade {
  tier: Tier;
  rarity: Rarity;
}

interface TypeSpec {
  type: string;
  /** The shop category this lineup slot belongs to. Null where none fits. */
  category: Category | null;
  /** One entry per piece of this type in the series. */
  weights: readonly number[];
  pattern: PatternKind;
  /** One per weight, in the same order: which box that piece is sold in. */
  grades: readonly Grade[];
  /** Hue offset from the series hue, applied per piece. */
  hueShift: number;
  colorways: readonly string[];
}

const bronze = (rarity: Rarity): Grade => ({ tier: "bronze", rarity });
const silver = (rarity: Rarity): Grade => ({ tier: "silver", rarity });
const gold = (rarity: Rarity): Grade => ({ tier: "gold", rarity });
const diamond = (rarity: Rarity): Grade => ({ tier: "diamond", rarity });

const TYPE_SPECS: readonly TypeSpec[] = [
  {
    type: "Basic",
    category: null,
    weights: [90, 90],
    pattern: "solid",
    grades: [bronze("common"), bronze("common")],
    hueShift: 0,
    colorways: ["B", "E", "@", "R", "!"],
  },
  {
    type: "Jellybean",
    category: "jellybean",
    weights: [100],
    pattern: "jelly",
    grades: [bronze("common")],
    hueShift: 26,
    colorways: ["Lime", "Grape", "Soda", "Peach", "Mint", "Cherry", "Melon"],
  },
  {
    type: "Cute",
    category: "cute",
    weights: [90],
    pattern: "split",
    grades: [bronze("common")],
    hueShift: -34,
    colorways: ["Marshmallow", "Cloudy", "Sprinkle", "Milk Tea", "Pudding"],
  },
  {
    type: "Pattern",
    category: "pattern",
    weights: [80, 80],
    pattern: "checker",
    grades: [bronze("common"), bronze("common")],
    hueShift: 48,
    colorways: ["Checker", "Argyle", "Houndstooth", "Tartan", "Halftone"],
  },
  {
    type: "Flag",
    category: "flag",
    weights: [90],
    pattern: "stripes",
    grades: [bronze("rare")],
    hueShift: 120,
    colorways: ["Tricolour", "Ensign", "Pennant", "Standard", "Banner"],
  },
  {
    type: "Animal",
    category: "animal",
    weights: [80],
    pattern: "camo",
    grades: [silver("common")],
    hueShift: 74,
    colorways: ["Leopard", "Tiger", "Koi", "Tortoise", "Snow Hare"],
  },
  {
    type: "Horror",
    category: "horror",
    weights: [70],
    pattern: "drip",
    grades: [silver("common")],
    hueShift: 172,
    colorways: ["Nightcrawler", "Wax Museum", "Bad Signal", "Grave Shift"],
  },
  {
    type: "SF",
    category: "scifi",
    weights: [70],
    pattern: "chrome",
    grades: [silver("rare")],
    hueShift: 198,
    colorways: ["Exosuit", "Ion Drive", "Rover", "Satellite", "Cold Fusion"],
  },
  {
    type: "Artist",
    category: "artist",
    weights: [50, 45, 40],
    pattern: "gradient",
    grades: [gold("rare"), gold("rare"), silver("ultra")],
    hueShift: 96,
    colorways: [
      "Studio Proof",
      "Off Register",
      "Ink Wash",
      "Screenprint",
      "Overspray",
      "Collage",
      "Colour Field",
    ],
  },
  {
    type: "Hero",
    category: "hero",
    weights: [20],
    pattern: "stars",
    grades: [gold("ultra")],
    hueShift: 210,
    colorways: ["Cape", "Insignia", "Sidekick", "Vigilante"],
  },
  {
    type: "Secret",
    category: "secret",
    weights: [5],
    pattern: "chrome",
    grades: [diamond("ultra")],
    hueShift: 180,
    colorways: ["Secret"],
  },
];

/** Series whose hidden piece is a chase rather than an ordinary secret. */
const GRAIL_SERIES = new Set([1, 13, 21, 27, 34, 42, 50]);

/* ------------------------------------------------------------------ *
 * Piece construction
 * ------------------------------------------------------------------ */

function paletteFor(
  hue: number,
  spec: Pick<TypeSpec, "pattern" | "hueShift">,
  key: string,
): Palette {
  const jitter = (hash(key) % 18) - 9;
  const h = hue + spec.hueShift + jitter;

  switch (spec.pattern) {
    case "jelly":
      return { base: hsl(h, 82, 62), accent: hsl(h + 30, 90, 74), detail: hsl(h, 60, 22), wash: hsl(h, 60, 12) };
    case "chrome":
      return { base: hsl(h, 18, 74), accent: hsl(h + 20, 40, 46), detail: hsl(h, 30, 16), wash: hsl(h, 34, 11) };
    case "drip":
      return { base: hsl(h, 24, 20), accent: hsl(h + 150, 78, 52), detail: hsl(h, 20, 88), wash: hsl(h, 30, 8) };
    case "stars":
      return { base: hsl(h, 62, 42), accent: hsl(h + 42, 92, 66), detail: hsl(h, 40, 94), wash: hsl(h, 44, 12) };
    case "camo":
      return { base: hsl(h, 34, 52), accent: hsl(h + 26, 44, 30), detail: hsl(h, 24, 14), wash: hsl(h, 30, 10) };
    case "checker":
      return { base: hsl(h, 58, 58), accent: hsl(h + 8, 20, 96), detail: hsl(h, 44, 18), wash: hsl(h, 40, 11) };
    case "stripes":
      return { base: hsl(h, 70, 54), accent: hsl(h + 160, 74, 56), detail: hsl(h, 30, 96), wash: hsl(h, 44, 11) };
    case "split":
      return { base: hsl(h, 66, 76), accent: hsl(h + 54, 74, 62), detail: hsl(h, 40, 24), wash: hsl(h, 40, 12) };
    case "gradient":
      return { base: hsl(h, 72, 56), accent: hsl(h + 68, 80, 60), detail: hsl(h, 30, 96), wash: hsl(h, 46, 11) };
    default:
      return { base: hsl(h, 64, 56), accent: hsl(h + 18, 50, 40), detail: hsl(h, 40, 96), wash: hsl(h, 40, 11) };
  }
}

const BLURBS: Record<string, readonly string[]> = {
  Basic: [
    "The house standard. Flat colour, sharp seams, no story needed.",
    "Case filler in the best sense — the piece every shelf is built around.",
  ],
  Jellybean: [
    "Translucent candy shell. Holds light like a boiled sweet.",
    "Cast in tinted resin so the joints glow when it is backlit.",
  ],
  Cute: [
    "Two-tone pastel finish with a soft matte topcoat.",
    "Built for the front row of the shelf. Unapologetically sweet.",
  ],
  Pattern: [
    "All-over print wrapped across the moulded seams.",
    "A textile idea pushed onto a plastic body. Alignment is half the trick.",
  ],
  Flag: [
    "Banner colours blocked across the torso and legs.",
    "Ceremonial palette, applied with a very steady hand.",
  ],
  Animal: [
    "Hand-laid animal markings, no two masks identical.",
    "Coat pattern printed wet-on-wet for a softer edge.",
  ],
  Horror: [
    "Matte black body with a wet-look drip down the chest.",
    "Glows a sickly green once the lights go out.",
  ],
  SF: [
    "Vac-metallised shell with brushed panel lines.",
    "Reads like machined metal until you pick it up.",
  ],
  Artist: [
    "A studio collaboration, produced in a single short run.",
    "Off-register by design. The misprint is the artwork.",
  ],
  Hero: [
    "Licensed hero colourway with a foil chest insignia.",
    "Cape-adjacent. Short run, loud palette.",
  ],
  Secret: [
    "The chase. Roughly one per five cases, and never announced.",
    "Unlisted on the series sheet. You only know when you open it.",
  ],
};

function buildPiece(seriesNo: number, spec: TypeSpec, index: number): Piece {
  const theme = SERIES_THEMES[seriesNo - 1];
  const key = `s${seriesNo}-${spec.type}-${index}`;
  const grade = spec.grades[index];
  const isGrail = spec.type === "Secret" && GRAIL_SERIES.has(seriesNo);
  // Offset by index off a series-level hash, so two pieces of the same type in
  // one series can never land on the same colourway name.
  const colorway =
    spec.type === "Secret"
      ? isGrail
        ? "Grail"
        : "Secret"
      : spec.colorways[
          (hash(`s${seriesNo}-${spec.type}`) + index) % spec.colorways.length
        ];

  const name =
    spec.type === "Secret"
      ? `${theme.name} ${colorway}`
      : `${spec.type} ${colorway}`;

  return {
    id: `s${seriesNo}-${spec.type.toLowerCase()}-${index}`,
    // The demo catalogue states no opinion, so every generated piece falls
    // back to the rarity ladder. It is the console's job to disagree.
    coinValue: null,
    name,
    setName: `Series ${seriesNo} · ${theme.name}`,
    series: seriesNo,
    type: spec.type,
    category: spec.category,
    scale: "100%",
    tier: grade.tier,
    // No 100% is a chase any more: the chase slot in every box is a 400%, so
    // the hidden series piece tops out at ultra and the big format takes over
    // from there.
    rarity: grade.rarity,
    pattern: spec.pattern,
    palette: paletteFor(theme.hue, spec, key),
    weight: spec.weights[index],
    blurb: pick(BLURBS[spec.type] ?? BLURBS.Basic, key),
    imageUrl: null,
    archived: false,
  };
}

function buildSeries(seriesNo: number): Piece[] {
  const pieces: Piece[] = [];
  for (const spec of TYPE_SPECS) {
    for (let i = 0; i < spec.weights.length; i++) {
      pieces.push(buildPiece(seriesNo, spec, i));
    }
  }
  return pieces;
}

/**
 * 1…52. Doubles as the series picker in the product form, which is why it is
 * a list rather than a maximum: the form should offer exactly the series this
 * shop numbers, and there should not be a second list of them to disagree.
 */
export const SERIES_NUMBERS: readonly number[] = Array.from(
  { length: SERIES_THEMES.length },
  (_, i) => i + 1,
);

export const SERIES_PIECES: ReadonlyMap<number, readonly Piece[]> = new Map(
  SERIES_NUMBERS.map((n) => [n, buildSeries(n)] as const),
);

export function seriesName(seriesNo: number): string {
  return SERIES_THEMES[seriesNo - 1].name;
}

const ALL_100: readonly Piece[] = SERIES_NUMBERS.flatMap(
  (n) => SERIES_PIECES.get(n) as Piece[],
);

/* ------------------------------------------------------------------ *
 * 400% collection — a curated standalone set, not tied to a series
 * ------------------------------------------------------------------ */

interface BigSpec {
  name: string;
  hue: number;
  pattern: PatternKind;
  /** Ranks the set from commonest to scarcest, which is what picks its tier. */
  weight: number;
  blurb: string;
}

const BIG_SPECS: readonly BigSpec[] = [
  { name: "Bone White", hue: 210, pattern: "solid", weight: 110, blurb: "Unpainted resin white. The shape, and nothing else." },
  { name: "Carbon", hue: 220, pattern: "solid", weight: 105, blurb: "Deep matte black with a faint pearl in the flake." },
  { name: "Signal Orange", hue: 26, pattern: "solid", weight: 100, blurb: "Safety-cone orange, gloss finish, impossible to ignore." },
  { name: "Jelly Grape", hue: 288, pattern: "jelly", weight: 95, blurb: "Clear violet cast with a frosted interior." },
  { name: "Jelly Soda", hue: 196, pattern: "jelly", weight: 92, blurb: "Bottle-glass blue. Reads almost liquid under a spotlight." },
  { name: "Sakura Fade", hue: 340, pattern: "gradient", weight: 70, blurb: "Airbrushed pink-to-white fade over the shoulders." },
  { name: "Court Checker", hue: 12, pattern: "checker", weight: 66, blurb: "Two-inch check wrapped clean across the body seam." },
  { name: "Ranger Camo", hue: 96, pattern: "camo", weight: 64, blurb: "Four-colour woodland pattern, hand-masked in layers." },
  { name: "Track Stripe", hue: 232, pattern: "stripes", weight: 62, blurb: "Racing stripes down the centreline, tape-edge crisp." },
  { name: "Tiger Coat", hue: 34, pattern: "camo", weight: 58, blurb: "Brushstroke markings laid over a warm amber base." },
  { name: "Midnight Drip", hue: 268, pattern: "drip", weight: 44, blurb: "Gloss drip pulled down a matte body. Wet forever." },
  { name: "Static Ghost", hue: 250, pattern: "drip", weight: 42, blurb: "Glow-in-the-dark shell with a broadcast-static overlay." },
  { name: "Chrome Silver", hue: 205, pattern: "chrome", weight: 40, blurb: "Full vac-metallised mirror. Fingerprints are the enemy." },
  { name: "Chrome Gold", hue: 44, pattern: "chrome", weight: 36, blurb: "Warm mirror gold over a polished base coat." },
  { name: "Studio Overspray", hue: 320, pattern: "gradient", weight: 34, blurb: "Artist edition. Every body sprayed individually." },
  { name: "Ink Wash", hue: 214, pattern: "gradient", weight: 32, blurb: "Sumi-style wash that pools darker in the joints." },
  { name: "Colour Field", hue: 160, pattern: "split", weight: 30, blurb: "Hard-edge colour blocking across four panels." },
  { name: "Constellation", hue: 244, pattern: "stars", weight: 20, blurb: "Foil star map applied over deep navy." },
  { name: "Prism Cut", hue: 300, pattern: "gradient", weight: 18, blurb: "Refractive coat that shifts hue with viewing angle." },
  { name: "Molten Core", hue: 14, pattern: "gradient", weight: 16, blurb: "Internal LED-orange glow bleeding through a dark shell." },
  { name: "Blueprint Edition", hue: 218, pattern: "stripes", weight: 15, blurb: "Technical drawing of itself, printed on itself." },
  { name: "Porcelain Crackle", hue: 190, pattern: "checker", weight: 14, blurb: "Kiln-crackle glaze, individually fired and numbered." },
  { name: "Solar Flare", hue: 40, pattern: "chrome", weight: 8, blurb: "Chase. Heat-shift metallic that never photographs right." },
  { name: "Deep Field", hue: 262, pattern: "stars", weight: 7, blurb: "Chase. Star field under six coats of clear." },
  { name: "Anatomy Cut", hue: 350, pattern: "split", weight: 6, blurb: "Chase. Sectioned body showing the internals." },
  { name: "First Sample", hue: 30, pattern: "solid", weight: 3, blurb: "Chase. Factory test shot, unpainted, stamped and dated." },
  { name: "Gold Standard", hue: 46, pattern: "chrome", weight: 2, blurb: "Chase. Solid-look gold, fewer than fifty in circulation." },
  { name: "Artist Proof 1/1", hue: 0, pattern: "gradient", weight: 1, blurb: "Chase. A single piece exists. It is signed on the foot." },
];

/**
 * The 400%s are the chase now — every one of them, in every box.
 *
 * That is the whole point of the tier ladder: what you are hoping for is not a
 * better paint job at the same size, it is the big one. So the large format
 * stops being a shelf you can buy directly and becomes the thing hiding at the
 * bottom of a box, and `rarity` says so for all of them.
 *
 * Which box each hides in follows scarcity. BIG_SPECS is ordered by weight,
 * commonest first, so cutting it into four gives bronze the approachable
 * colourways and leaves diamond the grails — the test shot, the solid gold,
 * the one-of-one. A dearer box is dearer because of what is at the bottom of
 * it, and this is where that promise is actually kept.
 */
const BIG_TIERS: readonly Tier[] = ["bronze", "silver", "gold", "diamond"];

export const BIG_PIECES: readonly Piece[] = BIG_SPECS.map((spec, i) => ({
  id: `big-${i}-${spec.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
  coinValue: null,
  name: spec.name,
  setName: "400% Collection",
  series: null,
  type: "Secret",
  category: "secret" as const,
  scale: "400%",
  tier: BIG_TIERS[Math.floor((i * BIG_TIERS.length) / BIG_SPECS.length)],
  rarity: "chase",
  pattern: spec.pattern,
  palette: paletteFor(spec.hue, { pattern: spec.pattern, hueShift: 0 }, `big-${spec.name}`),
  weight: spec.weight,
  blurb: spec.blurb,
  imageUrl: null,
  archived: false,
}));

/* ------------------------------------------------------------------ *
 * Products and their pools
 * ------------------------------------------------------------------ */

/**
 * The ladder.
 *
 * The shop used to sell two boxes divided by size, which made the choice a
 * question about shelf space rather than about the pull. Tiers ask the
 * question people actually turn up with — how much do I want to spend on a
 * chance — and every rung answers it the same way: a pool of 100%s to collect,
 * and one 400% at the bottom that gets better the higher you climb.
 *
 * Prices are four numbers in one place on purpose. They are the thing most
 * likely to move once the shop has sold anything, and nothing else reads them.
 */
export const PRODUCTS: readonly Product[] = [
  {
    id: "bronze",
    name: "Bronze Box",
    tagline: "The everyday box. One 100% figure, with a 400% hiding in the run.",
    description:
      "Where the collecting happens. A single 100% figure drawn from the bronze shelf as it stands today — mostly the standard colourways, with a rare in the mix and a 400% chase at the bottom of the run. What is listed below is what is in the warehouse right now, and every rate is that piece's share of it.",
    priceCents: 2500,
    highlights: [
      "One guaranteed 100% figure",
      "A rare in every series lineup",
      "400% chase in the pool while stock lasts",
    ],
    accent: "#c2795a",
    tier: "bronze",
  },
  {
    id: "silver",
    name: "Silver Box",
    tagline: "A better shelf. Rares and an ultra join the pool.",
    description:
      "The step up. The same live-stock draw, over a shelf that trades the plainest colourways for an ultra rare and a scarcer 400% chase. Fewer pieces in the pool than bronze, and better ones.",
    priceCents: 5000,
    highlights: [
      "One guaranteed 100% figure",
      "Ultra rares in the pool",
      "A scarcer 400% chase than bronze",
    ],
    accent: "#b6bcc8",
    tier: "silver",
  },
  {
    id: "gold",
    name: "Gold Box",
    tagline: "No commons. Artist rares and ultras only.",
    description:
      "The artist shelf. Every piece in this pool is a rare or an ultra — the hand-sprayed editions and the hero pieces — and the 400% chases behind them are the short-run ones. A small pool by design: there is nothing in it you would be disappointed to draw.",
    priceCents: 10000,
    highlights: [
      "No common pieces in the pool at all",
      "Artist editions and hero ultras",
      "Short-run 400% chases",
    ],
    accent: "#e0b64e",
    tier: "gold",
  },
  {
    id: "diamond",
    name: "Diamond Box",
    tagline: "The secrets, and the grails behind them.",
    description:
      "The hidden pieces, sold on purpose. Every 100% in this pool is a series secret, and the 400% chases are the ones that barely exist — the factory test shot, the solid gold, the signed one-of-one. The smallest pool in the shop.",
    priceCents: 25000,
    highlights: [
      "Series secret pieces only",
      "The scarcest 400% chases in the shop",
      "The smallest pool we sell",
    ],
    accent: "#7fd7e8",
    tier: "diamond",
    // Listed and stockable, not yet buyable — the large format behind this
    // tier goes out through the drop-shipper, and that is not wired up.
    comingSoon: true,
  },
];

export function getProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

/**
 * Every piece that exists, in stock or not. This is a reference catalogue:
 * what a box can actually contain is decided by inventory, not by this list.
 */
export const ALL_PIECES: readonly Piece[] = [...ALL_100, ...BIG_PIECES];

export function getPiece(id: string): Piece | undefined {
  return ALL_PIECES.find((p) => p.id === id);
}

/* ------------------------------------------------------------------ *
 * Series
 * ------------------------------------------------------------------ */

/**
 * The collection for releases that are not part of a numbered series —
 * collaborations, one-offs, anything that stands on its own.
 *
 * It is a set name rather than a series number because that is what it is: a
 * named collection with no number, which the schema already has a column for.
 * Nothing special-cases it, so it sorts, searches and displays like any other
 * set, and a spreadsheet can put a piece in it by writing the same words.
 */
export const NON_SERIES = "Non-Series";

/**
 * What to show as a piece's collection.
 *
 * A piece carries both a free-text set name and a series number, and most
 * pieces have only one of them: anything added through the console now picks a
 * series and leaves the name empty, while imported spreadsheets and the demo
 * catalogue often carry a name. Every place that displays "which set is this"
 * needs the same fallback, so it lives here rather than being written out at
 * each call site and drifting.
 */
export function seriesLabel(
  piece: { setName?: string | null; series?: number | null },
  fallback = "",
): string {
  const named = piece.setName?.trim();
  if (named) return named;
  if (piece.series !== null && piece.series !== undefined) return `Series ${piece.series}`;
  return fallback;
}

/* ------------------------------------------------------------------ *
 * Categories
 * ------------------------------------------------------------------ */

/** The picker's order, which is the shop's own, not alphabetical. */
export const CATEGORY_ORDER: readonly Category[] = [
  "flag",
  "cute",
  "jellybean",
  "horror",
  "animal",
  "pattern",
  "scifi",
  "hero",
  "artist",
  "game",
  "secret",
];

export const CATEGORY_LABEL: Record<Category, string> = {
  flag: "Flag",
  cute: "Cute",
  jellybean: "Jellybean",
  horror: "Horror",
  animal: "Animal",
  pattern: "Pattern",
  scifi: "Sci-Fi",
  hero: "Hero",
  artist: "Artist",
  game: "Game",
  secret: "Secret",
};

/** Reads a stored or imported value, so an unknown string never renders. */
export function toCategory(value: unknown): Category | null {
  if (typeof value !== "string") return null;
  const key = value.trim().toLowerCase().replace(/[\s_-]+/g, "");
  const match = CATEGORY_ORDER.find((c) => c === key);
  return match ?? null;
}

/**
 * The line under a piece's name: which collection, then what kind of figure.
 *
 * "Series 3 · Cute". The category half is simply absent when there is none,
 * rather than leaving a dangling separator, so a one-off with no category
 * reads as "Non-Series" and not "Non-Series · ".
 */
export function pieceSubtitle(
  piece: { setName?: string | null; series?: number | null; category?: Category | null },
  fallback = "",
): string {
  const collection = seriesLabel(piece, fallback);
  const kind = piece.category ? CATEGORY_LABEL[piece.category] : "";
  if (!kind) return collection;
  return collection ? `${collection} · ${kind}` : kind;
}

/** Rarest first, which is the order a filter row should read in. */
/* ------------------------------------------------------------------ *
 * Tiers
 * ------------------------------------------------------------------ */

/** Cheapest first — the order every picker, filter and shelf tab shows. */
export const TIER_ORDER: readonly Tier[] = ["bronze", "silver", "gold", "diamond"];

export const TIER_LABEL: Record<Tier, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  diamond: "Diamond",
};

/**
 * One colour per tier, and it is the product's own accent rather than a second
 * palette kept alongside it: a bronze chip in the console and a bronze box in
 * the shop going out of step would be a bug nobody would think to look for.
 */
export const TIER_ACCENT: Record<Tier, string> = Object.fromEntries(
  TIER_ORDER.map((tier) => [
    tier,
    PRODUCTS.find((p) => p.tier === tier)?.accent ?? "#8a8a95",
  ]),
) as Record<Tier, string>;

/** The box that sells a tier, for naming a shelf after what it actually is. */
export function productForTier(tier: Tier): Product | undefined {
  return PRODUCTS.find((p) => p.tier === tier);
}

export const RARITY_ORDER: readonly Rarity[] = ["chase", "ultra", "rare", "common"];

export const RARITY_LABEL: Record<Rarity, string> = {
  common: "Common",
  rare: "Rare",
  ultra: "Ultra Rare",
  chase: "Chase",
};

export const RARITY_COLOR: Record<Rarity, string> = {
  common: "#94a3b8",
  rare: "#60a5fa",
  // Violet: a step up from rare's blue and clearly not chase's gold, so the
  // three top tiers stay apart at badge size and in a reveal glow.
  ultra: "#c084fc",
  chase: "#fbbf24",
};

/**
 * What older tier names become.
 *
 * Kept because catalogues outlive schemas: a spreadsheet exported last month,
 * or a row written before this change, still says "uncommon". Both the CSV
 * importer and the database migration read from here, so there is one mapping
 * rather than two that can disagree.
 *
 * "ultra" and "ultrarare" used to fold into rare, back when there were three
 * tiers. Now that Ultra Rare is a tier of its own they mean it again, so a
 * spreadsheet written for the six-tier catalogue imports as it reads.
 */
export const LEGACY_RARITY: Readonly<Record<string, Rarity>> = {
  common: "common",
  uncommon: "common",
  rare: "rare",
  ultra: "ultra",
  ultrarare: "ultra",
  secret: "chase",
  grail: "chase",
  chase: "chase",
};

export function formatOdds(odds: number): string {
  const pct = odds * 100;
  if (pct >= 10) return `${pct.toFixed(1)}%`;
  if (pct >= 1) return `${pct.toFixed(2)}%`;
  if (pct >= 0.01) return `${pct.toFixed(3)}%`;
  return `${pct.toFixed(4)}%`;
}

/** "1 in 208" style phrasing, which reads better for the long tail. */
export function oddsAsOneIn(odds: number): string {
  if (odds <= 0) return "—";
  return `1 in ${Math.round(1 / odds).toLocaleString()}`;
}
