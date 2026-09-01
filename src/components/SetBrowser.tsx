"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import {
  formatOdds,
  oddsAsOneIn,
  oddsFor,
  PRODUCTS,
  RARITY_LABEL,
  RARITY_ORDER,
  SERIES_NUMBERS,
  seriesName,
} from "@/lib/catalog";
import type { Piece, PoolEntry, Rarity } from "@/lib/types";
import { BearbrickArt } from "./BearbrickArt";
import { PieceCard } from "./PieceCard";
import { RarityChip, SectionLabel } from "./ui";

type Sort = "rarity" | "odds" | "name";

/**
 * The full set list under the shop. Everything a buyer could pull, with the
 * published pull rate on every tile — the odds table and the draw pool are the
 * same data, so this cannot drift away from what the server actually rolls.
 */
export function SetBrowser({ initialProductId }: { initialProductId?: string }) {
  const [productId, setProductId] = useState(initialProductId ?? PRODUCTS[0].id);
  const [series, setSeries] = useState(1);
  const [rarity, setRarity] = useState<Rarity | "all">("all");
  const [sort, setSort] = useState<Sort>("rarity");
  const [selected, setSelected] = useState<Piece | null>(null);

  const bySeries = productId === "series-roulette";
  const all = useMemo(() => oddsFor(productId), [productId]);

  const entries = useMemo(() => {
    let list: PoolEntry[] = all;
    if (bySeries) list = list.filter((e) => e.piece.series === series);
    if (rarity !== "all") list = list.filter((e) => e.piece.rarity === rarity);

    const order = (r: Rarity) => RARITY_ORDER.indexOf(r);
    return [...list].sort((a, b) => {
      if (sort === "odds") return b.odds - a.odds;
      if (sort === "name") return a.piece.name.localeCompare(b.piece.name);
      return order(a.piece.rarity) - order(b.piece.rarity) || b.odds - a.odds;
    });
  }, [all, bySeries, series, rarity, sort]);

  const rarities = useMemo(() => {
    const present = new Set(all.map((e) => e.piece.rarity));
    return RARITY_ORDER.filter((r) => present.has(r));
  }, [all]);

  const product = PRODUCTS.find((p) => p.id === productId)!;

  return (
    <section id="set" className="relative z-10 mx-auto w-full max-w-6xl px-5 py-20 sm:px-8">
      <div className="flex flex-col gap-3">
        <SectionLabel>Everything in the pool</SectionLabel>
        <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
          Every piece, and the exact rate it pulls at.
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted">
          Rates are published per piece, not per tier, and they are the same numbers the
          server draws against. No piece is ever withheld from the pool.
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

      {/* series rail */}
      {bySeries && (
        <div className="mt-6">
          <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
            <SectionLabel>Series</SectionLabel>
            <p className="text-xs text-faint">
              Series {series} · {seriesName(series)} — every series is equally likely
            </p>
          </div>
          <div className="scroll-slim flex gap-1.5 overflow-x-auto pb-2">
            {SERIES_NUMBERS.map((n) => (
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

      {/* filters */}
      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-hairline pt-5">
        <button
          type="button"
          onClick={() => setRarity("all")}
          className={`rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors ${
            rarity === "all"
              ? "bg-white/12 text-chalk"
              : "text-faint hover:text-chalk"
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
        Showing {entries.length} of {all.length} pieces in {product.name}
        {bySeries ? ` · pool spans all ${SERIES_NUMBERS.length} series` : ""}
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
              onSelect={setSelected}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      <PieceDetail
        piece={selected}
        odds={all.find((e) => e.piece.id === selected?.id)?.odds ?? 0}
        productName={product.name}
        onClose={() => setSelected(null)}
      />
    </section>
  );
}

function PieceDetail({
  piece,
  odds,
  productName,
  onClose,
}: {
  piece: Piece | null;
  odds: number;
  productName: string;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {piece && (
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
              <BearbrickArt
                uid={`detail-${piece.id}`}
                palette={piece.palette}
                pattern={piece.pattern}
                className="h-56 w-auto drop-shadow-[0_18px_30px_rgba(0,0,0,0.6)]"
                title={piece.name}
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
                  <dt className="text-[11px] uppercase tracking-[0.14em] text-faint">Type</dt>
                  <dd className="mt-1">{piece.type}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.14em] text-faint">Pull rate</dt>
                  <dd className="mt-1 font-mono">{formatOdds(odds)}</dd>
                </div>
              </dl>
              <p className="text-xs text-faint">
                {oddsAsOneIn(odds)} boxes of {productName}, on average.
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
