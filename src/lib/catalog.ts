import type { Palette, PatternKind, Piece, Product, Rarity } from "./types";

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

interface TypeSpec {
  type: string;
  /** One entry per piece of this type in the series. */
  weights: readonly number[];
  pattern: PatternKind;
  rarity: Rarity;
  /** Hue offset from the series hue, applied per piece. */
  hueShift: number;
  colorways: readonly string[];
}

const TYPE_SPECS: readonly TypeSpec[] = [
  {
    type: "Basic",
    weights: [90, 90],
    pattern: "solid",
    rarity: "common",
    hueShift: 0,
    colorways: ["B", "E", "@", "R", "!"],
  },
  {
    type: "Jellybean",
    weights: [100],
    pattern: "jelly",
    rarity: "common",
    hueShift: 26,
    colorways: ["Lime", "Grape", "Soda", "Peach", "Mint", "Cherry", "Melon"],
  },
  {
    type: "Cute",
    weights: [90],
    pattern: "split",
    rarity: "common",
    hueShift: -34,
    colorways: ["Marshmallow", "Cloudy", "Sprinkle", "Milk Tea", "Pudding"],
  },
  {
    type: "Pattern",
    weights: [80, 80],
    pattern: "checker",
    rarity: "uncommon",
    hueShift: 48,
    colorways: ["Checker", "Argyle", "Houndstooth", "Tartan", "Halftone"],
  },
  {
    type: "Flag",
    weights: [90],
    pattern: "stripes",
    rarity: "uncommon",
    hueShift: 120,
    colorways: ["Tricolour", "Ensign", "Pennant", "Standard", "Banner"],
  },
  {
    type: "Animal",
    weights: [80],
    pattern: "camo",
    rarity: "uncommon",
    hueShift: 74,
    colorways: ["Leopard", "Tiger", "Koi", "Tortoise", "Snow Hare"],
  },
  {
    type: "Horror",
    weights: [70],
    pattern: "drip",
    rarity: "rare",
    hueShift: 172,
    colorways: ["Nightcrawler", "Wax Museum", "Bad Signal", "Grave Shift"],
  },
  {
    type: "SF",
    weights: [70],
    pattern: "chrome",
    rarity: "rare",
    hueShift: 198,
    colorways: ["Exosuit", "Ion Drive", "Rover", "Satellite", "Cold Fusion"],
  },
  {
    type: "Artist",
    weights: [50, 45, 40],
    pattern: "gradient",
    rarity: "rare",
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
    weights: [20],
    pattern: "stars",
    rarity: "ultra",
    hueShift: 210,
    colorways: ["Cape", "Insignia", "Sidekick", "Vigilante"],
  },
  {
    type: "Secret",
    weights: [5],
    pattern: "chrome",
    rarity: "secret",
    hueShift: 180,
    colorways: ["Secret"],
  },
];

/** Series whose secret is a certified chase piece rather than a normal secret. */
const GRAIL_SERIES = new Set([1, 13, 21, 27, 34, 42, 50]);

/* ------------------------------------------------------------------ *
 * Piece construction
 * ------------------------------------------------------------------ */

function paletteFor(hue: number, spec: TypeSpec, key: string): Palette {
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
  const isGrail = spec.type === "Secret" && GRAIL_SERIES.has(seriesNo);
  // Offset by index off a series-level hash, so two pieces of the same type in
  // one series can never land on the same colourway name.
  const colorway =
    spec.type === "Secret"
      ? isGrail
        ? "Grail Secret"
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
    name,
    setName: `Series ${seriesNo} · ${theme.name}`,
    series: seriesNo,
    type: spec.type,
    scale: "100%",
    rarity: isGrail ? "grail" : spec.rarity,
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
  rarity: Rarity;
  weight: number;
  blurb: string;
}

const BIG_SPECS: readonly BigSpec[] = [
  { name: "Bone White", hue: 210, pattern: "solid", rarity: "common", weight: 110, blurb: "Unpainted resin white. The shape, and nothing else." },
  { name: "Carbon", hue: 220, pattern: "solid", rarity: "common", weight: 105, blurb: "Deep matte black with a faint pearl in the flake." },
  { name: "Signal Orange", hue: 26, pattern: "solid", rarity: "common", weight: 100, blurb: "Safety-cone orange, gloss finish, impossible to ignore." },
  { name: "Jelly Grape", hue: 288, pattern: "jelly", rarity: "common", weight: 95, blurb: "Clear violet cast with a frosted interior." },
  { name: "Jelly Soda", hue: 196, pattern: "jelly", rarity: "common", weight: 92, blurb: "Bottle-glass blue. Reads almost liquid under a spotlight." },
  { name: "Sakura Fade", hue: 340, pattern: "gradient", rarity: "uncommon", weight: 70, blurb: "Airbrushed pink-to-white fade over the shoulders." },
  { name: "Court Checker", hue: 12, pattern: "checker", rarity: "uncommon", weight: 66, blurb: "Two-inch check wrapped clean across the body seam." },
  { name: "Ranger Camo", hue: 96, pattern: "camo", rarity: "uncommon", weight: 64, blurb: "Four-colour woodland pattern, hand-masked in layers." },
  { name: "Track Stripe", hue: 232, pattern: "stripes", rarity: "uncommon", weight: 62, blurb: "Racing stripes down the centreline, tape-edge crisp." },
  { name: "Tiger Coat", hue: 34, pattern: "camo", rarity: "uncommon", weight: 58, blurb: "Brushstroke markings laid over a warm amber base." },
  { name: "Midnight Drip", hue: 268, pattern: "drip", rarity: "rare", weight: 44, blurb: "Gloss drip pulled down a matte body. Wet forever." },
  { name: "Static Ghost", hue: 250, pattern: "drip", rarity: "rare", weight: 42, blurb: "Glow-in-the-dark shell with a broadcast-static overlay." },
  { name: "Chrome Silver", hue: 205, pattern: "chrome", rarity: "rare", weight: 40, blurb: "Full vac-metallised mirror. Fingerprints are the enemy." },
  { name: "Chrome Gold", hue: 44, pattern: "chrome", rarity: "rare", weight: 36, blurb: "Warm mirror gold over a polished base coat." },
  { name: "Studio Overspray", hue: 320, pattern: "gradient", rarity: "rare", weight: 34, blurb: "Artist edition. Every body sprayed individually." },
  { name: "Ink Wash", hue: 214, pattern: "gradient", rarity: "rare", weight: 32, blurb: "Sumi-style wash that pools darker in the joints." },
  { name: "Colour Field", hue: 160, pattern: "split", rarity: "rare", weight: 30, blurb: "Hard-edge colour blocking across four panels." },
  { name: "Constellation", hue: 244, pattern: "stars", rarity: "ultra", weight: 20, blurb: "Foil star map applied over deep navy." },
  { name: "Prism Cut", hue: 300, pattern: "gradient", rarity: "ultra", weight: 18, blurb: "Refractive coat that shifts hue with viewing angle." },
  { name: "Molten Core", hue: 14, pattern: "gradient", rarity: "ultra", weight: 16, blurb: "Internal LED-orange glow bleeding through a dark shell." },
  { name: "Blueprint Edition", hue: 218, pattern: "stripes", rarity: "ultra", weight: 15, blurb: "Technical drawing of itself, printed on itself." },
  { name: "Porcelain Crackle", hue: 190, pattern: "checker", rarity: "ultra", weight: 14, blurb: "Kiln-crackle glaze, individually fired and numbered." },
  { name: "Solar Flare", hue: 40, pattern: "chrome", rarity: "secret", weight: 8, blurb: "Secret. Heat-shift metallic that never photographs right." },
  { name: "Deep Field", hue: 262, pattern: "stars", rarity: "secret", weight: 7, blurb: "Secret. Star field under six coats of clear." },
  { name: "Anatomy Cut", hue: 350, pattern: "split", rarity: "secret", weight: 6, blurb: "Secret. Sectioned body showing the internals." },
  { name: "First Sample", hue: 30, pattern: "solid", rarity: "grail", weight: 3, blurb: "Grail. Factory test shot, unpainted, stamped and dated." },
  { name: "Gold Standard", hue: 46, pattern: "chrome", rarity: "grail", weight: 2, blurb: "Grail. Solid-look gold, fewer than fifty in circulation." },
  { name: "Artist Proof 1/1", hue: 0, pattern: "gradient", rarity: "grail", weight: 1, blurb: "Grail. A single piece exists. It is signed on the foot." },
];

export const BIG_PIECES: readonly Piece[] = BIG_SPECS.map((spec, i) => ({
  id: `big-${i}-${spec.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
  name: spec.name,
  setName: "400% Collection",
  series: null,
  type: spec.rarity === "grail" || spec.rarity === "secret" ? "Secret" : "Standard",
  scale: "400%",
  rarity: spec.rarity,
  pattern: spec.pattern,
  palette: paletteFor(spec.hue, {
    type: spec.name,
    weights: [spec.weight],
    pattern: spec.pattern,
    rarity: spec.rarity,
    hueShift: 0,
    colorways: [spec.name],
  }, `big-${spec.name}`),
  weight: spec.weight,
  blurb: spec.blurb,
  imageUrl: null,
  archived: false,
}));

/* ------------------------------------------------------------------ *
 * Products and their pools
 * ------------------------------------------------------------------ */

export const PRODUCTS: readonly Product[] = [
  {
    id: "hundred",
    name: "100% Blind Box",
    tagline: "One sealed 100% figure from whatever is on the shelf.",
    description:
      "A single 100% figure, drawn from everything currently in stock. The line-up changes as inventory moves — what is listed below is what is in the warehouse right now, and every rate is that piece's share of it.",
    priceCents: 2400,
    highlights: [
      "One guaranteed 100% figure",
      "Drawn from live stock, never a fixed list",
      "Chase pieces sit in the same pool",
    ],
    accent: "#f97316",
    scale: "100%",
  },
  {
    id: "four-hundred",
    name: "400% Blind Box",
    tagline: "One sealed 400% figure. Eleven inches of it.",
    description:
      "The large format, guaranteed. One 400% figure drawn from the 400% shelf as it stands today — including the grails, while they last.",
    priceCents: 18500,
    highlights: [
      "One guaranteed 400% figure",
      "Drawn from live stock, never a fixed list",
      "Grails stay in until the last one sells",
    ],
    accent: "#22d3ee",
    scale: "400%",
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

export const RARITY_ORDER: readonly Rarity[] = [
  "grail",
  "secret",
  "ultra",
  "rare",
  "uncommon",
  "common",
];

export const RARITY_LABEL: Record<Rarity, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  ultra: "Ultra Rare",
  secret: "Secret",
  grail: "Grail",
};

export const RARITY_COLOR: Record<Rarity, string> = {
  common: "#94a3b8",
  uncommon: "#34d399",
  rare: "#60a5fa",
  ultra: "#c084fc",
  secret: "#fbbf24",
  grail: "#fb7185",
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
