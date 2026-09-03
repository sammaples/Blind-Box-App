"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import {
  formatOdds,
  oddsAsOneIn,
  PRODUCTS,
  RARITY_LABEL,
  RARITY_ORDER,
  seriesName,
} from "@/lib/catalog";
import type { Piece, Rarity, StockEntry } from "@/lib/types";
import { PieceImage } from "./PieceImage";
import { PieceCard } from "./PieceCard";
import { RarityChip, SectionLabel } from "./ui";
import { useScrollLock } from "@/lib/useScrollLock";

type Sort = "rarity" | "odds" | "name";

/**
 * What is on the shelf right now. Every tile carries the piece's current pull
 * rate, which is simply its share of the units left — so the listing and the
 * draw cannot disagree, and a piece leaves the grid when the last one sells.
 */
export function SetBrowser({ shelves }: { shelves: Record<string, StockEntry[]> }) {
  const [productId, setProductId] = useState(PRODUCTS[0].id);
  const [series, setSeries] = useState<number | "all">("all");
  const [rarity, setRarity] = useState<Rarity | "all">("all");
  const [sort, setSort] = useState<Sort>("rarity");
  const [selected, setSelected] = useState<StockEntry | null>(null);

  const shelf = useMemo(() => shelves[productId] ?? [], [shelves, productId]);

  /** Series that actually have stock, so the filter never offers a dead end. */
  const stockedSeries = useMemo(() => {
    const found = new Set<number>();
    for (const entry of shelf) {
      if (entry.piece.series !== null && entry.available > 0) found.add(entry.piece.series);
    }
    return [...found].sort((a, b) => a - b);
  }, [shelf]);

  const entries = useMemo(() => {
    let list = shelf;
    if (series !== "all") list = list.filter((e) => e.piece.series === series);
    if (rarity !== "all") list = list.filter((e) => e.piece.rarity === rarity);

    return [...list].sort((a, b) => {
      // Sold-out pieces always sink to the bottom, whatever the sort.
      if ((a.available === 0) !== (b.available === 0)) return a.available === 0 ? 1 : -1;
      if (sort === "odds") return b.odds - a.odds;
      if (sort === "name") return a.piece.name.localeCompare(b.piece.name);
      return RARITY_ORDER.indexOf(a.piece.rarity) - RARITY_ORDER.indexOf(b.piece.rarity) || b.odds - a.odds;
    });
  }, [shelf, series, rarity, sort]);

  const rarities = useMemo(() => {
    const present = new Set(shelf.map((e) => e.piece.rarity));
    return RARITY_ORDER.filter((r) => present.has(r));
  }, [shelf]);

  const product = PRODUCTS.find((p) => p.id === productId)!;
  const unitsLeft = shelf.reduce((sum, e) => sum + e.available, 0);
  const inStock = shelf.filter((e) => e.available > 0).length;

  return (
    <section id="set" className="relative z-10 mx-auto w-full max-w-6xl px-5 py-20 sm:px-8">
      <div className="flex flex-col gap-3">
        <SectionLabel>On the shelf right now</SectionLabel>
        <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
          Everything in stock, and the exact rate it pulls at.
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted">
          A piece&apos;s rate is its share of the units left on the shelf, so these are the
          same numbers the draw runs against. Stock changes as inventory arrives and boxes
          sell — when the last unit of a piece goes, it leaves the pool.
        </p>
      </div>

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
                setSeries("all");
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

      {/* series filter — only for shelves that hold numbered series */}
      {stockedSeries.length > 0 && (
        <div className="mt-6">
          <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
            <SectionLabel>Series in stock</SectionLabel>
            <p className="text-xs text-faint">
              {series === "all"
                ? `${stockedSeries.length} series on the shelf`
                : `Series ${series} · ${seriesName(series as number)}`}
            </p>
          </div>
          <div className="scroll-slim flex gap-1.5 overflow-x-auto pb-2">
            <button
              type="button"
              onClick={() => setSeries("all")}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs transition-colors ${
                series === "all"
                  ? "bg-chalk text-ink"
                  : "border border-hairline text-muted hover:border-white/25 hover:text-chalk"
              }`}
            >
              All
            </button>
            {stockedSeries.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setSeries(n)}
                className={`shrink-0 rounded-lg px-3 py-1.5 font-mono text-xs transition-colors ${
                  n === series
                    ? "bg-chalk text-ink"
                    : "border border-hairline text-muted hover:border-white/25 hover:text-chalk"
                }`}
              >
                {String(n).padStart(2, "0")}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* rarity filter + sort */}
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

        <div className="ml-auto flex items-center gap-2">
          <label htmlFor="sort" className="text-[11px] uppercase tracking-[0.14em] text-faint">
            Sort
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="rounded-lg border border-hairline bg-ink-raised px-2.5 py-1.5 text-xs text-chalk outline-none focus:border-white/30"
          >
            <option value="rarity">Rarity</option>
            <option value="odds">Pull rate</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>

      <p className="mt-4 text-xs text-faint">
        Showing {entries.length} of {shelf.length} pieces in {product.name} · {inStock} in stock ·{" "}
        <span className="font-mono">{unitsLeft.toLocaleString()}</span> units left
      </p>

      <motion.div
        layout
        className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
      >
        <AnimatePresence mode="popLayout">
          {entries.map((entry) => (
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

      <PieceDetail
        entry={selected}
        productName={product.name}
        onClose={() => setSelected(null)}
      />
    </section>
  );
}

function PieceDetail({
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

  return (
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
                  <p className="mt-1 text-sm text-muted">{piece.setName}</p>
                </div>
                <RarityChip rarity={piece.rarity} />
              </div>
              <p className="text-sm leading-relaxed text-muted">{piece.blurb}</p>
              <dl className="grid grid-cols-3 gap-3 border-t border-hairline pt-4 text-sm">
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
}
