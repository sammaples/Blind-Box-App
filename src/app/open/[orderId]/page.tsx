import Link from "next/link";
import { notFound } from "next/navigation";
import { OpenExperience } from "@/components/OpenExperience";
import { getProduct } from "@/lib/catalog";
import { findPiece } from "@/lib/pieces";
import { publicOrder } from "@/lib/serialize";
import { currentCollectorId } from "@/lib/auth";
import { getOrder } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function OpenPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const collectorId = await currentCollectorId();
  const order = await getOrder(orderId);

  if (!order || !collectorId || order.collectorId !== collectorId) {
    notFound();
  }

  const product = getProduct(order.productId);
  if (!product) notFound();

  const view = publicOrder(order);
  // Sealed orders hand the client nothing; the piece only arrives on reveal.
  const piece = view.pieceId ? await findPiece(view.pieceId) : null;

  return (
    <>
      <div className="mx-auto w-full max-w-2xl px-5 pt-8 sm:px-8">
        <Link href="/" className="text-xs text-faint transition-colors hover:text-muted">
          ← Back to the shop
        </Link>
      </div>
      <OpenExperience order={view} product={product} piece={piece} />
    </>
  );
}
