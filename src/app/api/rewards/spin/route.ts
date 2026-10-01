import { randomInt } from "node:crypto";
import { NextResponse } from "next/server";
import { currentAccountId } from "@/lib/auth";
import { backend } from "@/lib/db";
import { nextSpinAt, prizeFor, SPIN_SLOTS, spinDay } from "@/lib/spin";

/*
 * Never cached: the answer is about this collector, today.
 */
export const dynamic = "force-dynamic";

/** The ledger key for one collector's spin on one day. Unique, so a day pays once. */
function spinRef(collectorId: string, day: string): string {
  return `spin:${collectorId}:${day}`;
}

/** Whether today's spin is still there to take, and when the next one opens. */
export async function GET() {
  const collectorId = await currentAccountId();
  const nextAt = nextSpinAt().toISOString();
  if (!collectorId) return NextResponse.json({ signedIn: false, available: true, nextAt });

  const ref = spinRef(collectorId, spinDay());
  const history = await backend().coinHistory(collectorId, 60);
  const today = history.find((e) => e.reason === "spin" && e.ref === ref);
  return NextResponse.json({
    signedIn: true,
    available: !today,
    won: today ? today.delta : null,
    nextAt,
  });
}

/**
 * Spins.
 *
 * The prize is drawn here, with a cryptographic roll, before the wheel moves
 * at all: the wheel on the page is told where to stop, it does not decide.
 * The credit is keyed on the collector and the day, so two taps, two tabs or
 * a replayed request can only ever pay once — whichever lands first wins and
 * the rest are told they have already spun.
 */
export async function POST() {
  const collectorId = await currentAccountId();
  if (!collectorId) {
    return NextResponse.json({ error: "Sign in to spin" }, { status: 401 });
  }

  const day = spinDay();
  const coins = prizeFor(randomInt(0, 100));
  const credit = await backend().moveCoins({
    collectorId,
    delta: coins,
    reason: "spin",
    ref: spinRef(collectorId, day),
    note: "Daily spin",
  });

  if (!credit.ok) {
    return NextResponse.json({ error: "Could not spin right now" }, { status: 500 });
  }
  if (!credit.applied) {
    return NextResponse.json(
      { error: "You have already spun today", nextAt: nextSpinAt().toISOString() },
      { status: 409 },
    );
  }

  // Which slot to stop on: any one showing the prize, picked at random so
  // the wheel does not always stop in the same place for the same amount.
  const slots = SPIN_SLOTS.flatMap((value, i) => (value === coins ? [i] : []));
  const slot = slots[randomInt(0, slots.length)];

  return NextResponse.json({
    coins,
    slot,
    balance: credit.balance,
    nextAt: nextSpinAt().toISOString(),
  });
}
