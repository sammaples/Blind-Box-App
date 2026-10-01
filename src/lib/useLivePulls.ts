"use client";

import { useEffect, useState } from "react";
import type { Pull } from "./types";

/** How often an open shop asks for new pulls. */
const POLL_MS = 8000;

/** Same pulls in the same order, box by box. */
function same(a: Record<string, Pull[]>, b: Record<string, Pull[]>): boolean {
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;
  return keys.every((k) => {
    const x = a[k];
    const y = b[k];
    return !!y && x.length === y.length && x.every((p, i) => p.orderId === y[i].orderId);
  });
}

/**
 * The recent-pulls feed, kept current while the page is open.
 *
 * Starts from what the server rendered, so the first frame is already right
 * and nothing pops in after load, then asks again every few seconds. It only
 * asks while the tab is on screen — a phone in a pocket with the shop open
 * would otherwise poll all night — and asks at once on coming back, so
 * returning to the app shows what happened while it was away rather than
 * waiting out the clock.
 *
 * An answer that matches what is already showing is dropped rather than set,
 * so the row only re-renders when somebody has actually pulled something.
 */
export function useLivePulls(initial: Record<string, Pull[]>): Record<string, Pull[]> {
  const [pulls, setPulls] = useState(initial);

  useEffect(() => {
    let inflight: AbortController | null = null;

    const refresh = async () => {
      if (document.visibilityState !== "visible") return;
      inflight?.abort();
      const ctrl = new AbortController();
      inflight = ctrl;
      try {
        const res = await fetch("/api/pulls", { signal: ctrl.signal });
        if (!res.ok) return;
        const data: { pulls?: Record<string, Pull[]> } = await res.json();
        if (ctrl.signal.aborted || !data.pulls) return;
        const next = data.pulls;
        setPulls((prev) => (same(prev, next) ? prev : next));
      } catch {
        // Offline, or aborted. The row keeps what it has; the next tick retries.
      }
    };

    const timer = setInterval(refresh, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(timer);
      inflight?.abort();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return pulls;
}
