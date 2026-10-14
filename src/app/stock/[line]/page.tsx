import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SetBrowser } from "@/components/SetBrowser";
import { productsFor } from "@/lib/catalog";
import { getLine } from "@/lib/lines";
import { shelfFor } from "@/lib/stock";
import type { StockEntry } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ line: string }> }): Promise<Metadata> {
  const line = getLine((await params).line);
  return { title: line ? `${line.name} stock — Blind Box` : "Current stock — Blind Box" };
}

/**
 * One collection's shelves, box by box. `?box=` opens it on one box, which is
 * what "Box details" beside the shop's recent pulls links to.
 */
export default async function CollectionStockPage({
  params,
  searchParams,
}: {
  params: Promise<{ line: string }>;
  searchParams: Promise<{ box?: string | string[] }>;
}) {
  const line = getLine((await params).line);
  if (!line) notFound();
  const products = productsFor(line.id);

  // Loaded per request: stock moves every time a box sells.
  const shelves: Record<string, StockEntry[]> = Object.fromEntries(
    await Promise.all(products.map(async (p) => [p.id, await shelfFor(p.id)] as const)),
  );

  // Checked against this collection's boxes rather than trusted: the value
  // lands in component state and names a tab.
  const asked = (await searchParams).box;
  const box = typeof asked === "string" && products.some((p) => p.id === asked) ? asked : undefined;

  return (
    <div className="pt-6">
      <SetBrowser products={products} shelves={shelves} initialProductId={box} />
    </div>
  );
}
