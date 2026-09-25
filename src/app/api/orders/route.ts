import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getProduct } from "@/lib/catalog";
import { coinPrice } from "@/lib/coins";
import { backend } from "@/lib/db";
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

  let body: { productId?: unknown; pay?: unknown };
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

  // A box that is only announced is listed, not for sale. The card disables
  // its own button, but the check that matters is this one: nothing stops a
  // buyer posting the product id by hand, and a charge for a box that cannot
  // ship is worse than a refusal.
  if (product.comingSoon) {
    return NextResponse.json(
      { error: `${product.name} is not on sale yet.` },
      { status: 409 },
    );
  }

  const withCoins = body.pay === "coins";
  const price = coinPrice(product.priceCents);
  let reference = "";

  // Coins are taken before the draw, not after.
  //
  // The order of these two matters and it is not arbitrary. Draw first and a
  // failed debit means a unit has left the shelf for a box nobody paid for —
  // recoverable, but only by hand. Debit first and a failed draw means coins
  // taken for nothing, which is worse to be on the receiving end of but is
  // exactly what the refund below is for: it is one call, it is keyed on the
  // order attempt, and it cannot silently not happen.
  const spendRef = `buy_${randomBytes(9).toString("hex")}`;
  if (withCoins) {
    const spend = await backend().moveCoins({
      collectorId,
      delta: -price,
      reason: "spend",
      ref: spendRef,
      note: product.name,
    });
    if (!spend.ok) {
      return NextResponse.json(
        {
          error: `That box costs ${price} coins and you have ${spend.balance}.`,
          coins: spend.balance,
        },
        { status: 402 },
      );
    }
  } else {
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
    reference = payment.reference;
  }

  // The draw, the stock decrement and the order write all land in one
  // transaction, so the last unit of a piece can never be sold twice.
  const reservation = await reserve(
    product.id,
    (snapshot) => drawFrom(snapshot),
    ({ pieceId, seed, rollValue, poolSnapshot }): Order => ({
      id: `ord_${randomBytes(9).toString("hex")}`,
      collectorId,
      paidCoins: withCoins ? price : null,
      productId: product.id,
      pieceId,
      status: "paid",
      createdAt: new Date().toISOString(),
      revealedAt: null,
      rollSeed: seed,
      rollValue,
      poolSnapshot,
      email: null,
      shipmentId: null,
    }),
  );

  if (!reservation) {
    // Sold out between the debit and the draw. The coins go straight back,
    // keyed on the same attempt so it happens once however many times this
    // path is reached, and the ledger carries both halves rather than
    // quietly cancelling out — somebody looking at their history should see
    // that the shop took coins and gave them back, not a gap.
    if (withCoins) {
      await backend().moveCoins({
        collectorId,
        delta: price,
        reason: "refund",
        ref: spendRef,
        note: `${product.name} sold out`,
      });
    }
    return NextResponse.json(
      { error: "This box is sold out. New inventory is on the way." },
      { status: 409 },
    );
  }
  const order = reservation.order;

  // Deliberately returns no piece information.
  return NextResponse.json(
    { order: publicOrder(order), paymentReference: reference },
    { status: 201 },
  );
}
