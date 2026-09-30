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

      {/*
        No headline above the shop, and no scrolling: this page is exactly one
        screen — "Pick your box", the boxes, and the Buy button — between the
        header and the tab bar. The height is the screen less those two (57px
        of header including its border, the bar and the home-indicator inset
        under it). `svh` so it is sized for the browser's toolbars showing,
        which is the most room it can ever have, and so it never grows past
        the screen when they slide away.
      */}
      {/* Short screens — an iPhone SE is 667 tall — take the spacing in
          everywhere so the box, which is what gives, keeps a sensible size. */}
      <div className="flex h-[calc(100svh-57px-4.25rem-env(safe-area-inset-bottom))] flex-col pt-5 sm:pt-10 [@media(max-height:720px)]:pt-3">
        <Shop shelves={shelves} />
      </div>

    </>
  );
}
