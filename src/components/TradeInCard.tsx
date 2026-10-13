import Link from "next/link";

/** The way into the trade-in, under the daily spin. */
export function TradeInCard() {
  return (
    <Link
      href="/rewards/trade"
      className="group relative flex items-center gap-4 overflow-hidden rounded-3xl border border-cyan-300/25 p-5 transition-transform active:scale-[0.99]"
      style={{ background: "radial-gradient(120% 140% at 0% 0%, rgba(56,214,240,0.24), rgba(30,90,160,0.14) 55%, rgba(19,19,25,1) 100%)" }}
    >
      <MiniPool />
      <span className="min-w-0 flex-1">
        <span className="block text-[18px] font-semibold tracking-tight">Trade-in</span>
        <span className="mt-0.5 block text-[13px] text-muted">3 pieces → 1 Bronze box</span>
      </span>
      <span className="shrink-0 rounded-full bg-cyan-300 px-3 py-1.5 text-[12px] font-semibold text-[#03222e]">Trade</span>
    </Link>
  );
}

/** A little whirlpool, always turning. */
function MiniPool() {
  const arm = (k: number) => {
    let d = "";
    for (let s = 0; s <= 24; s++) {
      const t = s / 24;
      const r = 2 + 15 * Math.pow(1 - t, 1.3);
      const a = (k / 4) * Math.PI * 2 - t * Math.PI * 2.2;
      d += `${s ? "L" : "M"}${(20 + r * Math.cos(a)).toFixed(2)} ${(20 + r * Math.sin(a)).toFixed(2)}`;
    }
    return d;
  };
  return (
    <span className="relative grid size-14 shrink-0 place-items-center">
      <svg viewBox="0 0 40 40" className="size-14 drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]" aria-hidden>
        <defs>
          <radialGradient id="mini-pool" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#01131f" />
            <stop offset="0.45" stopColor="#0a6788" />
            <stop offset="0.85" stopColor="#3fcfe3" />
            <stop offset="1" stopColor="#bff8fc" />
          </radialGradient>
        </defs>
        <circle cx="20" cy="20" r="19.5" fill="#c9eef4" />
        <circle cx="20" cy="20" r="17.5" fill="url(#mini-pool)" />
        <g className="origin-center animate-[spin_5s_linear_infinite]" style={{ transformBox: "view-box" }}>
          {[0, 1, 2, 3].map((k) => (
            <path key={k} d={arm(k)} stroke="#e8feff" strokeOpacity="0.55" strokeWidth="1.1" fill="none" strokeLinecap="round" />
          ))}
        </g>
      </svg>
    </span>
  );
}
