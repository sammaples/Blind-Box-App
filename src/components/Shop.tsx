"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PRODUCTS, RARITY_COLOR } from "@/lib/catalog";
import type { Product, StockEntry } from "@/lib/types";
import { boxGeometry } from "@/lib/boxShape";
import { useAccount } from "./AccountBar";
import { Price, SectionLabel } from "./ui";

/** The boxes on sale, plus the checkout sheet that seals one. */
export function Shop({ shelves }: { shelves: Record<string, StockEntry[]> }) {
  const [checkout, setCheckout] = useState<Product | null>(null);
  const { account, signIn } = useAccount();

  /**
   * Buying needs an account, so an unsigned-in buyer is asked for one first
   * rather than being let through and refused at the end.
   */
  const startCheckout = (product: Product) => {
    if (!account) {
      signIn("A box is a real object that has to reach you, so we need an account before you buy. No password — we email you a link.");
      return;
    }
    setCheckout(product);
  };

  return (
    <section id="shop" className="relative z-10 mx-auto w-full max-w-6xl px-5 sm:px-8">
      <div className="flex flex-col gap-3">
        <SectionLabel>Pick your box</SectionLabel>
        <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
          Two boxes. One pull each.
        </h2>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {PRODUCTS.map((product, i) => (
          <ProductCard
            key={product.id}
            product={product}
            shelf={shelves[product.id] ?? []}
            index={i}
            onBuy={() => startCheckout(product)}
          />
        ))}
      </div>

      <CheckoutSheet product={checkout} onClose={() => setCheckout(null)} />
    </section>
  );
}

function ProductCard({
  product,
  shelf,
  index,
  onBuy,
}: {
  product: Product;
  shelf: StockEntry[];
  index: number;
  onBuy: () => void;
}) {
  const inStock = shelf.filter((e) => e.available > 0);
  const unitsLeft = inStock.reduce((sum, e) => sum + e.available, 0);
  const soldOut = unitsLeft === 0;
  const best = [...inStock].sort((a, b) => a.odds - b.odds)[0];

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.45, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-hairline bg-ink-card p-6 transition-colors hover:border-white/22"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 size-56 -translate-x-1/2 rounded-full opacity-25 blur-3xl transition-opacity duration-500 group-hover:opacity-45"
        style={{ background: product.accent }}
      />

      <div className="relative flex h-44 items-center justify-center">
        <ProductBox accent={product.accent} />
      </div>

      <div className="relative mt-4 flex flex-1 flex-col">
        <h3 className="text-lg font-semibold tracking-tight">{product.name}</h3>
        <p className="mt-1 text-sm text-muted">{product.tagline}</p>

        <ul className="mt-4 space-y-2 pb-5">
          {product.highlights.map((h) => (
            <li key={h} className="flex items-start gap-2 text-[13px] text-muted">
              <span
                className="mt-1.5 size-1.5 shrink-0 rounded-full"
                style={{ background: product.accent }}
              />
              {h}
            </li>
          ))}
        </ul>

        <div className="mt-auto space-y-1.5 border-t border-hairline pt-4 text-[11px] text-faint">
          <p>
            In stock now: {inStock.length} pieces ·{" "}
            <span className="font-mono">{unitsLeft.toLocaleString()}</span> units
          </p>
          {best && (
            <p>
              Rarest on the shelf:{" "}
              <span style={{ color: RARITY_COLOR[best.piece.rarity] }}>{best.piece.name}</span>{" "}
              at {(best.odds * 100).toFixed(3)}%
            </p>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 pt-1">
          <p className="font-mono text-xl">
            <Price cents={product.priceCents} />
          </p>
          <button
            type="button"
            onClick={onBuy}
            disabled={soldOut}
            className="rounded-full px-5 py-2.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.03] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:scale-100"
            style={{ background: soldOut ? "#3a3a44" : product.accent }}
          >
            {soldOut ? "Sold out" : "Buy one box"}
          </button>
        </div>
      </div>
    </motion.article>
  );
}

function ProductBox({ accent }: { accent: string }) {
  const box = boxGeometry(62);

  const faceBackground = (shade: number) =>
    `linear-gradient(150deg, color-mix(in srgb, ${accent} ${shade}%, #17171d), #0d0d12 70%)`;

  return (
    <motion.div
      className="relative"
      style={{ perspective: "700px" }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <motion.div
        className="relative"
        style={{
          width: box.width,
          height: box.height,
          transformStyle: "preserve-3d",
        }}
        initial={{ rotateX: -16, rotateY: -24 }}
        animate={{ rotateY: [-24, -14, -24] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Only the three faces a 3/4 view can see. */}
        <div
          style={{
            ...box.face("front"),
            background: faceBackground(34),
            boxShadow: "inset 0 0 0 1px rgb(255 255 255 / 0.08)",
          }}
        />
        <div
          style={{
            ...box.face("right"),
            background: faceBackground(24),
            boxShadow: "inset 0 0 0 1px rgb(255 255 255 / 0.08)",
          }}
        />
        <div
          style={{
            ...box.face("top"),
            background: faceBackground(14),
            boxShadow: "inset 0 0 0 1px rgb(255 255 255 / 0.08)",
          }}
        />

        <div
          className="absolute inset-x-0 top-1/2 flex justify-center"
          style={{ transform: `translateZ(${box.width / 2 + 1}px) translateY(-50%)` }}
        >
          <span className="text-2xl font-bold" style={{ color: accent }}>
            ?
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CheckoutSheet({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const { account } = useAccount();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buy = async () => {
    if (!product || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Could not complete the purchase");
      router.push(`/open/${data.order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={busy ? undefined : onClose}
        >
          <motion.div
            role="dialog"
            aria-label={`Buy ${product.name}`}
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-t-3xl border border-hairline bg-ink-raised p-6 sm:rounded-3xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold tracking-tight">{product.name}</h3>
                <p className="mt-1 text-sm text-muted">{product.tagline}</p>
              </div>
              <p className="font-mono text-lg">
                <Price cents={product.priceCents} />
              </p>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-muted">{product.description}</p>

            <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-hairline bg-ink px-4 py-3">
              <span className="text-[11px] uppercase tracking-[0.16em] text-faint">
                Buying as
              </span>
              <span className="truncate text-sm text-chalk">{account?.email}</span>
            </div>

            <button
              type="button"
              onClick={buy}
              disabled={busy}
              className="mt-5 w-full rounded-xl py-3.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
              style={{ background: product.accent }}
            >
              {busy ? "Sealing your box…" : `Buy and seal · $${(product.priceCents / 100).toFixed(2)}`}
            </button>

            {error && <p className="mt-3 text-center text-xs text-rose-400">{error}</p>}

            <p className="mt-4 text-center text-[11px] leading-relaxed text-faint">
              Demo checkout — no card is collected and nothing is charged. Your piece is
              drawn server-side the moment the box is sealed, against the published rates.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
