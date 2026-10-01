import type { Metadata } from "next";
import { SetBrowser } from "@/components/SetBrowser";
import { PRODUCTS } from "@/lib/catalog";
import { shelfFor } from "@/lib/stock";
import type { StockEntry } from "@/lib/types";

export const metadata: Metadata = {
  title: "Current stock — Blind Box",
  description: "Every piece on every shelf right now, with the rate it is drawn at.",
};

export const dynamic = "force-dynamic";

/**
 * Everything on the shelves, on a tab of its own.
 *
 * It used to hang off the bottom of the shop page, reached by scrolling past
 * the boxes or by a "See current stock" button in the hero. With a tab for
 * it, it gets the whole screen, and the shop page is just the boxes.
 *
 * `?box=` opens it on one box. That is what "Box details" beside the shop's
 * recent pulls links to: the full breakdown of what a box can give you,
 * one tap off the purchase screen instead of crowded onto it.
 */
export default async function StockPage({
  searchParams,
}: {
  searchParams: Promise<{ box?: string | string[] }>;
}) {
  // Loaded per request: stock moves every time a box sells.
  const shelves: Record<string, StockEntry[]> = Object.fromEntries(
    await Promise.all(PRODUCTS.map(async (p) => [p.id, await shelfFor(p.id)] as const)),
  );

  // Checked against the catalogue rather than trusted: the value lands in
  // component state and names a tab, and an unknown box would open the page
  // on a shelf that does not exist.
  const asked = (await searchParams).box;
  const box = typeof asked === "string" && PRODUCTS.some((p) => p.id === asked)
    ? asked
    : undefined;

  return (
    <div className="pt-6">
      <SetBrowser shelves={shelves} initialProductId={box} />
    </div>
  );
}
