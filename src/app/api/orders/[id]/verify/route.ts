import { NextResponse } from "next/server";
import { getProduct, oddsFor } from "@/lib/catalog";
import { verifyDraw } from "@/lib/draw";
import { readCollectorId } from "@/lib/session";
import { getOrder } from "@/lib/store";

/**
 * Replays a revealed order's stored seed against the published odds and reports
 * whether it reproduces the piece that was delivered. This is what makes the
 * published rates checkable rather than just stated.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const collectorId = await readCollectorId();
  const order = await getOrder(id);

  if (!order || !collectorId || order.collectorId !== collectorId) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.status === "paid") {
    return NextResponse.json(
      { error: "Open the box before verifying the draw" },
      { status: 409 },
    );
  }

  const product = getProduct(order.productId);
  const entry = oddsFor(order.productId).find((e) => e.piece.id === order.pieceId);

  return NextResponse.json({
    orderId: order.id,
    product: product?.name ?? order.productId,
    pieceId: order.pieceId,
    seed: order.rollSeed,
    rollValue: order.rollValue,
    publishedOdds: entry?.odds ?? null,
    poolSize: oddsFor(order.productId).length,
    reproduces: verifyDraw(order.productId, order.rollSeed, order.pieceId),
  });
}
