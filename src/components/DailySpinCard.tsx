"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { untilLabel } from "@/lib/spin";
import { useAccount } from "./AccountBar";

/**
 * The way into the daily spin, top of the Rewards tab.
 *
 * Says whether today's spin is still there to take, so somebody who has
 * already spun sees when the next one opens without tapping through.
 */
export function DailySpinCard() {
  const { account, loading } = useAccount();
  const [nextAt, setNextAt] = useState<number | null>(null);
  const [available, setAvailable] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (loading) return;
    let live = true;
    void fetch("/api/rewards/spin")
      .then((r) => r.json())
      .then((d: { available?: boolean; nextAt?: string }) => {
        if (!live) return;
        setAvailable(d.available !== false);
        if (d.nextAt) setNextAt(new Date(d.nextAt).getTime());
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [loading, account?.id]);

  useEffect(() => {
    if (available) return;
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, [available]);

  return (
    <Link
      href="/rewards/spin"
      className="group relative flex items-center gap-4 overflow-hidden rounded-3xl border border-amber-300/25 p-5 transition-transform active:scale-[0.99]"
      style={{ background: "radial-gradient(120% 140% at 0% 0%, rgba(245,197,66,0.22), rgba(91,108,255,0.12) 55%, rgba(19,19,25,1) 100%)" }}
    >
      <MiniWheel spinning={available} />
      <span className="min-w-0 flex-1">
        <span className="block text-[18px] font-semibold tracking-tight">Daily spin</span>
        <span className="mt-0.5 block text-[13px] text-muted">Up to 1,500 coins, free</span>
      </span>
      <span
        className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold ${
          available ? "bg-amber-300 text-black" : "bg-white/[0.08] text-muted"
        }`}
      >
        {available ? "Spin" : nextAt ? untilLabel(nextAt - now) : "Tomorrow"}
      </span>
    </Link>
  );
}

/** A small wheel, turning slowly while there is a spin to take. */
function MiniWheel({ spinning }: { spinning: boolean }) {
  const colours = ["#f2b42a", "#2b3150", "#363d63", "#2b3150", "#3f86f5", "#363d63", "#2b3150", "#363d63"];
  return (
    <span className="relative grid size-14 shrink-0 place-items-center">
      <svg
        viewBox="0 0 40 40"
        className={`size-14 drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] ${spinning ? "animate-[spin_6s_linear_infinite]" : ""}`}
        aria-hidden
      >
        <circle cx="20" cy="20" r="19.5" fill="#c9ccd5" />
        {colours.map((c, i) => {
          const a0 = (i * 45 - 22.5) * (Math.PI / 180);
          const a1 = (i * 45 + 22.5) * (Math.PI / 180);
          const p = (a: number) => `${20 + 17.5 * Math.sin(a)} ${20 - 17.5 * Math.cos(a)}`;
          return <path key={i} d={`M20 20 L${p(a0)} A17.5 17.5 0 0 1 ${p(a1)} Z`} fill={c} />;
        })}
        <circle cx="20" cy="20" r="5" fill="#eceef3" />
      </svg>
      <span aria-hidden className="absolute -top-1 left-1/2 h-0 w-0 -translate-x-1/2 border-x-[5px] border-t-[8px] border-x-transparent border-t-white" />
    </span>
  );
}
