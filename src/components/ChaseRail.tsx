"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { formatOdds, oddsAsOneIn, pieceSubtitle, RARITY_COLOR } from "@/lib/catalog";
import type { StockEntry } from "@/lib/types";
import { PieceImage } from "./PieceImage";
import { PieceDetail } from "./PieceDetail";

/**
 * What is actually in the box, under the box.
 *
 * The rates below say a chase is in there somewhere and how often; they do not
 * say which one, and which one is the entire reason anybody picks one box over
 * another. This is that answer, in the order a collector would ask for it:
 * scarcest first, sold-out ones still shown because a pool you just missed is
 * part of knowing what the box is.
 *
 * Tapping one opens the same sheet the shelf opens. A piece should read the
 * same wherever it was tapped from.
 */

/** Rarest pull first — the shortest odds are what this rail is for. */
function byOdds(a: StockEntry, b: StockEntry): number {
  // Sold out sinks, whatever its old rate was.
  if ((a.available > 0) !== (b.available > 0)) return a.available > 0 ? -1 : 1;
  return a.odds - b.odds;
}

export function ChaseRail({
  shelf,
  productId,
  productName,
}: {
  shelf: StockEntry[];
  productId: string;
  productName: string;
}) {
  const [selected, setSelected] = useState<StockEntry | null>(null);

  const chases = useMemo(
    () => shelf.filter((e) => e.piece.rarity === "chase").sort(byOdds),
    [shelf],
  );

  return (
    /*
     * A fixed height, and that is deliberate.
     *
     * Everything between the box and the Buy button in this layout is given
     * room for its worst case and told to stay that size, so that swiping from
     * one box to the next does not move the button out from under a thumb
     * already on its way down. A rail that collapsed on a box with no chases
     * left would do exactly that, so an empty one says so in the same space it
     * would otherwise fill.
     */
    <div className="mx-auto w-full max-w-md shrink-0">
      <div className="px-0.5">
        <h2 className="flex items-center gap-2 text-[13px] font-semibold tracking-tight">
          <span
            aria-hidden
            className="size-1.5 rounded-full"
            style={{ background: RARITY_COLOR.chase }}
          />
          Chases
        </h2>
      </div>

      <div className="mt-2 h-[4.5rem] [@media(max-height:720px)]:h-[3.75rem]">
        <AnimatePresence mode="wait">
          <motion.div
            /* Keyed on the box so the rail swaps whole rather than cross-fading
               one box's chases into another's, and so it starts each box from
               its own first card instead of wherever the last one was left. */
            key={productId}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="h-full"
          >
            {chases.length === 0 ? (
              <p className="flex h-full items-center justify-center rounded-2xl border border-dashed border-hairline text-[12px] text-faint">
                No chases left in this pool
              </p>
            ) : (
              /* Bleeds past the panel's gutter so a card scrolls off the edge
                 of the phone rather than stopping inside a margin — the same
                 rule the box rail above it follows. */
              /* `scroll-pl` and not just `pl`: a snap point aligns to the edge
                 of the scrollport, and the scrollport ignores padding, so
                 without it the browser scrolls the gutter away on its own and
                 parks the first card hard against the edge of the phone —
                 out of line with the heading right above it. */
              <div className="no-scrollbar -mx-5 flex h-full snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain px-5 scroll-pl-5 sm:-mx-1 sm:px-1 sm:scroll-pl-1">
                {chases.map((entry) => (
                  <ChaseCard
                    key={entry.piece.id}
                    entry={entry}
                    onSelect={() => setSelected(entry)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <PieceDetail
        entry={selected}
        productName={productName}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

function ChaseCard({
  entry,
  onSelect,
}: {
  entry: StockEntry;
  onSelect: () => void;
}) {
  const { piece, available, odds } = entry;
  const gone = available === 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`${piece.name} — ${gone ? "sold out" : oddsAsOneIn(odds)}`}
      className={`group flex h-full w-[13.5rem] shrink-0 snap-start items-center gap-2.5 rounded-2xl border border-hairline bg-white/[0.04] p-2 text-left transition-colors hover:border-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400 ${
        gone ? "opacity-45" : ""
      }`}
    >
      {/* The piece's own wash behind it, the way the shelf and the detail sheet
          both light a piece, so the three read as the same object. */}
      <span
        className="grid h-full w-[3.25rem] shrink-0 place-items-center overflow-hidden rounded-xl"
        style={{
          background: `radial-gradient(120% 90% at 50% 12%, ${piece.palette.wash}, #0b0b10 80%)`,
        }}
      >
        <PieceImage
          piece={piece}
          thumb
          className="h-[2.75rem] w-auto drop-shadow-[0_6px_12px_rgba(0,0,0,0.55)] transition-transform duration-300 group-hover:scale-[1.08]"
        />
      </span>

      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-[12.5px] font-semibold text-chalk">
          {piece.name}
        </span>
        <span className="truncate text-[10.5px] text-faint">{pieceSubtitle(piece)}</span>
        {gone ? (
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
            Gone
          </span>
        ) : (
          /* The rate in the chase's own gold. It is the number the rail exists
             to show, and it is the one thing on the card worth a colour. */
          <span
            className="font-mono text-[11px] font-medium"
            style={{ color: RARITY_COLOR.chase }}
            title={oddsAsOneIn(odds)}
          >
            {formatOdds(odds)}
          </span>
        )}
      </span>
    </button>
  );
}
