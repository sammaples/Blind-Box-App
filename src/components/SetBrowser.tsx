"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import {
  formatOdds,
  oddsAsOneIn,
  PRODUCTS,
  RARITY_COLOR,
  RARITY_LABEL,
  RARITY_ORDER,
  pieceSubtitle,
  TIER_ACCENT,
  TIER_LABEL,
} from "@/lib/catalog";
import type { Piece, Rarity, StockEntry } from "@/lib/types";
import { PieceImage } from "./PieceImage";
import { PieceCard } from "./PieceCard";
import { PieceDetail } from "./PieceDetail";
import { RarityChip } from "./ui";
import { useScrollLock } from "@/lib/useScrollLock";

/**
 * Rarest first, then the longest odds.
 *
 * The only order now. A sort control offered four ways to arrange a grid whose
 * whole point is what is scarce and what it pays — sorting it by name buries
 * the chase among the commons, and nobody came to this section to read an
 * alphabet. One order that answers the question everyone has beats four that
 * mostly do not.
 */
function byRarity(a: StockEntry, b: StockEntry): number {
  return (
    RARITY_ORDER.indexOf(a.piece.rarity) - RARITY_ORDER.indexOf(b.piece.rarity) ||
    b.odds - a.odds
  );
}

/**
 * What is on the shelf right now. Every tile carries the piece's current pull
 * rate, which is simply its share of the units left — so the listing and the
 * draw cannot disagree, and a piece leaves the grid when the last one sells.
 *
 * `initialProductId` opens it on one box, which is how "Box details" arrives
 * here from the shop. It is only the starting tab: the tabs still work, because
 * somebody comparing boxes is exactly who ends up on this page.
 */
export function SetBrowser({
  shelves,
  initialProductId,
}: {
  shelves: Record<string, StockEntry[]>;
  initialProductId?: string;
}) {
  const [productId, setProductId] = useState(initialProductId ?? PRODUCTS[0].id);
  const [rarity, setRarity] = useState<Rarity | "all">("all");
  const [selected, setSelected] = useState<StockEntry | null>(null);

  const shelf = useMemo(() => shelves[productId] ?? [], [shelves, productId]);

  /**
   * What is actually buyable. A piece with no units left cannot be pulled and
   * contributes nothing to anyone's odds, so listing it is advertising stock
   * that is not there.
   */
  const available = useMemo(() => shelf.filter((e) => e.available > 0), [shelf]);

  const entries = useMemo(() => {
    const list = rarity === "all" ? available : available.filter((e) => e.piece.rarity === rarity);
    return [...list].sort(byRarity);
  }, [available, rarity]);

  /**
   * The same pieces, under their tier.
   *
   * This page is what "Box details" promises — everything you can win, broken
   * down by rarity — and a single grid sorted by rarity only implies the
   * breakdown. Headed sections state it, and each heading carries the tier's
   * combined rate, so the question "what are my chances of a chase at all" is
   * answered once at the top of the section rather than inferred from four
   * tiles. A filtered view is one section, not a bare grid: the heading is
   * where the tier's own odds live either way.
   */
  const groups = useMemo(() => {
    const total = available.reduce((sum, e) => sum + e.available, 0);
    return RARITY_ORDER.map((r) => {
      const rows = entries.filter((e) => e.piece.rarity === r);
      const units = rows.reduce((sum, e) => sum + e.available, 0);
      return { rarity: r, entries: rows, share: total > 0 ? units / total : 0 };
    }).filter((g) => g.entries.length > 0);
  }, [entries, available]);

  const rarities = useMemo(() => {
    const present = new Set(available.map((e) => e.piece.rarity));
    return RARITY_ORDER.filter((r) => present.has(r));
  }, [available]);

  const product = PRODUCTS.find((p) => p.id === productId)!;

  return (
    <section
      id="set"
      className="relative z-10 mx-auto w-full max-w-6xl scroll-mt-20 px-5 py-20 sm:px-8"
    >
      <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Live Stock</h2>

      {/* product tabs */}
      <div className="mt-8 flex flex-wrap gap-2">
        {PRODUCTS.map((p) => {
          const active = p.id === productId;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setProductId(p.id);
                setRarity("all");
              }}
              className={`relative rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
                active ? "text-ink" : "text-muted hover:text-chalk"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="set-tab"
                  className="absolute inset-0 rounded-full"
                  style={{ background: p.accent }}
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <span className="relative">{p.name}</span>
            </button>
          );
        })}
      </div>

      {/* rarity filter */}
      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-hairline pt-5">
        <button
          type="button"
          onClick={() => setRarity("all")}
          className={`rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors ${
            rarity === "all" ? "bg-white/12 text-chalk" : "text-faint hover:text-chalk"
          }`}
        >
          All
        </button>
        {rarities.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRarity(r)}
            className={`rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors ${
              rarity === r ? "bg-white/12 text-chalk" : "text-faint hover:text-chalk"
            }`}
          >
            {RARITY_LABEL[r]}
          </button>
        ))}
      </div>

      {/* Hiding sold-out pieces means the grid can now legitimately be empty —
          a shelf that has sold through, or a filter that has outlived its
          stock. Either way it needs to say so rather than end in blank space. */}
      {entries.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-hairline p-12 text-center text-sm text-muted">
          {available.length === 0
            ? `Every ${product.name} piece has sold. New stock goes up here as it lands.`
            : "Nothing in stock matches that. Try another filter."}
        </p>
      ) : (
        <div className="mt-6 space-y-8">
          {groups.map((group) => (
            <section key={group.rarity}>
              <div className="flex items-baseline justify-between gap-3 border-b border-hairline pb-2">
                <h3
                  className="text-[12px] font-bold uppercase tracking-[0.16em]"
                  style={{ color: RARITY_COLOR[group.rarity] }}
                >
                  {RARITY_LABEL[group.rarity]}
                </h3>
                {/* The tier's rate, not the piece's: what share of this box's
                    remaining units sits in this section. */}
                <p className="shrink-0 font-mono text-[11px] text-muted" title={oddsAsOneIn(group.share)}>
                  {formatOdds(group.share)}
                </p>
              </div>

              <motion.div
                layout
                className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
              >
                <AnimatePresence mode="popLayout">
                  {group.entries.map((entry) => (
                    <PieceCard
                      key={entry.piece.id}
                      piece={entry.piece}
                      odds={entry.odds}
                      available={entry.available}
                      onSelect={() => setSelected(entry)}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            </section>
          ))}
        </div>
      )}

      <PieceDetail
        entry={selected}
        productName={product.name}
        onClose={() => setSelected(null)}
      />
    </section>
  );
}
