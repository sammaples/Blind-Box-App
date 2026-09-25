import { NextResponse } from "next/server";
import { currentAccountId } from "@/lib/auth";
import { tradeValue } from "@/lib/coins";
import { backend } from "@/lib/db";
import { findPiece } from "@/lib/pieces";

/**
 * Hands a pull back for coins.
 *
 * Three things have to be true and each is checked here rather than trusted
 * from the page: the order is this collector's, it has actually been opened,
 * and it is not already committed to a parcel. A piece in a box being packed
 * cannot be sold back — the box is the thing that would arrive without it.
 *
 * The credit is keyed on the order id, so a double tap, a retried request or
 * a refresh at the wrong moment all land on the same ledger row and pay once.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const collectorId = await currentAccountId();
  if (!collectorId) {
    return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  }

  const { id } = await params;
  const order = await backend().getOrder(id);
  // The same answer for somebody else's order as for one that does not exist:
  // whether a given id is real is not information this endpoint should hand
  // out to anyone who can guess at one.
  if (!order || order.collectorId !== collectorId) {
    return NextResponse.json({ error: "No such order" }, { status: 404 });
  }

  if (order.status === "traded") {
    return NextResponse.json(
      { error: "That piece has already been traded in" },
      { status: 409 },
    );
  }
  if (order.status === "paid") {
    return NextResponse.json(
      { error: "Open the box before trading what is in it" },
      { status: 409 },
    );
  }
  if (order.status !== "revealed" || order.shipmentId !== null) {
    return NextResponse.json(
      { error: "That piece is already on its way to you" },
      { status: 409 },
    );
  }

  const piece = await findPiece(order.pieceId);
  if (!piece) {
    return NextResponse.json({ error: "That piece is no longer listed" }, { status: 409 });
  }

  const value = tradeValue(piece);

  // Status first, then the credit.
  //
  // The status check above is a courtesy, not the guard: `updateOrder` is an
  // unconditional patch, so two requests arriving together can both read
  // `revealed` and both write `traded`. What stops the second one paying is
  // the unique index on (reason, ref) in the ledger — it refuses a second
  // `trade_in` against the same order id, and `moveCoins` answers with the
  // balance as it already stands. The guard is in the database because that
  // is the only place a race cannot get past it.
  const updated = await backend().updateOrder(order.id, { status: "traded" });
  if (!updated || updated.status !== "traded") {
    return NextResponse.json({ error: "Could not trade that piece in" }, { status: 409 });
  }

  const result = await backend().moveCoins({
    collectorId,
    delta: value,
    reason: "trade_in",
    ref: order.id,
    note: piece.name,
  });
  if (!result.ok) {
    return NextResponse.json({ error: "Could not credit those coins" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    coins: result.balance,
    // Zero when this was the second request for the same order: the coins are
    // in the balance, they were just not added by this call.
    credited: result.applied ? value : 0,
    piece: { id: piece.id, name: piece.name, rarity: piece.rarity },
  });
}
