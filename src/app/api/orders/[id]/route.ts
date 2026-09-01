import { NextResponse } from "next/server";
import { publicOrder } from "@/lib/serialize";
import { readCollectorId } from "@/lib/session";
import { getOrder } from "@/lib/store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const collectorId = await readCollectorId();
  const order = await getOrder(id);

  // Same response for "missing" and "not yours", so order ids cannot be probed.
  if (!order || !collectorId || order.collectorId !== collectorId) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  return NextResponse.json({ order: publicOrder(order) });
}
