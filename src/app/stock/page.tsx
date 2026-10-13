import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CollectionPicker } from "@/components/CollectionPicker";
import { getProduct } from "@/lib/catalog";
import { collectionCards } from "@/lib/collections";

export const metadata: Metadata = {
  title: "Current stock — Blind Box",
  description: "Every piece on every shelf right now, with the rate it is drawn at.",
};

export const dynamic = "force-dynamic";

/**
 * Current stock starts at the collections, the same cards as the front page:
 * one collection's shelves at a time, or the page would be every piece of
 * every collection in one long list.
 *
 * `?box=` is the old way in, from "Box details": it goes straight to that
 * box's collection, opened on that box.
 */
export default async function StockPage({
  searchParams,
}: {
  searchParams: Promise<{ box?: string | string[] }>;
}) {
  const asked = (await searchParams).box;
  const box = typeof asked === "string" ? getProduct(asked) : undefined;
  if (box) redirect(`/stock/${box.line}?box=${encodeURIComponent(box.id)}`);

  const cards = await collectionCards();
  return (
    <div className="pt-4 sm:pt-8">
      <CollectionPicker cards={cards} title="Current stock" hrefFor={(id) => `/stock/${id}`} />
    </div>
  );
}
