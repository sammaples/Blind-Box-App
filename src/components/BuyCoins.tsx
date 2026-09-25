"use client";

import { useState } from "react";
import { COIN_PACKS, topUpCost } from "@/lib/coins";
import { useAccount } from "./AccountBar";
import { Coins } from "./Coin";

/**
 * Buying coins.
 *
 * Two shapes, one component. `shortfall` is the one that matters: somebody is
 * looking at a box they cannot quite afford, and the useful offer is the gap
 * rather than a pack four times its size. Without it, this is the deliberate
 * top-up — packs that map onto the shelf, so nobody has to do arithmetic to
 * work out which one buys the box they were looking at.
 *
 * The price is never sent. The server works it out from the quantity, because
 * a client that names both is a client that can name a thousand coins for a
 * dollar.
 */
export function BuyCoins({
  suggested,
  onBought,
  compact = false,
}: {
  /** The exact amount to offer first, when there is one. */
  suggested?: number;
  onBought?: (balance: number) => void;
  compact?: boolean;
}) {
  const { refresh } = useAccount();
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const buy = async (coins: number) => {
    setBusy(coins);
    setError(null);
    try {
      const res = await fetch("/api/coins", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ coins }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Could not buy those coins");
      await refresh();
      onBought?.(data.coins);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  };

  // The suggested amount leads and is never repeated below it.
  const packs = COIN_PACKS.filter((p) => p !== suggested);

  return (
    <div>
      {suggested !== undefined && (
        <button
          type="button"
          onClick={() => void buy(suggested)}
          disabled={busy !== null}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-300 text-[15px] font-semibold text-black transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
        >
          {busy === suggested ? (
            "Buying…"
          ) : (
            <>
              Buy <Coins amount={suggested} size={16} /> · ${(topUpCost(suggested) / 100).toFixed(2)}
            </>
          )}
        </button>
      )}

      {!compact && (
        <div className={`grid grid-cols-2 gap-2 ${suggested !== undefined ? "mt-2" : ""}`}>
          {packs.map((pack) => (
            <button
              key={pack}
              type="button"
              onClick={() => void buy(pack)}
              disabled={busy !== null}
              className="flex h-12 items-center justify-center gap-2 rounded-xl border border-hairline text-sm text-chalk transition-colors hover:border-white/30 disabled:opacity-50"
            >
              {busy === pack ? (
                "Buying…"
              ) : (
                <>
                  <Coins amount={pack} size={14} />
                  <span className="text-faint">${(topUpCost(pack) / 100).toFixed(2)}</span>
                </>
              )}
            </button>
          ))}
        </div>
      )}

      {error && <p className="mt-2 text-center text-xs text-rose-400">{error}</p>}
    </div>
  );
}
