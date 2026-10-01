import { NextResponse } from "next/server";
import { currentAccountId } from "@/lib/auth";
import { backend } from "@/lib/db";

/**
 * The balance and what it has done lately.
 *
 * Read-only. Coins are earned by opening boxes and spent redeeming them —
 * both of which happen on the order routes — so there is nothing to post
 * here: coins are not sold.
 */
export async function GET() {
  const collectorId = await currentAccountId();
  if (!collectorId) return NextResponse.json({ coins: 0, history: [] });

  const account = await backend().upsertCollector(collectorId, {});
  const history = await backend().coinHistory(collectorId, 40);
  return NextResponse.json({ coins: account.coins ?? 0, history });
}
