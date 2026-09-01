"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import type { PublicOrder } from "@/lib/serialize";
import type { Piece, Product } from "@/lib/types";
import { BoxOpening } from "./BoxOpening";
import { ShippingForm } from "./ShippingForm";

/** The open page: box, reveal, and then the shipping step for that pull. */
export function OpenExperience({
  order: initialOrder,
  product,
  piece: initialPiece,
}: {
  order: PublicOrder;
  product: Product;
  piece: Piece | null;
}) {
  const [order, setOrder] = useState(initialOrder);
  const [revealed, setRevealed] = useState(initialPiece !== null);

  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-10 sm:px-8">
      <BoxOpening
        orderId={order.id}
        product={product}
        initialPiece={initialPiece}
        onRevealed={() => setRevealed(true)}
      />

      <AnimatePresence>
        {revealed && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="mt-10 space-y-4"
          >
            <ShippingForm order={order} onUpdated={setOrder} />

            <div className="flex flex-wrap gap-3">
              <Link
                href="/#shop"
                className="flex-1 rounded-xl border border-hairline px-5 py-3 text-center text-sm font-medium text-muted transition-colors hover:border-white/30 hover:text-chalk"
              >
                Open another
              </Link>
              <Link
                href="/collection"
                className="flex-1 rounded-xl border border-hairline px-5 py-3 text-center text-sm font-medium text-muted transition-colors hover:border-white/30 hover:text-chalk"
              >
                My pulls
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
