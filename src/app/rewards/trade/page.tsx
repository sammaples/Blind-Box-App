import type { Metadata } from "next";
import { TradeIn, type TradeablePull } from "@/components/TradeIn";
import { currentAccountId } from "@/lib/auth";
import { pieceMap } from "@/lib/pieces";
import { listOrders } from "@/lib/store";

export const metadata: Metadata = {
  title: "Trade-in — Blind Box",
  description: "Trade three pieces of one collection for a Bronze box.",
};

/* The pieces on offer are this collector's, as they stand right now. */
export const dynamic = "force-dynamic";

export default async function TradeInPage() {
  const accountId = await currentAccountId();
  const [orders, pieces] = await Promise.all([
    accountId ? listOrders(accountId) : Promise.resolve([]),
    pieceMap(),
  ]);

  // Opened and still in the vault: not sealed, not in a parcel, not traded.
  const pulls: TradeablePull[] = orders.flatMap((order) => {
    if (order.status !== "revealed" || order.shipmentId !== null) return [];
    const piece = pieces.get(order.pieceId);
    return piece ? [{ orderId: order.id, piece }] : [];
  });

  return <TradeIn pulls={pulls} signedIn={accountId !== null} />;
}
