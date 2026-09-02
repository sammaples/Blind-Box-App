import type {
  AuditBatch,
  Collector,
  Order,
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

  /* catalogue */
  /** Every piece the shop knows about, archived ones included. */
  listPieces(): Promise<Piece[]>;
  /** Creates or updates pieces by id, in one transaction. */
  savePieces(pieces: readonly Piece[]): Promise<void>;
  /** Archives or restores a piece without losing the orders that pulled it. */
  setPieceArchived(pieceId: string, archived: boolean): Promise<Piece | null>;

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
