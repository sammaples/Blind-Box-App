import { NextResponse } from "next/server";
import { getProduct } from "@/lib/catalog";
import { boxReward, earnsCoins } from "@/lib/coins";
import { backend } from "@/lib/db";
import { findPiece } from "@/lib/pieces";
import { publicOrder } from "@/lib/serialize";
import { currentCollectorId } from "@/lib/auth";
import { getOrder, updateOrder } from "@/lib/store";

/**
 * Opens a sealed order. The piece was decided at purchase, so this only flips
 * the status and hands back what was already stored — calling it twice is safe
 * and always yields the same piece.
 *
 * Opening is also what earns coins. Only on the call that actually opens the
 * box, so a revisit of an old reveal never pays out, and keyed on the order in
 * the ledger, so even two racing opens of the same box credit it once.
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

  const opening = order.status === "paid";
  const revealed = opening
    ? ((await updateOrder(order.id, {
        status: "revealed",
        revealedAt: new Date().toISOString(),
      })) ?? order)
    : order;

  let earned = 0;
  let coins: number | null = null;
  const product = getProduct(order.productId);
  if (opening && product && earnsCoins(order)) {
    const reward = boxReward(product.tier);
    const credit = await backend().moveCoins({
      collectorId,
      delta: reward,
      reason: "earn",
      ref: order.id,
      note: product.name,
    });
    if (credit.ok) {
      earned = credit.applied ? reward : 0;
      coins = credit.balance;
    } else {
      // The box is open and the piece is theirs either way; a missed credit is
      // logged for a human rather than failing the reveal over it.
      console.error(`[coins] could not credit ${reward} for opening ${order.id}`);
    }
  }

  // The piece travels with the response: the catalogue lives in the database
  // now, so the browser has no way to look one up for itself.
  const piece = await findPiece(revealed.pieceId);
  return NextResponse.json({ order: publicOrder(revealed), piece, earned, coins });
}
