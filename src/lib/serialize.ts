import type { Order } from "./types";

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
  };
}
