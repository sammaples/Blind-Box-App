import { NextResponse } from "next/server";
import { publicOrder } from "@/lib/serialize";
import { readCollectorId } from "@/lib/session";
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
  const collectorId = await readCollectorId();
  const order = await getOrder(id);

  if (!order || !collectorId || order.collectorId !== collectorId) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.status === "paid") {
    const revealed = await updateOrder(order.id, {
      status: "revealed",
      revealedAt: new Date().toISOString(),
    });
    if (revealed) return NextResponse.json({ order: publicOrder(revealed) });
  }

  return NextResponse.json({ order: publicOrder(order) });
}
