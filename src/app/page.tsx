import { CollectionPicker } from "@/components/CollectionPicker";
import { collectionCards } from "@/lib/collections";

export const dynamic = "force-dynamic";

/**
 * The front page: which kind of collectible. Each card opens that
 * collection's boxes — the same Bronze-to-Diamond shop, over its own shelf.
 */
export default async function HomePage() {
  const cards = await collectionCards();
  return (
    <div className="pt-4 sm:pt-8">
      <CollectionPicker cards={cards} title="Pick a collection" hrefFor={(id) => `/shop/${id}`} help />
    </div>
  );
}
