"use client";

import { useEffect, useState } from "react";
import type { CoinEntry } from "@/lib/types";
import { useAccount } from "./AccountBar";
import { BuyCoins } from "./BuyCoins";
import { Coins } from "./Coin";

const REASON_LABEL: Record<string, string> = {
  trade_in: "Traded in",
  purchase: "Bought coins",
  spend: "Opened a box",
  refund: "Refunded",
  grant: "Added by the shop",
};

/**
 * The balance, where it came from, and how to get more.
 *
 * The history is the point of this panel, not the number. A balance on its
 * own is a figure somebody either accepts or argues with; a list of what
 * moved it is a figure they can check. It is the same reason the ledger
 * exists in the database rather than a bare column on the account.
 */
export function CoinWallet() {
  const { account } = useAccount();
  const [history, setHistory] = useState<CoinEntry[]>([]);
  const [open, setOpen] = useState(false);

  const coins = account?.coins ?? 0;

  useEffect(() => {
    if (!account) return;
    let live = true;
    void fetch("/api/coins")
      .then((r) => r.json())
      .then((d) => {
        if (live) setHistory(d.history ?? []);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
    // Refetches when the balance moves, which is the only thing that can add
    // a row — so the list never shows a total the entries do not add up to.
  }, [account, coins]);

  if (!account) return null;

  return (
    <section id="coins" className="mt-10 scroll-mt-24">
      <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-faint">Coins</h2>

      <div className="mt-4 rounded-2xl border border-hairline bg-ink-card p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="text-3xl font-semibold">
            <Coins amount={coins} size={26} />
          </p>
          <p className="text-xs text-faint">
            One coin is one dollar. Trade a piece in, or buy more.
          </p>
        </div>

        <div className="mt-5">
          <BuyCoins />
        </div>

        {history.length > 0 && (
          <div className="mt-5 border-t border-hairline pt-4">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="text-xs text-muted transition-colors hover:text-chalk"
            >
              {open ? "Hide history" : `History · ${history.length} entries`}
            </button>

            {open && (
              <ul className="mt-3 space-y-2">
                {history.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-baseline justify-between gap-3 text-xs"
                  >
                    <span className="min-w-0 flex-1 truncate text-muted">
                      {REASON_LABEL[entry.reason] ?? entry.reason}
                      {entry.note && <span className="text-faint"> · {entry.note}</span>}
                    </span>
                    <span
                      className={`shrink-0 font-mono tabular-nums ${
                        entry.delta >= 0 ? "text-emerald-400" : "text-muted"
                      }`}
                    >
                      {entry.delta >= 0 ? "+" : ""}
                      {entry.delta}
                    </span>
                    <span className="w-12 shrink-0 text-right font-mono text-faint tabular-nums">
                      {entry.balanceAfter}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
