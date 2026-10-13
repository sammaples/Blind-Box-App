import { CollectionPicker } from "@/components/CollectionPicker";
import { collectionCards } from "@/lib/collections";

export const dynamic = "force-dynamic";

/**
 * The front page: which kind of collectible. Each card opens that
 * collection's boxes — the same Bronze-to-Diamond shop, over its own shelf.
 */
export default async function HomePage() {
  const cards = await collectionCards();
  // Exactly one screen, like the shop: the bars share out whatever height
  // there is between the header and the tab bar.
  return (
    <div className="flex h-[calc(100svh-65px-4.25rem-env(safe-area-inset-bottom))] flex-col pt-2 sm:pt-6 [@media(max-height:720px)]:pt-1.5">
      <CollectionPicker cards={cards} title="Pick a collection" hrefFor={(id) => `/shop/${id}`} help fill />
    </div>
  );
}
