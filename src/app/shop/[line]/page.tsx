import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ScrollToHash } from "@/components/ScrollToHash";
import { Shop } from "@/components/Shop";
import { productsFor } from "@/lib/catalog";
import { getLine } from "@/lib/lines";
import { recentPullsByProduct } from "@/lib/pulls";
import { shelfFor } from "@/lib/stock";
import type { StockEntry } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ line: string }> }): Promise<Metadata> {
  const line = getLine((await params).line);
  return { title: line ? `${line.name} — Blind Box` : "Blind Box" };
}

/** One collection's boxes: the shop as it was, over that collection's shelf. */
export default async function CollectionShopPage({ params }: { params: Promise<{ line: string }> }) {
  const line = getLine((await params).line);
  if (!line) notFound();
  const products = productsFor(line.id);

  // Loaded per request: stock moves every time a box sells, and a feed of what
  // people have pulled is only worth showing if it is current. The two go out
  // together — the feed does not depend on the shelves.
  const [shelfRows, pulls] = await Promise.all([
    Promise.all(products.map(async (p) => [p.id, await shelfFor(p.id)] as const)),
    recentPullsByProduct(),
  ]);
  const shelves: Record<string, StockEntry[]> = Object.fromEntries(shelfRows);

  return (
    <>
      {/* "Open another" aims at #shop from another route; without this the
          fragment can resolve before the section exists and land at the top. */}
      <ScrollToHash />

      {/*
        No headline above the shop, and no scrolling: this page is exactly one
        screen — "Pick your box", the boxes, and the Buy button — between the
        header and the tab bar (65px of header including its border, the bar
        and the home-indicator inset under it). `svh` so it is sized for the
        browser's toolbars showing. Short screens take the spacing in.
      */}
      <div className="flex h-[calc(100svh-65px-4.25rem-env(safe-area-inset-bottom))] flex-col pt-2 sm:pt-6 [@media(max-height:720px)]:pt-1.5">
        <Shop products={products} shelves={shelves} pulls={pulls} />
      </div>
    </>
  );
}
