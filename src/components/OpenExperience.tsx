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
              Two ways on, and only two. A piece posted the moment it is opened
              is a piece posted alone, and paying postage six times over a
              fortnight is what bundling exists to avoid — so the pull goes to
              the collection, and the choice here is another box or send what
              you have. There used to be a third link to the same collection
              page under a different name, which is one more decision than the
              moment deserves.
            */}
            <div className="rounded-2xl border border-hairline bg-ink-card p-6">
              <p className="text-[11px] uppercase tracking-[0.16em] text-faint">
                In your collection
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                It keeps as long as you like. Send it on its own or with everything
                else you have opened — a parcel costs one postage however many
                pieces are in it.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Link
                  href="/#shop"
                  className="rounded-xl bg-chalk px-5 py-3.5 text-center text-sm font-semibold text-ink transition-transform hover:scale-[1.02] active:scale-[0.99]"
                >
                  Buy another box
                </Link>
                <Link
                  href="/collection"
                  className="rounded-xl border border-hairline px-5 py-3.5 text-center text-sm font-semibold text-chalk transition-colors hover:border-white/35 hover:bg-white/[0.06]"
                >
                  Ship your pieces
                </Link>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
