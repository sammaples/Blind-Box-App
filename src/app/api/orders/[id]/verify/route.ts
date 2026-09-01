import { NextResponse } from "next/server";
import { getProduct } from "@/lib/catalog";
import { verifyDraw } from "@/lib/draw";
import { oddsFromSnapshot } from "@/lib/serialize";
import { currentCollectorId } from "@/lib/auth";
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
  const collectorId = await currentCollectorId();
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
  const snapshot = order.poolSnapshot ?? [];
  const unitsOnShelf = snapshot.reduce((sum, [, units]) => sum + units, 0);

  return NextResponse.json({
    orderId: order.id,
    product: product?.name ?? order.productId,
    pieceId: order.pieceId,
    seed: order.rollSeed,
    rollValue: order.rollValue,
    // The shelf this order was drawn from, which is what the roll must replay
    // against — stock has almost certainly moved since.
    publishedOdds: oddsFromSnapshot(snapshot, order.pieceId),
    piecesOnShelf: snapshot.length,
    unitsOnShelf,
    reproduces: verifyDraw(snapshot, order.rollSeed, order.pieceId),
  });
}
