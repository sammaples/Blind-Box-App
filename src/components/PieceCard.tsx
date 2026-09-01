"use client";

import { motion } from "framer-motion";
import { formatOdds, oddsAsOneIn } from "@/lib/catalog";
import type { Piece } from "@/lib/types";
import { BearbrickArt } from "./BearbrickArt";
import { RarityChip } from "./ui";

/** One tile in the "what's inside" grid: the art, the name, and the pull rate. */
export function PieceCard({
  piece,
  odds,
  onSelect,
}: {
  piece: Piece;
  odds: number;
  onSelect?: (piece: Piece) => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={() => onSelect?.(piece)}
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-2xl border border-hairline bg-ink-card p-3 text-left transition-colors hover:border-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400"
    >
      <div
        className="relative flex h-36 items-center justify-center rounded-xl"
        style={{
          background: `radial-gradient(120% 90% at 50% 12%, ${piece.palette.wash}, #0b0b10 78%)`,
        }}
      >
        <BearbrickArt
          uid={piece.id}
          palette={piece.palette}
          pattern={piece.pattern}
          className="h-[7.5rem] w-auto drop-shadow-[0_10px_20px_rgba(0,0,0,0.55)] transition-transform duration-300 group-hover:scale-[1.06]"
          title={piece.name}
        />
      </div>

      <div className="mt-3 space-y-1.5">
        <p className="truncate text-[13px] font-semibold text-chalk">{piece.name}</p>
        <p className="truncate text-[11px] text-faint">{piece.setName}</p>
        <div className="flex items-center justify-between gap-2 pt-1">
          <RarityChip rarity={piece.rarity} />
          <span
            className="shrink-0 font-mono text-[11px] text-muted"
            title={oddsAsOneIn(odds)}
          >
            {formatOdds(odds)}
          </span>
        </div>
      </div>
    </motion.button>
  );
}
