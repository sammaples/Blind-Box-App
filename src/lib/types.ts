export type Rarity = "common" | "uncommon" | "rare" | "ultra" | "secret" | "grail";

export type PatternKind =
  | "solid"
  | "split"
  | "jelly"
  | "stripes"
  | "camo"
  | "stars"
  | "checker"
  | "chrome"
  | "drip"
  | "gradient";

export type Scale = "100%" | "400%";

export interface Palette {
  /** Main body colour. */
  base: string;
  /** Secondary colour used by multi-tone patterns. */
  accent: string;
  /** Face / detail colour. */
  detail: string;
  /** Background wash behind the figure on cards. */
  wash: string;
}

export interface Piece {
  id: string;
  name: string;
  /** e.g. "Series 12" or "400% Collection". */
  setName: string;
  /** Series number, when the piece belongs to a numbered series. */
  series: number | null;
  /** Type family: Basic, Jellybean, Artist, Secret, ... */
  type: string;
  scale: Scale;
  rarity: Rarity;
  pattern: PatternKind;
  palette: Palette;
  /** Relative draw weight inside its own pool. Never a probability by itself. */
  weight: number;
  blurb: string;
  /** A real photograph, when one has been uploaded. Falls back to vector art. */
  imageUrl: string | null;
  /** Set when the piece has been removed from the catalogue. */
  archived: boolean;
}

/** A piece on the shelf: how many were stocked, how many are left, and the
 *  pull rate that follows from what is left. */
export interface StockEntry {
  piece: Piece;
  /** Units ever put into circulation. */
  stocked: number;
  /** Units still unsold. Zero means the piece has left the pool. */
  available: number;
  /** Share of the product's remaining units, 0..1. Zero when sold out. */
  odds: number;
}

export interface Product {
  id: string;
  name: string;
  tagline: string;
  description: string;
  priceCents: number;
  /** Short bullets shown on the product card. */
  highlights: string[];
  /** Accent colour used for the product's UI treatment. */
  accent: string;
  scale: Scale;
}

export type OrderStatus =
  | "paid"
  | "revealed"
  | "packing"
  | "shipped"
  | "delivered";

export interface ShippingAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postal: string;
  country: string;
}

/** One piece's stock moving because someone changed it in the console.
 *  Sales are not recorded here — orders already are the record of those. */
export interface AuditEntry {
  id: string;
  /** Shared by every entry from a single click, so a series reads as one act. */
  batchId: string;
  at: string;
  pieceId: string;
  op: "add" | "set" | "pull";
  /** Units in circulation before and after, so an entry explains itself. */
  before: number;
  after: number;
  /** Units sold at the time, which is the floor the change was clamped to. */
  sold: number;
}

/**
 * One click in the console, summarised. Summarising server-side matters: a
 * client that only holds part of a batch would under-report its size, and an
 * inventory log that misstates what happened is worse than none.
 */
export interface AuditBatch {
  batchId: string;
  at: string;
  op: AuditEntry["op"];
  /** How many pieces the batch touched, however many entries were fetched. */
  pieceCount: number;
  /** Net units in or out across the whole batch. */
  delta: number;
  /** A few of the pieces, for naming the batch. Not the whole list. */
  pieceIds: string[];
  /** Present only for a single-piece batch, where it is meaningful. */
  single: { before: number; after: number; sold: number } | null;
}

/** The shelf as it stood at the moment an order was drawn, so the roll can be
 *  replayed later even after stock has moved on. */
export type PoolSnapshot = ReadonlyArray<readonly [pieceId: string, units: number]>;

export interface Order {
  id: string;
  collectorId: string;
  productId: string;
  /** Piece decided server-side at purchase time. Never sent before reveal. */
  pieceId: string;
  status: OrderStatus;
  createdAt: string;
  revealedAt: string | null;
  /** Server seed kept for audit / dispute resolution. */
  rollSeed: string;
  rollValue: number;
  poolSnapshot: PoolSnapshot;
  email: string | null;
  shipping: ShippingAddress | null;
  trackingNumber: string | null;
}

/**
 * A collector. One with a verified email is an account and can buy; one
 * without is a browser that has only ever looked around.
 */
export interface Collector {
  id: string;
  email: string | null;
  displayName: string | null;
  createdAt: string;
  onboardedAt: string | null;
  lastLoginAt: string | null;
  isAdmin: boolean;
}
