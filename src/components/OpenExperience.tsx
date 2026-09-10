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
            className="mt-10 space-y-4"
          >
            {/*
              No address here any more. A piece posted the moment it is opened
              is a piece posted alone, and paying postage six times over a
              fortnight is exactly what bundling exists to avoid — so the pull
              goes to the collection and travels with whatever else is picked.
            */}
            <div className="rounded-2xl border border-hairline bg-ink-card p-6">
              <p className="text-[11px] uppercase tracking-[0.16em] text-faint">
                In your collection
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                It keeps as long as you like. Send it whenever you want, on its own
                or with everything else you have opened — a parcel costs one postage
                however many pieces are in it.
              </p>
              <Link
                href="/collection"
                className="mt-4 inline-block rounded-xl bg-chalk px-5 py-3 text-sm font-semibold text-ink transition-transform hover:scale-[1.02] active:scale-[0.99]"
              >
                Ship your pieces
              </Link>
            </div>

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
