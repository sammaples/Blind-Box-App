import { ScrollToHash } from "@/components/ScrollToHash";
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

      <section className="relative mx-auto w-full max-w-6xl px-5 pt-10 pb-10 sm:px-8 sm:pt-16">
        <h1 className="max-w-3xl text-balance text-5xl font-semibold leading-[0.98] tracking-[-0.03em] sm:text-7xl">
          Open it here.
          <br />
          <span className="text-muted">Keep it for real.</span>
        </h1>
        {/* No buttons under the headline any more: "Buy a box" and "See
            current stock" pointed at things the tab bar now reaches from every
            page, and "How it works" is a tab of its own. The boxes are right
            underneath. */}
      </section>

      <Shop shelves={shelves} />
    </>
  );
}
