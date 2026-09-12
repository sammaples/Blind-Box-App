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

  /*
   * Tighter on a phone than on anything else.
   *
   * The reveal is one tall column — piece, name, blurb, odds, then the
   * buttons — and on a 375x812 screen the second link ran 28px past the
   * bottom. Forty pixels of page padding at each end is air a desktop can
   * afford and a small phone cannot, so the padding gives way rather than
   * the piece.
   */
  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-6 sm:px-8 sm:py-10">
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
            className="mt-6 sm:mt-10"
          >
            {/*
              Two ways on, and nothing else. The pull has just been named and
              described above; a card here restating that it is in the
              collection is a second explanation of a screen that already
              explained itself.
            */}
            {/*
              Not a pair of equals.

              These two were side by side and the same size, which is the
              layout you use when you do not know which one someone wants.
              Opening another is what almost everyone here is about to do, and
              shipping is a thing you do once a fortnight after a dozen of
              them — so one is a slab across the full width and the other is a
              quiet line under it.

              Stacking is the cost of the size: "Ship your pieces" needs 131px
              of line plus padding, so a column narrow enough to leave room for
              a much bigger primary is a column it wraps in.
            */}
            <div className="flex flex-col gap-2">
              <Link
                href="/#shop"
                className="gloss rounded-2xl px-6 py-5 text-center text-2xl font-bold tracking-tight text-ink transition-transform hover:scale-[1.02] active:scale-[0.99]"
              >
                {/* The label rides above the sweep and the cap, both of which
                    sit on negative z inside the button's own stacking context. */}
                <span className="relative">Open another</span>
              </Link>
              <Link
                href="/collection"
                className="rounded-xl px-4 py-3 text-center text-sm font-medium text-muted transition-colors hover:text-chalk"
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
