import type { Order, PoolSnapshot } from "./types";

export interface PublicOrder {
  id: string;
  productId: string;
  status: Order["status"];
  createdAt: string;
  revealedAt: string | null;
  shipping: Order["shipping"];
  trackingNumber: string | null;
  /** Null while the box is still sealed. */
  pieceId: string | null;
  /** The pull rate this piece had on the shelf it was drawn from. */
  pulledOdds: number | null;
}

/**
 * A piece's share of the shelf it was drawn from. Stock moves, so a pull's
 * rate is a fact about the moment of purchase, not about the shelf today.
 */
export function oddsFromSnapshot(
  snapshot: PoolSnapshot,
  pieceId: string,
): number {
  let total = 0;
  let units = 0;
  for (const [id, count] of snapshot) {
    total += count;
    if (id === pieceId) units = count;
  }
  return total > 0 ? units / total : 0;
}

/**
 * The only shape of an order that ever reaches the client. It drops the roll
 * seed and value, and withholds the piece until the order has been revealed.
 */
export function publicOrder(order: Order): PublicOrder {
  const revealed = order.status !== "paid";
  return {
    id: order.id,
    productId: order.productId,
    status: order.status,
    createdAt: order.createdAt,
    revealedAt: order.revealedAt,
    shipping: order.shipping,
    trackingNumber: order.trackingNumber,
    pieceId: revealed ? order.pieceId : null,
    pulledOdds: revealed
      ? oddsFromSnapshot(order.poolSnapshot ?? [], order.pieceId)
      : null,
  };
}
