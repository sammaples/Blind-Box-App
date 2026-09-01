import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getProduct } from "@/lib/catalog";
import { draw } from "@/lib/draw";
import { payments } from "@/lib/payments";
import { publicOrder } from "@/lib/serialize";
import { requireCollectorId } from "@/lib/session";
import { createOrder, listOrders, upsertCollector } from "@/lib/store";
import type { Order } from "@/lib/types";

/** The collector's own orders. Pieces are omitted until each one is revealed. */
export async function GET() {
  const collectorId = await requireCollectorId();
  const orders = await listOrders(collectorId);
  return NextResponse.json({ orders: orders.map(publicOrder) });
}

/**
 * Buys one box. The piece is drawn here, at purchase time, and stored before
 * the client is told anything — so the outcome cannot be influenced by
 * refreshing, re-requesting the reveal, or anything else done client-side.
 */
export async function POST(request: Request) {
  const collectorId = await requireCollectorId();

  let body: { productId?: unknown; email?: unknown };
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

  const email =
    typeof body.email === "string" && body.email.includes("@")
      ? body.email.trim().slice(0, 200)
      : null;

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

  const { piece, seed, rollValue } = draw(product.id);

  const order: Order = {
    id: `ord_${randomBytes(9).toString("hex")}`,
    collectorId,
    productId: product.id,
    pieceId: piece.id,
    status: "paid",
    createdAt: new Date().toISOString(),
    revealedAt: null,
    rollSeed: seed,
    rollValue,
    email,
    shipping: null,
    trackingNumber: null,
  };
  await createOrder(order);
  if (email) await upsertCollector(collectorId, { email });

  // Deliberately returns no piece information.
  return NextResponse.json(
    { order: publicOrder(order), paymentReference: payment.reference },
    { status: 201 },
  );
}
