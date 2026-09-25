import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { currentAccountId } from "@/lib/auth";
import { sellableCoins, topUpCost } from "@/lib/coins";
import { backend } from "@/lib/db";
import { payments } from "@/lib/payments";

/** The balance and what it has done lately. */
export async function GET() {
  const collectorId = await currentAccountId();
  if (!collectorId) return NextResponse.json({ coins: 0, history: [] });

  const account = await backend().upsertCollector(collectorId, {});
  const history = await backend().coinHistory(collectorId, 40);
  return NextResponse.json({ coins: account.coins ?? 0, history });
}

/**
 * Buys coins.
 *
 * The quantity is checked here against the same rule the page offers by, and
 * the price is worked out here too. Neither is read from the request: a
 * client that can name its own amount can name its own price, and the two
 * arriving together from the same place is how a shop sells a thousand coins
 * for a dollar.
 */
export async function POST(request: Request) {
  const collectorId = await currentAccountId();
  if (!collectorId) {
    return NextResponse.json({ error: "Sign in to buy coins" }, { status: 401 });
  }

  let body: { coins?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request body" }, { status: 400 });
  }

  const coins = sellableCoins(body.coins);
  if (coins === null) {
    return NextResponse.json(
      { error: "That is not an amount of coins we sell" },
      { status: 400 },
    );
  }

  const amountCents = topUpCost(coins);
  const payment = await payments.charge({
    amountCents,
    description: `${coins} coins`,
  });
  if (!payment.ok) {
    return NextResponse.json(
      { error: payment.error ?? "Payment declined" },
      { status: 402 },
    );
  }

  // Keyed on the payment's own reference, so a retry that reuses a charge
  // credits once. A provider that hands back the same reference for the same
  // intent — which is what Stripe does — makes this idempotent across the
  // whole round trip rather than only inside this request.
  const credit = await backend().moveCoins({
    collectorId,
    delta: coins,
    reason: "purchase",
    ref: payment.reference || `pay_${randomBytes(9).toString("hex")}`,
    note: `Bought ${coins} coins`,
  });

  if (!credit.ok) {
    // The charge went through and the credit did not. Say so plainly and
    // loudly: this is the one failure here that costs somebody money, and it
    // needs a human, not a retry button.
    console.error(
      `[coins] charged ${amountCents}c to ${collectorId} (${payment.reference}) ` +
        `but could not credit ${coins} coins`,
    );
    return NextResponse.json(
      {
        error:
          "Your payment went through but the coins did not arrive. " +
          "Nothing further will be charged — contact us and we will sort it out.",
        reference: payment.reference,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    coins: credit.balance,
    bought: credit.applied ? coins : 0,
    paidCents: amountCents,
  });
}
