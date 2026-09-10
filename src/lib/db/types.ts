import type {
  AuditBatch,
  Collector,
  Order,
  Shipment,
  ShippingAddress,
  Piece,
  PoolSnapshot,
  Scale,
} from "../types";

/**
 * The storage seam.
 *
 * Everything the app persists goes through this interface, so swapping the
 * JSON file for a real database is one implementation rather than a rewrite.
 * The operations are deliberately coarse: each one that must be atomic is a
 * single call, not a read the caller is trusted to follow with a write.
 */

/** One piece's stock line. */
export interface StockRow {
  pieceId: string;
  scale: Scale;
  stocked: number;
  sold: number;
}

export type StockOp = "add" | "set" | "pull";

export interface StockChange {
  pieceId: string;
  /** Needed when the piece has no stock line yet. */
  scale: Scale;
  op: StockOp;
  units?: number;
}

export interface StockChangeResult {
  pieceId: string;
  stocked: number;
  sold: number;
  available: number;
}

/** An uploaded photo, held as bytes rather than a link to someone else's host. */
export interface StoredImage {
  id: string;
  contentType: string;
  bytes: Uint8Array;
}

/** What a shop-wide reset removed, so the console can say so rather than guess. */
export interface ResetSummary {
  pieces: number;
  stockRows: number;
  orders: number;
  auditEntries: number;
  images: number;
}

/** What a draw needs back from a reservation. */
export interface Reservation {
  pieceId: string;
  seed: string;
  rollValue: number;
  poolSnapshot: PoolSnapshot;
  order: Order;
}

/** Decides which piece comes off a shelf, given the shelf as it stands. */
export type Draw = (snapshot: PoolSnapshot) => {
  pieceId: string;
  seed: string;
  rollValue: number;
};

/** Builds the order record once the piece is known. */
export type BuildOrder = (draw: {
  pieceId: string;
  seed: string;
  rollValue: number;
  poolSnapshot: PoolSnapshot;
}) => Order;

export interface Backend {
  readonly name: string;

  /** Puts the opening shelf in place, but only if nothing has happened yet. */
  seed(units: ReadonlyMap<string, { scale: Scale; units: number }>): Promise<void>;

  /* collectors and accounts */
  upsertCollector(
    id: string,
    patch: Partial<Omit<Collector, "id" | "createdAt">>,
  ): Promise<Collector>;

  /** The account for an email, created on first sign-in. */
  accountForEmail(email: string): Promise<Collector>;

  /**
   * Issues a single-use sign-in token, replacing any the address already has
   * so an old link in an inbox stops working once a new one is requested.
   */
  createLoginToken(input: {
    tokenHash: string;
    email: string;
    expiresAt: string;
  }): Promise<void>;

  /**
   * Redeems a token, returning the email it was issued for. Consuming and
   * checking happen together, so the same link cannot be used twice even if
   * it is opened twice at once.
   */
  consumeLoginToken(tokenHash: string, now: string): Promise<string | null>;

  /** Moves a browser's pre-account orders onto the account it signed into. */
  claimOrders(fromCollectorId: string, toCollectorId: string): Promise<number>;

  /** Grants or revokes admin on an account. */
  setAdmin(accountId: string, isAdmin: boolean): Promise<void>;

  /* orders */
  getOrder(id: string): Promise<Order | null>;
  listOrders(collectorId: string): Promise<Order[]>;
  updateOrder(
    id: string,
    patch: Partial<Omit<Order, "id" | "collectorId" | "pieceId">>,
  ): Promise<Order | null>;

  /* shipments */
  /**
   * Bundles orders into one parcel.
   *
   * Eligibility is checked in the same transaction as the write, not before
   * it: two tabs submitting overlapping selections would otherwise both pass
   * their checks and the second would quietly move pieces out of the first
   * one's parcel. Returns null if any order is not the collector's, is still
   * sealed, or is already travelling — the whole bundle fails rather than
   * silently shipping a subset of what was picked.
   */
  createShipment(input: {
    id: string;
    collectorId: string;
    address: ShippingAddress;
    trackingNumber: string;
    createdAt: string;
    orderIds: readonly string[];
  }): Promise<Shipment | null>;

  /** A collector's bundles, newest first. */
  listShipments(collectorId: string): Promise<Shipment[]>;

  /* catalogue */
  /** Every piece the shop knows about, archived ones included. */
  listPieces(): Promise<Piece[]>;
  /** Creates or updates pieces by id, in one transaction. */
  savePieces(pieces: readonly Piece[]): Promise<void>;

  /**
   * Inserts a piece only if its id is free, reporting whether it went in.
   *
   * `savePieces` upserts, which is right for editing and wrong for listing:
   * two products with the same title derive the same id, and an upsert would
   * quietly replace the first with the second. The caller picks another id and
   * tries again — and because the database decides, two admins adding the same
   * title at the same moment get two listings rather than one survivor.
   */
  createPiece(piece: Piece): Promise<boolean>;
  /** Archives or restores a piece without losing the orders that pulled it. */
  setPieceArchived(pieceId: string, archived: boolean): Promise<Piece | null>;

  /**
   * Removes a piece and its stock line for good — but only if none of it has
   * ever sold. An order names the piece it pulled, so deleting one that has
   * shipped would leave a collector staring at a blank card.
   *
   * The check and the delete are one operation because they have to be: read
   * the sold count, then delete, and a purchase landing in between takes the
   * piece out from under an order that already exists.
   */
  deletePiece(pieceId: string): Promise<{ deleted: boolean; sold: number }>;

  /**
   * Empties the shop: every piece, every stock line, every order, the change
   * log, and the uploaded photos. Accounts survive, admin flags included —
   * a reset that signed you out of the console you triggered it from would be
   * a trap.
   *
   * This is the one operation that deliberately ignores the rule `deletePiece`
   * enforces. Deleting a sold piece normally orphans an order, so it is
   * refused; here the orders go too, which is the whole point. It exists for
   * exactly one moment — the end of testing, before real stock goes in — and
   * nothing it removes can be recovered.
   */
  resetShop(): Promise<ResetSummary>;

  /* product photos */
  /** Stores an uploaded photo under an id the app issued. */
  putImage(image: StoredImage): Promise<void>;
  /** Reads one back for serving. Null when there is no such image. */
  getImage(id: string): Promise<StoredImage | null>;

  /* stock */
  stockRows(): Promise<StockRow[]>;

  /**
   * Draws a piece from a shelf, takes its unit, and writes the order — all in
   * one transaction, so the last unit of a piece can never be sold twice.
   * Returns null when the shelf has nothing left.
   */
  reserve(scale: Scale, draw: Draw, build: BuildOrder): Promise<Reservation | null>;

  /** Applies stock edits and records them in the change log, atomically. */
  applyStockChanges(changes: readonly StockChange[]): Promise<StockChangeResult[]>;

  /** The change log as batch summaries, newest first. */
  recentAudit(limit: number): Promise<AuditBatch[]>;
}
