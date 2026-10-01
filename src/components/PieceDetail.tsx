"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  formatOdds,
  oddsAsOneIn,
  pieceSubtitle,
  TIER_ACCENT,
  TIER_LABEL,
} from "@/lib/catalog";
import type { Piece, StockEntry } from "@/lib/types";
import { PieceImage } from "./PieceImage";
import { RarityChip } from "./ui";
import { useScrollLock } from "@/lib/useScrollLock";

/**
 * One piece, full size: the art, what it is, and what it takes to pull it.
 *
 * Lifted out of the shelf because the shelf is no longer the only place a
 * piece is tapped — the chase rail under the box opens the same sheet, and a
 * piece ought to read the same wherever it was tapped from.
 */
export function PieceDetail({
  entry,
  productName,
  onClose,
}: {
  entry: StockEntry | null;
  productName: string;
  onClose: () => void;
}) {
  const piece: Piece | undefined = entry?.piece;
  useScrollLock(entry !== null);

  /*
   * Rendered on the body rather than where it was opened from.
   *
   * A sheet is only above the page if nothing between it and the page has
   * started a stacking context of its own, and on the shop it has: the section
   * holding the rail is positioned and given a z-index, so the sheet's own
   * z-index is measured inside that section and the tab bar — a lower number,
   * but a sibling of the section rather than a child — paints over the top of
   * it. Portalling takes the sheet out of there entirely, which is the only
   * version of this that cannot be broken again by something further up.
   */
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const sheet = (
    <AnimatePresence>
      {entry && piece && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-label={piece.name}
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg overflow-hidden rounded-t-3xl border border-hairline bg-ink-raised sm:rounded-3xl"
          >
            <div
              className="flex h-64 items-center justify-center"
              style={{
                background: `radial-gradient(120% 90% at 50% 10%, ${piece.palette.wash}, #0b0b10 76%)`,
              }}
            >
              <PieceImage
                piece={piece}
                className="h-56 w-auto drop-shadow-[0_18px_30px_rgba(0,0,0,0.6)]"
              />
            </div>
            <div className="space-y-4 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold tracking-tight">{piece.name}</h3>
                  <p className="mt-1 text-sm text-muted">{pieceSubtitle(piece)}</p>
                </div>
                <RarityChip rarity={piece.rarity} />
              </div>
              <p className="text-sm leading-relaxed text-muted">{piece.blurb}</p>
              <dl className="grid grid-cols-4 gap-3 border-t border-hairline pt-4 text-center text-sm">
                {/* Which box to buy if you want this piece. It is the first
                    thing anyone reading a piece page actually needs. */}
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.14em] text-faint">Box</dt>
                  <dd className="mt-1 font-medium" style={{ color: TIER_ACCENT[piece.tier] }}>
                    {TIER_LABEL[piece.tier]}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.14em] text-faint">Scale</dt>
                  <dd className="mt-1 font-mono">{piece.scale}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.14em] text-faint">In stock</dt>
                  <dd className="mt-1 font-mono">
                    {entry.available}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.14em] text-faint">Pull rate</dt>
                  <dd className="mt-1 font-mono">
                    {entry.available > 0 ? formatOdds(entry.odds) : "—"}
                  </dd>
                </div>
              </dl>
              <p className="text-xs text-faint">
                {entry.available > 0
                  ? `${oddsAsOneIn(entry.odds)} boxes of ${productName}, at today's stock.`
                  : "Sold out — this piece is out of the pool until it is restocked."}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl bg-white/10 py-3 text-sm font-medium text-chalk transition-colors hover:bg-white/16"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Before hydration there is no body to portal into, and nothing to show
  // either: the sheet only ever opens in response to a tap.
  return mounted ? createPortal(sheet, document.body) : null;
}
