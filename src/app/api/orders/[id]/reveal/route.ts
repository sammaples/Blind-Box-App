import { NextResponse } from "next/server";
import { findPiece } from "@/lib/pieces";
import { publicOrder } from "@/lib/serialize";
import { currentCollectorId } from "@/lib/auth";
import { getOrder, updateOrder } from "@/lib/store";

/**
 * Opens a sealed order. The piece was decided at purchase, so this only flips
 * the status and hands back what was already stored — calling it twice is safe
 * and always yields the same piece.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const collectorId = await currentCollectorId();
  const order = await getOrder(id);

  if (!order || !collectorId || order.collectorId !== collectorId) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const revealed =
    order.status === "paid"
      ? ((await updateOrder(order.id, {
          status: "revealed",
          revealedAt: new Date().toISOString(),
        })) ?? order)
      : order;

  // The piece travels with the response: the catalogue lives in the database
  // now, so the browser has no way to look one up for itself.
  const piece = await findPiece(revealed.pieceId);
  return NextResponse.json({ order: publicOrder(revealed), piece });
}
