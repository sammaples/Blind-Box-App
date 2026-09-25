"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAccount } from "./AccountBar";
import { Coins } from "./Coin";

/**
 * Trading a pull in.
 *
 * Two taps, never one. This is the only thing in the app that destroys
 * something somebody owns — the piece leaves the vault and does not come
 * back — and a single-tap control sitting next to a piece you are fond of is
 * a control that will eventually be pressed by accident. The second tap also
 * gives the number somewhere to be read before it is accepted.
 *
 * It asks the server for nothing it already knows: the value is rendered from
 * the same function the route charges by, so the figure on the button is the
 * figure that lands.
 */
export function TradeIn({ orderId, value }: { orderId: string; value: number }) {
  const router = useRouter();
  const { refresh } = useAccount();
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trade = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/trade`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Could not trade that in");
      // The balance lives in the header and the piece lives in a server
      // component, so both have to be told: one refetch, one re-render.
      await refresh();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setArmed(false);
    } finally {
      setBusy(false);
    }
  };

  if (error) {
    return (
      <p className="mt-2 text-xs text-rose-400">
        {error}{" "}
        <button type="button" onClick={() => setError(null)} className="underline">
          Try again
        </button>
      </p>
    );
  }

  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-hairline px-3 py-1.5 text-xs text-muted transition-colors hover:border-white/30 hover:text-chalk"
      >
        Trade in for <Coins amount={value} size={13} />
      </button>
    );
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => void trade()}
        disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-full bg-amber-300 px-3 py-1.5 text-xs font-semibold text-black transition-transform hover:scale-[1.03] active:scale-[0.98] disabled:opacity-50"
      >
        {busy ? "Trading…" : <>Yes, take it for <Coins amount={value} size={13} /></>}
      </button>
      <button
        type="button"
        onClick={() => setArmed(false)}
        disabled={busy}
        className="rounded-full px-2.5 py-1.5 text-xs text-muted transition-colors hover:text-chalk"
      >
        Keep it
      </button>
      <p className="w-full text-[11px] text-faint">
        The piece leaves your vault and cannot be shipped.
      </p>
    </div>
  );
}
