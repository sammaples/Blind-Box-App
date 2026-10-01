"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { tradeValue } from "@/lib/coins";
import type { PublicOrder } from "@/lib/serialize";
import type { Piece, Product } from "@/lib/types";
import { useAccount } from "./AccountBar";
import { BoxOpening } from "./BoxOpening";
import { Coins } from "./Coin";

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
  // What came out, once it has — the sell button needs its value.
  const [pulled, setPulled] = useState<Piece | null>(initialPiece);

  /*
   * Tighter on a phone than on anything else.
   *
   * The reveal is one tall column — piece, name, blurb, odds, then the
   * buttons — and on a 375x812 screen the second link ran 28px past the
   * bottom. Forty pixels of page padding at each end is air a desktop can
   * afford and a small phone cannot, so the padding gives way rather than
   * the piece.
   */
  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-6 sm:px-8 sm:py-10">
      <BoxOpening
        orderId={initialOrder.id}
        product={product}
        initialPiece={initialPiece}
        onRevealed={(piece) => {
          setPulled(piece ?? null);
          setRevealed(true);
        }}
      />

      <AnimatePresence>
        {revealed && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="mt-4 sm:mt-10"
          >
            {/*
              Two ways on, and nothing else. The pull has just been named and
              described above; a card here restating that it is in the
              collection is a second explanation of a screen that already
              explained itself.
            */}
            {/*
              Not a pair of equals.

              These two were side by side and the same size, which is the
              layout you use when you do not know which one someone wants.
              Opening another is what almost everyone here is about to do, and
              shipping is a thing you do once a fortnight after a dozen of
              them — so one is a slab across the full width and the other is a
              quiet line under it.

              Stacking is the cost of the size: "Ship your pieces" needs 131px
              of line plus padding, so a column narrow enough to leave room for
              a much bigger primary is a column it wraps in.
            */}
            <div className="flex flex-col gap-2">
              <Link
                href="/#shop"
                className="gloss gloss-chalk gloss-loud rounded-2xl px-6 py-3.5 text-center text-2xl font-bold tracking-tight text-ink transition-transform hover:scale-[1.02] active:scale-[0.99]"
              >
                {/* The label rides above the sweep and the cap, both of which
                    sit on negative z inside the button's own stacking context. */}
                <span className="relative">Open another</span>
              </Link>
              {pulled && (
                <SellPull orderId={initialOrder.id} piece={pulled} status={initialOrder.status} />
              )}
              <Link
                href="/collection"
                className="rounded-xl px-4 py-2.5 text-center text-sm font-medium text-muted transition-colors hover:text-chalk"
              >
                Ship your pieces
              </Link>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Sell the piece that just came out, for coins, without leaving the screen.
 *
 * The moment somebody decides they do not want a pull is the moment they see
 * it, so the offer is made here rather than a trip to the vault later. It is
 * the vault's trade-in — the same route, the same value, the same one-credit-
 * per-piece guard in the ledger — so the number on the button is the number
 * that lands in the balance.
 *
 * Two taps, because it cannot be undone: a sold piece leaves the vault and
 * can never be shipped. The second tap is where that is said. Every state is
 * the same 48px tall, so tapping Sell never moves "Ship your pieces" — on a
 * small phone that link sits a few pixels off the bottom edge.
 */
function SellPull({
  orderId,
  piece,
  status,
}: {
  orderId: string;
  piece: Piece;
  status: PublicOrder["status"];
}) {
  const { refresh } = useAccount();
  const value = tradeValue(piece);
  const [stage, setStage] = useState<"idle" | "armed" | "busy" | "sold">(
    status === "traded" ? "sold" : "idle",
  );
  const [error, setError] = useState<string | null>(null);

  // `status` is the order as the page loaded it, so a box opened on this
  // screen still reads "paid" — sealed then, opened now. That and "revealed"
  // can be sold; a piece already in a parcel or on its way cannot.
  if (status !== "paid" && status !== "revealed" && status !== "traded") return null;

  const sell = async () => {
    setStage("busy");
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/trade`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Could not sell that piece");
      setStage("sold");
      // The balance is in the header; tell it.
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStage("idle");
    }
  };

  if (stage === "sold") {
    return (
      <p className="flex h-12 items-center justify-center gap-1.5 rounded-xl border border-hairline px-4 text-sm text-muted">
        Sold for <Coins amount={value} size={14} /> — they are in your balance.
      </p>
    );
  }

  if (stage === "idle") {
    return (
      <>
        <button
          type="button"
          onClick={() => setStage("armed")}
          className="flex h-12 items-center justify-center gap-2 rounded-xl border border-hairline px-4 text-base font-semibold text-chalk transition-colors hover:border-white/30"
        >
          Sell for <Coins amount={value} size={16} />
        </button>
        {error && <p className="text-center text-xs text-rose-400">{error}</p>}
      </>
    );
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => setStage("idle")}
        disabled={stage === "busy"}
        className="h-12 rounded-xl border border-hairline px-4 text-sm font-medium text-muted transition-colors hover:text-chalk"
      >
        Keep it
      </button>
      <button
        type="button"
        onClick={() => void sell()}
        disabled={stage === "busy"}
        className="flex h-12 flex-1 flex-col items-center justify-center rounded-xl bg-amber-300 px-4 text-black transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
      >
        <span className="flex items-center gap-1.5 text-sm font-semibold">
          {stage === "busy" ? "Selling…" : <>Yes, sell for <Coins amount={value} size={14} /></>}
        </span>
        <span className="text-[10.5px] leading-tight text-black/60">It leaves your vault and can’t be shipped</span>
      </button>
    </div>
  );
}
