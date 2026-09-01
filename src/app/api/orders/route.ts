import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getProduct } from "@/lib/catalog";
import { drawFrom } from "@/lib/draw";
import { payments } from "@/lib/payments";
import { publicOrder } from "@/lib/serialize";
import { currentAccountId, currentCollectorId } from "@/lib/auth";
import { reserve } from "@/lib/stock";
import { listOrders } from "@/lib/store";
import type { Order } from "@/lib/types";

/** The collector's own orders. Pieces are omitted until each one is revealed. */
export async function GET() {
  const collectorId = await currentCollectorId();
  if (!collectorId) return NextResponse.json({ orders: [] });

  const orders = await listOrders(collectorId);
  return NextResponse.json({ orders: orders.map(publicOrder) });
}

/**
 * Buys one box. The piece is drawn here, at purchase time, and stored before
 * the client is told anything — so the outcome cannot be influenced by
 * refreshing, re-requesting the reveal, or anything else done client-side.
 */
export async function POST(request: Request) {
  // Buying requires an account. A box is a physical item that has to reach a
  // person, so an order can never be tied to nothing but a cookie that the
  // buyer might clear before it ships.
  const collectorId = await currentAccountId();
  if (!collectorId) {
    return NextResponse.json(
      { error: "Sign in before buying a box" },
      { status: 401 },
    );
  }

  let body: { productId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request body" }, { status: 400 });
  }

  const productId = typeof body.productId === "string" ? body.productId : "";
  const product = getProduct(productId);
  if (!product) {
    return NextResponse.json({ error: "Unknown product" }, { status: 400 });
  }

  const payment = await payments.charge({
    amountCents: product.priceCents,
    description: product.name,
  });
  if (!payment.ok) {
    return NextResponse.json(
      { error: payment.error ?? "Payment declined" },
      { status: 402 },
    );
  }

  // The draw, the stock decrement and the order write all land in one
  // transaction, so the last unit of a piece can never be sold twice.
  const reservation = await reserve(
    product.id,
    (snapshot) => drawFrom(snapshot),
    ({ pieceId, seed, rollValue, poolSnapshot }): Order => ({
      id: `ord_${randomBytes(9).toString("hex")}`,
      collectorId,
      productId: product.id,
      pieceId,
      status: "paid",
      createdAt: new Date().toISOString(),
      revealedAt: null,
      rollSeed: seed,
      rollValue,
      poolSnapshot,
      email: null,
      shipping: null,
      trackingNumber: null,
    }),
  );

  if (!reservation) {
    return NextResponse.json(
      { error: "This box is sold out. New inventory is on the way." },
      { status: 409 },
    );
  }
  const order = reservation.order;

  // Deliberately returns no piece information.
  return NextResponse.json(
    { order: publicOrder(order), paymentReference: payment.reference },
    { status: 201 },
  );
}
