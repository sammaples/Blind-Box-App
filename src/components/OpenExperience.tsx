"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import type { PublicOrder } from "@/lib/serialize";
import type { Piece, Product } from "@/lib/types";
import { BoxOpening } from "./BoxOpening";

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
  const [revealed, setRevealed] = useState(initialPiece !== null);

  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-10 sm:px-8">
      <BoxOpening
        orderId={initialOrder.id}
        product={product}
        initialPiece={initialPiece}
        initialOdds={initialOrder.pulledOdds ?? 0}
        onRevealed={() => setRevealed(true)}
      />

      <AnimatePresence>
        {revealed && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="mt-10"
          >
            {/*
              Two ways on, and nothing else. The pull has just been named and
              described above; a card here restating that it is in the
              collection is a second explanation of a screen that already
              explained itself.
            */}
            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                href="/#shop"
                className="rounded-xl bg-chalk px-5 py-3.5 text-center text-sm font-semibold text-ink transition-transform hover:scale-[1.02] active:scale-[0.99]"
              >
                Open another
              </Link>
              <Link
                href="/collection"
                className="rounded-xl border border-hairline px-5 py-3.5 text-center text-sm font-semibold text-chalk transition-colors hover:border-white/35 hover:bg-white/[0.06]"
              >
                Ship your pieces
              </Link>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
