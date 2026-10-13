import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { currentAccountId } from "@/lib/auth";
import { backend } from "@/lib/db";
import { drawFrom } from "@/lib/draw";
import { toLine } from "@/lib/lines";
import { publicOrder } from "@/lib/serialize";
import { TRADE_IN_COUNT, tradeInBox } from "@/lib/tradeIn";
import type { Order } from "@/lib/types";

/**
 * Trades three pieces in for a Bronze box of their collection.
 *
 * The pieces leaving the vault and the new box coming off the shelf are one
 * transaction, so a failed draw leaves the pieces where they were and a
 * double tap finds them already gone. The box is drawn here, sealed, the
 * same way a bought one is; it is opened on the usual reveal page.
 */
export async function POST(request: Request) {
  const collectorId = await currentAccountId();
  if (!collectorId) {
    return NextResponse.json({ error: "Sign in to trade in" }, { status: 401 });
  }

  let body: { orderIds?: unknown; line?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request body" }, { status: 400 });
  }

  const orderIds = Array.isArray(body.orderIds)
    ? body.orderIds.filter((id): id is string => typeof id === "string")
    : [];
  if (orderIds.length !== TRADE_IN_COUNT || new Set(orderIds).size !== TRADE_IN_COUNT) {
    return NextResponse.json({ error: `Pick ${TRADE_IN_COUNT} pieces` }, { status: 400 });
  }

  const line = typeof body.line === "string" ? toLine(body.line) : null;
  const product = line ? tradeInBox(line) : undefined;
  if (!line || !product) {
    return NextResponse.json({ error: "Unknown collection" }, { status: 400 });
  }

  const result = await backend().tradeIn(
    { collectorId, orderIds, shelf: { line, tier: product.tier } },
    (snapshot) => drawFrom(snapshot),
    ({ pieceId, seed, rollValue, poolSnapshot }): Order => ({
      id: `ord_${randomBytes(9).toString("hex")}`,
      collectorId,
      paidCoins: null,
      madeFrom: [...orderIds],
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

  if (!result.ok) {
    const error =
      result.reason === "soldout"
        ? `${product.name}es are sold out right now.`
        : result.reason === "mixed"
          ? "All three have to be from one collection."
          : "One of those pieces can't be traded any more.";
    return NextResponse.json({ error }, { status: 409 });
  }

  return NextResponse.json({ order: publicOrder(result.reservation.order) }, { status: 201 });
}
