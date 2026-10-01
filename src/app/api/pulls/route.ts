import { NextResponse } from "next/server";
import { recentPullsByProduct } from "@/lib/pulls";

/*
 * Never built ahead of time: a feed of recent pulls frozen at deploy would be
 * a list of what happened before anyone could buy anything.
 */
export const dynamic = "force-dynamic";

/**
 * The shop's recent-pulls feed, for the shop to poll while it is open.
 *
 * Everybody gets the same answer — it is every buyer's pulls, not the asker's
 * — so it is safe to share at the edge, and it is shared for a few seconds on
 * purpose. Every open shop asks every few seconds; without that, the database
 * would answer once per visitor per tick, and a busy evening would be doing
 * hundreds of identical reads a minute to tell everyone the same thing. With
 * it, the CDN answers all of them from one read, and a pull still reaches
 * every screen within seconds.
 */
export async function GET() {
  const pulls = await recentPullsByProduct();
  return NextResponse.json(
    { pulls },
    { headers: { "cache-control": "public, max-age=0, s-maxage=4, stale-while-revalidate=8" } },
  );
}
