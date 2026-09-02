"use client";

import { motion } from "framer-motion";
import { formatOdds, oddsAsOneIn } from "@/lib/catalog";
import type { Piece } from "@/lib/types";
import { PieceImage } from "./PieceImage";
import { RarityChip } from "./ui";

/** One tile on the shelf: the art, the name, the pull rate, and what is left. */
export function PieceCard({
  piece,
  odds,
  available,
  onSelect,
}: {
  piece: Piece;
  odds: number;
  available: number;
  onSelect?: (piece: Piece) => void;
}) {
  const soldOut = available === 0;
  return (
    <motion.button
      type="button"
      onClick={() => onSelect?.(piece)}
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className={`group relative overflow-hidden rounded-2xl border border-hairline bg-ink-card p-3 text-left transition-colors hover:border-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400 ${
        soldOut ? "opacity-45" : ""
      }`}
    >
      <div
        className="relative flex h-36 items-center justify-center rounded-xl"
        style={{
          background: `radial-gradient(120% 90% at 50% 12%, ${piece.palette.wash}, #0b0b10 78%)`,
        }}
      >
        <PieceImage
          piece={piece}
          className="h-[7.5rem] w-auto drop-shadow-[0_10px_20px_rgba(0,0,0,0.55)] transition-transform duration-300 group-hover:scale-[1.06]"
        />
      </div>

      <div className="mt-3 space-y-1.5">
        <p className="truncate text-[13px] font-semibold text-chalk">{piece.name}</p>
        <p className="truncate text-[11px] text-faint">{piece.setName}</p>
        <div className="flex items-center justify-between gap-2 pt-1">
          <RarityChip rarity={piece.rarity} />
          {soldOut ? (
            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
              Sold out
            </span>
          ) : (
            <span
              className="shrink-0 font-mono text-[11px] text-muted"
              title={oddsAsOneIn(odds)}
            >
              {formatOdds(odds)}
            </span>
          )}
        </div>
        {!soldOut && (
          <p className="font-mono text-[10px] text-faint">
            {available} left
          </p>
        )}
      </div>
    </motion.button>
  );
}
