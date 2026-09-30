import Link from "next/link";
import { ScrollToHash } from "@/components/ScrollToHash";
import { SetBrowser } from "@/components/SetBrowser";
import { Shop } from "@/components/Shop";
import { PRODUCTS } from "@/lib/catalog";
import { shelfFor } from "@/lib/stock";
import type { StockEntry } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Loaded per request: stock moves every time a box sells.
  const shelves: Record<string, StockEntry[]> = Object.fromEntries(
    await Promise.all(
      PRODUCTS.map(async (p) => [p.id, await shelfFor(p.id)] as const),
    ),
  );

  return (
    <>
      {/* "Open another" aims at #shop from another route; without this the
          fragment can resolve before the section exists and land at the top. */}
      <ScrollToHash />

      <section className="relative mx-auto w-full max-w-6xl px-5 pt-16 pb-20 sm:px-8 sm:pt-24">
        <h1 className="max-w-3xl text-balance text-5xl font-semibold leading-[0.98] tracking-[-0.03em] sm:text-7xl">
          Open it here.
          <br />
          <span className="text-muted">Keep it for real.</span>
        </h1>
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link
            href="#shop"
            className="gloss gloss-chalk rounded-full px-7 py-3.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.03] active:scale-[0.98]"
          >
            Buy a box
          </Link>
          <Link
            href="#set"
            className="rounded-full border border-hairline px-7 py-3.5 text-sm font-medium text-muted transition-colors hover:border-white/30 hover:text-chalk"
          >
            See current stock
          </Link>
        </div>

        {/* The steps used to sit here, three cards deep, between the headline
            and the boxes — an explanation in front of the thing it explains,
            and half a screen of it on a phone. They have their own page now,
            and this is the door to it: reachable from the front and from the
            nav, and in the way of nobody who came here to buy a box. */}
        <div className="mt-12">
          <Link
            href="/how-it-works"
            className="group inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-chalk"
          >
            How it works
            <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </Link>
        </div>
      </section>

      <Shop shelves={shelves} />
      <SetBrowser shelves={shelves} />
    </>
  );
}
