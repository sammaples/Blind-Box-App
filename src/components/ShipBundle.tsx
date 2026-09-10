"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { formatOdds, pieceSubtitle, RARITY_ORDER } from "@/lib/catalog";
import type { Piece } from "@/lib/types";
import { PieceImage } from "./PieceImage";
import { RarityChip } from "./ui";
import {
  AddressFields,
  addressComplete,
  EMPTY_ADDRESS,
  type AddressValues,
} from "./AddressFields";

export interface ShippablePull {
  orderId: string;
  piece: Piece;
  odds: number;
}

/**
 * Picking what goes in the next parcel.
 *
 * Pulls wait here rather than being posted the moment they are opened, which
 * is the whole point: whatever is ticked travels together under one postage.
 * Nothing is pre-ticked — sending is a decision, and a page that arrives with
 * everything selected makes it far too easy to post one piece at a time by
 * accident.
 */
export function ShipBundle({ pulls }: { pulls: ShippablePull[] }) {
  const router = useRouter();
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set());
  const [addressing, setAddressing] = useState(false);
  const [values, setValues] = useState<AddressValues>(EMPTY_ADDRESS);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Rarest first, the same order the shelf and the collection read in.
  const ordered = useMemo(
    () =>
      [...pulls].sort(
        (a, b) =>
          RARITY_ORDER.indexOf(a.piece.rarity) - RARITY_ORDER.indexOf(b.piece.rarity) ||
          a.piece.name.localeCompare(b.piece.name),
      ),
    [pulls],
  );

  const toggle = (orderId: string) => {
    setPicked((current) => {
      const next = new Set(current);
      if (!next.delete(orderId)) next.add(orderId);
      return next;
    });
    setError(null);
  };

  const allPicked = picked.size === ordered.length && ordered.length > 0;
  const toggleAll = () => {
    setPicked(allPicked ? new Set() : new Set(ordered.map((p) => p.orderId)));
    setError(null);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/shipments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderIds: [...picked], shipping: values }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Could not arrange that parcel");

      // The page is server-rendered from the orders, so the bundle appears and
      // the pieces leave this list on the refresh rather than by local edit.
      setPicked(new Set());
      setAddressing(false);
      setValues(EMPTY_ADDRESS);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  if (ordered.length === 0) return null;

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-faint">
          Ready to ship
        </h2>
        <button
          type="button"
          onClick={toggleAll}
          className="text-xs text-muted underline-offset-4 transition-colors hover:text-chalk hover:underline"
        >
          {allPicked ? "Clear selection" : `Select all ${ordered.length}`}
        </button>
      </div>

      <p className="mt-2 max-w-prose text-sm text-muted">
        Everything you send together travels in one parcel, so it costs one
        postage however many pieces are in it. Pieces keep until you are ready —
        there is no hurry to send them.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {ordered.map(({ orderId, piece, odds }) => {
          const on = picked.has(orderId);
          return (
            <button
              key={orderId}
              type="button"
              onClick={() => toggle(orderId)}
              aria-pressed={on}
              className={`group relative flex flex-col rounded-2xl border p-3 text-left transition-colors ${
                on
                  ? "border-white/45 bg-white/[0.06]"
                  : "border-hairline bg-ink-card hover:border-white/25"
              }`}
            >
              <span
                aria-hidden
                className={`absolute right-3 top-3 z-10 grid size-5 place-items-center rounded-md border text-[11px] font-bold transition-colors ${
                  on ? "border-chalk bg-chalk text-ink" : "border-white/30 text-transparent"
                }`}
              >
                ✓
              </span>
              <span
                className="grid h-24 place-items-center rounded-xl"
                style={{
                  background: `radial-gradient(120% 90% at 50% 12%, ${piece.palette.wash}, #0b0b10 78%)`,
                }}
              >
                <PieceImage piece={piece} className="h-20 w-auto" thumb />
              </span>
              <span className="mt-2.5 truncate text-sm font-semibold">{piece.name}</span>
              <span className="mt-0.5 truncate text-xs text-faint">
                {pieceSubtitle(piece)}
              </span>
              <span className="mt-2 flex flex-wrap items-center gap-2">
                <RarityChip rarity={piece.rarity} />
                <span className="font-mono text-[11px] text-muted">{formatOdds(odds)}</span>
              </span>
            </button>
          );
        })}
      </div>

      <AnimatePresence initial={false}>
        {picked.size > 0 && (
          <motion.div
            key="tray"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="sticky bottom-4 z-20 mt-5"
          >
            <div className="rounded-2xl border border-hairline bg-ink-raised/95 p-4 backdrop-blur-xl">
              {!addressing ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm">
                    <span className="font-semibold">{picked.size}</span>{" "}
                    {picked.size === 1 ? "piece" : "pieces"} in this parcel
                    <span className="text-faint"> · one postage</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => setAddressing(true)}
                    className="rounded-xl bg-chalk px-5 py-2.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.02] active:scale-[0.99]"
                  >
                    Ship {picked.size} together
                  </button>
                </div>
              ) : (
                <form onSubmit={submit}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-faint">
                      Where it goes
                    </p>
                    <p className="text-xs text-muted">
                      {picked.size} {picked.size === 1 ? "piece" : "pieces"} · one parcel
                    </p>
                  </div>
                  <div className="mt-4">
                    <AddressFields values={values} onChange={setValues} disabled={busy} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setAddressing(false)}
                      disabled={busy}
                      className="rounded-xl border border-hairline px-5 py-3 text-sm font-medium text-muted transition-colors hover:border-white/30 hover:text-chalk disabled:opacity-60"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={busy || !addressComplete(values)}
                      className="flex-1 rounded-xl bg-chalk py-3 text-sm font-semibold text-ink transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                    >
                      {busy ? "Packing…" : "Send this parcel"}
                    </button>
                  </div>
                  {error && (
                    <p className="mt-3 text-center text-xs text-rose-400">{error}</p>
                  )}
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
