"use client";

import { animate, motion, useMotionValue, useTransform, type MotionValue } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_LINE, LINES, type LineId } from "@/lib/lines";
import { TRADE_IN_COUNT, tradeInBox } from "@/lib/tradeIn";
import type { Piece } from "@/lib/types";
import { useAccount } from "./AccountBar";
import { isPrinted } from "./BoxPrint";
import { PieceImage } from "./PieceImage";
import { ProductBox } from "./ProductBox";

/**
 * The trade-in: three pieces of one collection go into the whirlpool and a
 * Bronze box of that collection spins back out.
 *
 * The water is always turning. Picking a piece drops it in to float on the
 * current; Combine speeds the whirlpool up until the pieces are pulled down
 * the middle, then a flash, and the box comes up out of the eye. The trade
 * itself happens on the server while the water spins, so there is no wait
 * that looks like a wait.
 */

export interface TradeablePull {
  orderId: string;
  piece: Piece;
}

type Phase = "pick" | "swirl" | "flash" | "out";

/** Degrees a second the water turns at rest, and flat out. */
const BASE_SPEED = 26;
const TOP_SPEED = 1150;
/** How long the pieces take to go down. */
const SWIRL_MS = 2800;
/** How far out the pieces float, as a share of the pool's width. */
const SLOT_R = 27;

const C = 200; // centre of the 400 × 400 drawing
const WATER_R = 184;

/** One arm of the swirl: a spiral from the rim down into the eye. */
function spiral(theta0: number, turns: number, steps = 64): string {
  let d = "";
  for (let k = 0; k <= steps; k++) {
    const t = k / steps;
    const r = 10 + (WATER_R - 10) * Math.pow(1 - t, 1.3);
    // The angle falls as the arm goes in, so turning the drawing clockwise
    // reads as water running down the middle rather than out of it.
    const a = theta0 - t * turns * Math.PI * 2;
    d += `${k ? "L" : "M"}${(C + r * Math.cos(a)).toFixed(1)} ${(C + r * Math.sin(a)).toFixed(1)}`;
  }
  return d;
}

const ARMS = Array.from({ length: 6 }, (_, i) => spiral((i / 6) * Math.PI * 2, 1.15));
const FOAM = Array.from({ length: 4 }, (_, i) => spiral((i / 4) * Math.PI * 2 + 0.5, 0.8));

/** Specks drifting round and down, each on its own orbit. */
const SPECKS = Array.from({ length: 22 }, (_, i) => ({
  a: (i * 137.5 * Math.PI) / 180,
  r: 30 + ((i * 53) % 150),
  size: 1.2 + ((i * 7) % 5) * 0.45,
  alpha: 0.35 + ((i * 11) % 6) * 0.1,
}));

/** Drops thrown out when the box comes up. */
const DROPS = Array.from({ length: 16 }, (_, i) => {
  const a = (i / 16) * Math.PI * 2 + (i % 3) * 0.2;
  const d = 30 + ((i * 37) % 26);
  return { x: Math.cos(a) * d, y: Math.sin(a) * d * 0.8 - 8, s: 4 + (i % 4) * 2, delay: (i % 5) * 0.025 };
});

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function TradeIn({ pulls, signedIn }: { pulls: TradeablePull[]; signedIn: boolean }) {
  const router = useRouter();
  const { signIn } = useAccount();
  const sound = useWaterSound();

  const [gone, setGone] = useState<ReadonlySet<string>>(new Set());
  const live = useMemo(() => pulls.filter((p) => !gone.has(p.orderId)), [pulls, gone]);
  const counts = useMemo(() => {
    const out = new Map<LineId, number>();
    for (const p of live) out.set(p.piece.line, (out.get(p.piece.line) ?? 0) + 1);
    return out;
  }, [live]);

  // Start on the collection with the most to trade.
  const [line, setLine] = useState<LineId>(() => {
    let best: LineId = DEFAULT_LINE;
    let most = 0;
    for (const l of LINES) {
      const n = pulls.filter((p) => p.piece.line === l.id).length;
      if (n > most) [best, most] = [l.id, n];
    }
    return best;
  });
  const [picked, setPicked] = useState<string[]>([]);
  const [phase, setPhase] = useState<Phase>("pick");
  const [error, setError] = useState<string | null>(null);
  const [made, setMade] = useState<{ orderId: string; line: LineId } | null>(null);

  const shown = live.filter((p) => p.piece.line === line);
  const byId = new Map(live.map((p) => [p.orderId, p]));
  const busy = phase === "swirl" || phase === "flash";
  const ready = picked.length === TRADE_IN_COUNT && phase === "pick";

  /* --- the water: one clock drives the swirl, the specks and the pieces --- */
  const orbit = useMotionValue(0);
  const speed = useMotionValue(BASE_SPEED);
  const pull = useMotionValue(0);
  const specks = useRef<(SVGCircleElement | null)[]>([]);
  const speckState = useRef(SPECKS.map((s) => ({ a: s.a, r: s.r })));

  useEffect(() => {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let last = performance.now();
    const frame = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      const v = speed.get() * (reduced ? 0.25 : 1);
      orbit.set(orbit.get() + v * dt);
      // Specks: faster the nearer the eye, and drawn in as they go round.
      const rush = v / BASE_SPEED;
      speckState.current.forEach((s, i) => {
        s.a += ((v * Math.PI) / 180) * dt * Math.min(4, Math.sqrt(WATER_R / Math.max(14, s.r)));
        s.r -= dt * (6 + rush * 3.2);
        if (s.r < 12) {
          s.r = WATER_R - 4 - (i % 5) * 6;
          s.a = Math.random() * Math.PI * 2;
        }
        const el = specks.current[i];
        if (el) {
          el.setAttribute("cx", (C + s.r * Math.cos(s.a)).toFixed(1));
          el.setAttribute("cy", (C + s.r * Math.sin(s.a)).toFixed(1));
          el.setAttribute("opacity", String(SPECKS[i].alpha * Math.min(1, (s.r - 12) / 40)));
        }
      });
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [orbit, speed]);

  const armsTurn = useTransform(orbit, (o) => `rotate(${o} ${C} ${C})`);
  const foamTurn = useTransform(orbit, (o) => `rotate(${o * 1.6 + 30} ${C} ${C})`);
  const sheenTurn = useTransform(orbit, (o) => o * 0.45);
  const eyeScale = useTransform(speed, [BASE_SPEED, TOP_SPEED], [1, 1.55]);
  const glow = useTransform(speed, [BASE_SPEED, TOP_SPEED], [0.15, 0.95]);

  /* --- picking --- */
  const toggle = (orderId: string) => {
    if (phase !== "pick") return;
    setError(null);
    if (picked.includes(orderId)) {
      setPicked(picked.filter((id) => id !== orderId));
      return;
    }
    if (picked.length >= TRADE_IN_COUNT) return;
    sound.unlock();
    sound.plip();
    setPicked([...picked, orderId]);
    // The last one in: back up to the pool, to watch it land and press Combine.
    if (picked.length + 1 === TRADE_IN_COUNT) showPool();
  };

  const showPool = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const switchLine = (id: LineId) => {
    if (busy || id === line) return;
    setLine(id);
    setPicked([]);
    setError(null);
  };

  /* --- combining --- */
  const combine = async () => {
    if (!ready) return;
    const ids = [...picked];
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const swirlMs = reduced ? 900 : SWIRL_MS;
    showPool();
    sound.unlock();
    sound.whoosh(swirlMs / 1000);
    setError(null);
    setPhase("swirl");
    animate(speed, TOP_SPEED, { duration: swirlMs / 1000, ease: [0.45, 0, 0.85, 0.5] });
    animate(pull, 1, { duration: swirlMs / 1000, ease: [0.6, 0, 0.8, 0.3] });

    const request = fetch("/api/rewards/trade", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ orderIds: ids, line }),
    })
      .then(async (r) => ({ ok: r.ok, data: (await r.json().catch(() => ({}))) as { error?: string; order?: { id: string } } }))
      .catch(() => ({ ok: false, data: { error: "Couldn’t reach the shop. Try again." } as { error?: string; order?: { id: string } } }));
    const [res] = await Promise.all([request, wait(swirlMs)]);

    if (!res.ok || !res.data.order) {
      // Nothing was traded: the pieces come back up and the water calms.
      sound.stop();
      animate(pull, 0, { type: "spring", stiffness: 110, damping: 15 });
      animate(speed, BASE_SPEED, { duration: 1.2, ease: "easeOut" });
      setPhase("pick");
      setError(res.data.error ?? "Couldn’t trade those in. Try again.");
      return;
    }

    setMade({ orderId: res.data.order.id, line });
    setGone((g) => new Set([...g, ...ids]));
    sound.pop();
    setPhase("flash");
    await wait(reduced ? 150 : 420);
    setPicked([]);
    pull.set(0);
    setPhase("out");
    animate(speed, BASE_SPEED, { duration: 2.6, ease: "easeOut" });
    router.refresh();
  };

  const again = () => {
    setMade(null);
    setPhase("pick");
  };

  const box = made ? tradeInBox(made.line) : undefined;
  const lineName = LINES.find((l) => l.id === line)?.name ?? "";
  const withPieces = LINES.filter((l) => (counts.get(l.id) ?? 0) > 0);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center px-5 pb-10 pt-4">
      <div className="flex w-full items-center justify-between">
        <Link href="/rewards" className="text-[13px] font-medium text-muted transition-colors hover:text-chalk">
          ← Rewards
        </Link>
      </div>
      <h1
        className="shimmer-text shimmer-slow mt-2 w-fit text-3xl font-semibold tracking-tight"
        style={{ backgroundImage: "linear-gradient(100deg, #3fb7d6 0%, #8ff0ff 28%, #f2feff 48%, #8ff0ff 68%, #3fb7d6 100%)" }}
      >
        Trade-in
      </h1>
      <p className="mt-1 text-[13px] text-muted">3 of one collection → 1 Bronze box</p>

      {/* The whirlpool. */}
      <div className="relative mt-5 aspect-square w-full max-w-[min(19rem,calc(100svh-65px-4.25rem-env(safe-area-inset-bottom)-18.5rem))]">
        {/* Light on the water, brighter as it speeds up. */}
        <motion.div
          aria-hidden
          className="absolute -inset-8 rounded-full blur-3xl"
          style={{ opacity: glow, background: "radial-gradient(circle, #38d6f0aa, transparent 68%)" }}
        />

        <svg viewBox="0 0 400 400" className="absolute inset-0 size-full" aria-hidden>
          <defs>
            <radialGradient id="wp-water" cx="50%" cy="50%" r="50%">
              <stop offset="0" stopColor="#01131f" />
              <stop offset="0.16" stopColor="#03304a" />
              <stop offset="0.42" stopColor="#0a6788" />
              <stop offset="0.72" stopColor="#1aa9c4" />
              <stop offset="0.93" stopColor="#6fe1ec" />
              <stop offset="1" stopColor="#bff8fc" />
            </radialGradient>
            <linearGradient id="wp-rim" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#f4feff" />
              <stop offset="0.45" stopColor="#9fdbe7" />
              <stop offset="1" stopColor="#2f7f95" />
            </linearGradient>
            <radialGradient id="wp-eye" cx="50%" cy="50%" r="50%">
              <stop offset="0" stopColor="#000a12" />
              <stop offset="0.55" stopColor="#011c2c" stopOpacity="0.85" />
              <stop offset="1" stopColor="#022a40" stopOpacity="0" />
            </radialGradient>
            {/* The arms fade out as they go down, rather than drawing white into the dark. */}
            <radialGradient id="wp-fade" cx="50%" cy="50%" r="50%">
              <stop offset="0.08" stopColor="#000" />
              <stop offset="0.4" stopColor="#fff" stopOpacity="0.7" />
              <stop offset="1" stopColor="#fff" />
            </radialGradient>
            <mask id="wp-mask">
              <circle cx={C} cy={C} r={WATER_R} fill="url(#wp-fade)" />
            </mask>
            <clipPath id="wp-clip">
              <circle cx={C} cy={C} r={WATER_R} />
            </clipPath>
          </defs>

          {/* The basin's rim, then the water inside it. */}
          <circle cx={C} cy={C} r={198} fill="url(#wp-rim)" />
          <circle cx={C} cy={C} r={190} fill="#0b4d63" />
          <circle cx={C} cy={C} r={WATER_R} fill="url(#wp-water)" />

          <g clipPath="url(#wp-clip)">
            <g mask="url(#wp-mask)">
              <motion.g transform={armsTurn}>
                {ARMS.map((d, i) => (
                  <g key={i}>
                    <path d={d} stroke="#c8fbff" strokeOpacity="0.1" strokeWidth="16" fill="none" strokeLinecap="round" />
                    <path d={d} stroke="#e8feff" strokeOpacity="0.42" strokeWidth="2.6" fill="none" strokeLinecap="round" />
                  </g>
                ))}
              </motion.g>
              <motion.g transform={foamTurn}>
                {FOAM.map((d, i) => (
                  <path key={i} d={d} stroke="#ffffff" strokeOpacity="0.3" strokeWidth="1.4" strokeDasharray="3 9" fill="none" strokeLinecap="round" />
                ))}
              </motion.g>
            </g>
            {SPECKS.map((s, i) => (
              <circle
                key={i}
                ref={(el) => {
                  specks.current[i] = el;
                }}
                cx={C + s.r * Math.cos(s.a)}
                cy={C + s.r * Math.sin(s.a)}
                r={s.size}
                fill="#f2feff"
                opacity={s.alpha}
              />
            ))}
          </g>

          {/* Light caught on the rim. */}
          <path d="M62 112A162 162 0 0 1 150 44" stroke="#fff" strokeOpacity="0.7" strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d="M318 300A150 150 0 0 1 270 342" stroke="#fff" strokeOpacity="0.25" strokeWidth="3" strokeLinecap="round" fill="none" />
        </svg>

        {/* A shimmer turning slowly over the water: the caustics. */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-[4%] rounded-full opacity-70 mix-blend-screen blur-[6px]"
          style={{
            rotate: sheenTurn,
            background:
              "conic-gradient(from 0deg, transparent 0deg, #9ff6ff33 30deg, transparent 70deg, transparent 140deg, #ffffff26 175deg, transparent 215deg, transparent 280deg, #9ff6ff2e 310deg, transparent 350deg)",
          }}
        />

        {/* The eye, opening wider as the water speeds up. */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-[38%] top-[38%] size-[24%] rounded-full"
          style={{ scale: eyeScale, background: "radial-gradient(circle, #000a12 0%, #011c2ccc 50%, transparent 72%)" }}
        />

        {/* The pieces floating on it, or the places they go. */}
        {(phase === "pick" || phase === "swirl") &&
          Array.from({ length: TRADE_IN_COUNT }, (_, i) => {
            const pick = picked[i] ? byId.get(picked[i]) : undefined;
            return (
              <Floater
                key={i}
                i={i}
                orbit={orbit}
                pull={pull}
                piece={pick?.piece}
                onRemove={pick ? () => toggle(pick.orderId) : undefined}
              />
            );
          })}

        {/* The flash as they go under. */}
        {phase === "flash" && (
          <>
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{ background: "radial-gradient(circle, #ffffff 0%, #c9fbff 30%, #5fe3f7aa 55%, transparent 72%)" }}
              initial={{ opacity: 0, scale: 0.2 }}
              animate={{ opacity: [0, 1, 0.9], scale: [0.2, 1.15, 1.3] }}
              transition={{ duration: 0.42, ease: "easeOut" }}
            />
            <motion.div
              aria-hidden
              className="pointer-events-none fixed inset-0 z-40 bg-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.75, 0] }}
              transition={{ duration: 0.6, times: [0, 0.3, 1] }}
            />
          </>
        )}

        {/* And the box, coming up out of the eye. */}
        {phase === "out" && box && (
          <>
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{ background: "radial-gradient(circle, #ffffffdd 0%, #a8f6ff88 35%, transparent 70%)" }}
              initial={{ opacity: 1, scale: 1.3 }}
              animate={{ opacity: 0, scale: 1.6 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            />
            {[0, 0.35, 0.7].map((d) => (
              <motion.div
                key={d}
                aria-hidden
                className="pointer-events-none absolute left-[30%] top-[30%] size-[40%] rounded-full border-2 border-white/70"
                initial={{ scale: 0.2, opacity: 0.9 }}
                animate={{ scale: 2.1, opacity: 0 }}
                transition={{ duration: 1.5, delay: d, ease: "easeOut" }}
              />
            ))}
            <div className="pointer-events-none absolute left-1/2 top-1/2">
              {DROPS.map((p, i) => (
                <motion.span
                  key={i}
                  aria-hidden
                  className="absolute rounded-full bg-[#dffcff]"
                  style={{ width: p.s, height: p.s, marginLeft: -p.s / 2, marginTop: -p.s / 2 }}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 0.6 }}
                  animate={{ x: p.x * 2.6, y: [0, p.y * 2.6 - 46, p.y * 2.6 + 34], opacity: [1, 1, 0], scale: 1 }}
                  transition={{ duration: 0.9, delay: 0.05 + p.delay, ease: "easeOut" }}
                />
              ))}
            </div>
            <div className="absolute inset-0 grid place-items-center">
              <motion.div
                initial={{ scale: 0.05, rotate: -900, opacity: 0, y: 10 }}
                animate={{ scale: 1, rotate: 0, opacity: 1, y: -6 }}
                transition={{ duration: 1.25, ease: [0.16, 1, 0.3, 1] }}
                className="relative"
              >
                <span
                  aria-hidden
                  className="absolute -bottom-3 left-1/2 h-4 w-[120%] -translate-x-1/2 rounded-[50%] bg-black/45 blur-md"
                />
                <ProductBox accent={box.accent} printed={isPrinted(box.id)} line={box.line} width={84} glint />
              </motion.div>
            </div>
          </>
        )}
      </div>

      {/* Under the pool: what to press. */}
      <div className="mt-6 flex min-h-[5.25rem] w-full flex-col items-center text-center">
        {phase === "out" && made && box ? (
          <motion.div
            className="flex w-full flex-col items-center"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.4 }}
          >
            <p className="text-lg font-semibold">
              {LINES.find((l) => l.id === made.line)?.name} {box.name}
            </p>
            <div className="mt-3 flex w-full gap-2">
              <button
                type="button"
                onClick={again}
                className="flex-1 rounded-full border border-hairline px-5 py-3.5 text-[15px] font-semibold text-chalk transition-colors hover:bg-white/[0.05]"
              >
                Trade more
              </button>
              <Link
                href={`/open/${made.orderId}`}
                className="flex-1 rounded-full px-5 py-3.5 text-[15px] font-semibold text-[#03222e]"
                style={{ background: "linear-gradient(180deg, #e9fdff 0%, #8eeaf6 55%, #45c4dc 100%)" }}
              >
                Open it
              </Link>
            </div>
          </motion.div>
        ) : !signedIn ? (
          <button
            type="button"
            onClick={() => signIn("Sign in to trade pieces in for a box.")}
            className="w-full rounded-full px-5 py-3.5 text-[15px] font-semibold text-[#03222e]"
            style={{ background: "linear-gradient(180deg, #e9fdff 0%, #8eeaf6 55%, #45c4dc 100%)" }}
          >
            Sign in to trade
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => void combine()}
              disabled={!ready}
              className={`relative w-full overflow-hidden rounded-full px-5 py-3.5 text-[16px] font-bold tracking-wide transition-[transform,opacity] active:scale-[0.98] ${
                ready ? "text-[#03222e]" : "text-[#03222e]/60 opacity-50"
              }`}
              style={{
                background: "linear-gradient(180deg, #e9fdff 0%, #8eeaf6 55%, #45c4dc 100%)",
                boxShadow: ready ? "0 8px 28px rgba(56,214,240,0.45), inset 0 -2px 4px rgba(0,60,80,0.25)" : undefined,
              }}
            >
              {busy ? "Combining…" : "Combine"}
            </button>
            <p className="mt-2 text-[13px] text-muted">
              {busy ? " " : `${picked.length} of ${TRADE_IN_COUNT} picked`}
            </p>
          </>
        )}
        {error && <p className="mt-1 text-xs text-rose-400">{error}</p>}
      </div>

      {/* The vault, to pick from. */}
      {signedIn && phase !== "out" && (
        <section className={`mt-4 w-full transition-opacity ${busy ? "pointer-events-none opacity-40" : ""}`}>
          {withPieces.length > 1 && (
            <div className="scroll-slim -mx-5 mb-4 flex gap-2 overflow-x-auto px-5 pb-1">
              {withPieces.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => switchLine(l.id)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
                    l.id === line ? "bg-chalk text-ink" : "bg-white/[0.07] text-muted hover:text-chalk"
                  }`}
                >
                  {l.name} <span className="opacity-60">{counts.get(l.id)}</span>
                </button>
              ))}
            </div>
          )}

          {live.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-hairline p-8 text-center">
              <p className="text-sm text-muted">Nothing in your vault to trade.</p>
              <Link href="/" className="mt-3 inline-block text-sm font-semibold text-chalk underline-offset-4 hover:underline">
                Get a box
              </Link>
            </div>
          ) : shown.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">No {lineName} pieces in your vault.</p>
          ) : (
            <ul className="grid grid-cols-3 gap-2">
              {shown.map(({ orderId, piece }) => {
                const n = picked.indexOf(orderId);
                const on = n >= 0;
                const full = !on && picked.length >= TRADE_IN_COUNT;
                return (
                  <li key={orderId}>
                    <button
                      type="button"
                      onClick={() => toggle(orderId)}
                      disabled={full}
                      aria-pressed={on}
                      className={`relative flex w-full flex-col items-center rounded-2xl border p-2 text-left transition-[border-color,opacity,transform] active:scale-[0.97] ${
                        on ? "border-cyan-300 bg-cyan-300/[0.08]" : "border-hairline bg-ink-card"
                      } ${full ? "opacity-40" : ""}`}
                    >
                      <span
                        className="grid h-24 w-full place-items-center rounded-xl"
                        style={{ background: `radial-gradient(120% 90% at 50% 12%, ${piece.palette.wash}, #0b0b10 78%)` }}
                      >
                        <PieceImage piece={piece} className="h-20 w-auto drop-shadow-[0_6px_12px_rgba(0,0,0,0.5)]" thumb />
                      </span>
                      <span className="mt-1.5 block w-full truncate text-center text-[12px] font-medium">{piece.name}</span>
                      {on && (
                        <span className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-cyan-300 text-[12px] font-bold text-[#03222e]">
                          {n + 1}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

/**
 * A slot on the water: a piece riding the current, or a ring where one goes.
 * Its place comes from the same clock as the swirl, so it moves with the water;
 * `pull` takes it from floating (0) to gone down the middle (1).
 */
function Floater({
  i,
  orbit,
  pull,
  piece,
  onRemove,
}: {
  i: number;
  orbit: MotionValue<number>;
  pull: MotionValue<number>;
  piece?: Piece;
  onRemove?: () => void;
}) {
  const angle = (o: number, p: number) => ((-90 + i * 120 + o * 0.55 + p * 260) * Math.PI) / 180;
  const radius = (p: number) => SLOT_R * (1 - p);
  const left = useTransform(() => `${50 + radius(pull.get()) * Math.cos(angle(orbit.get(), pull.get()))}%`);
  const top = useTransform(
    () => `${50 + radius(pull.get()) * Math.sin(angle(orbit.get(), pull.get())) + Math.sin(orbit.get() * 0.08 + i * 2) * 0.9}%`,
  );
  const scale = useTransform(pull, [0, 0.75, 1], [1, 0.45, 0]);
  const rotate = useTransform(pull, (p) => p * 540 + Math.sin(i * 2) * 8);
  const opacity = useTransform(pull, [0, 0.8, 1], [1, 0.85, 0]);

  return (
    <motion.div
      className="absolute size-[25%] -translate-x-1/2 -translate-y-1/2"
      style={{ left, top, scale, rotate, opacity }}
    >
      {piece ? (
        <motion.button
          key={piece.id}
          type="button"
          onClick={onRemove}
          aria-label={`Take ${piece.name} out`}
          className="relative grid size-full place-items-center"
          initial={{ scale: 0, y: -40, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 14 }}
        >
          {/* The ripple it makes landing. */}
          <motion.span
            aria-hidden
            className="absolute inset-[8%] rounded-full border-2 border-white/80"
            initial={{ scale: 0.4, opacity: 0.9 }}
            animate={{ scale: 1.7, opacity: 0 }}
            transition={{ duration: 0.9, delay: 0.12, ease: "easeOut" }}
          />
          <span aria-hidden className="absolute bottom-[4%] h-[18%] w-[78%] rounded-[50%] bg-[#012232]/60 blur-[3px]" />
          <PieceImage piece={piece} className="relative h-full w-auto drop-shadow-[0_6px_10px_rgba(0,20,30,0.6)]" thumb />
        </motion.button>
      ) : (
        <span className="grid size-full place-items-center rounded-full border-2 border-dashed border-white/35 bg-white/[0.06]">
          <svg viewBox="0 0 24 24" aria-hidden className="size-1/3 text-white/55" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M12 6v12M6 12h12" />
          </svg>
        </span>
      )}
    </motion.div>
  );
}

/* ------------------------------- sound ------------------------------- */

/** Water noises, made on the spot: a plip as a piece goes in, a rising rush
 *  as the whirlpool speeds up, and a bright pop as the box comes out. */
function useWaterSound() {
  const ctx = useRef<AudioContext | null>(null);
  const out = useRef<GainNode | null>(null);
  const rush = useRef<{ stop: () => void } | null>(null);

  const unlock = () => {
    if (!ctx.current) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      const ac = new AC();
      const master = ac.createGain();
      master.gain.value = 0.8;
      master.connect(ac.destination);
      ctx.current = ac;
      out.current = master;
    }
    void ctx.current.resume();
  };

  const blip = (from: number, to: number, at: number, dur: number, gain: number, type: OscillatorType = "sine") => {
    const ac = ctx.current;
    if (!ac || !out.current) return;
    const t = ac.currentTime + at;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(from, t);
    o.frequency.exponentialRampToValueAtTime(to, t + dur * 0.7);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(out.current);
    o.start(t);
    o.stop(t + dur + 0.02);
  };

  const plip = () => {
    blip(480, 1300, 0, 0.14, 0.22);
    blip(900, 1700, 0.05, 0.1, 0.08);
  };

  const whoosh = (secs: number) => {
    const ac = ctx.current;
    if (!ac || !out.current) return;
    const len = Math.ceil(ac.sampleRate * 2);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let k = 0; k < len; k++) data[k] = Math.random() * 2 - 1;
    const src = ac.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const bp = ac.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 0.8;
    const g = ac.createGain();
    const t = ac.currentTime;
    bp.frequency.setValueAtTime(260, t);
    bp.frequency.exponentialRampToValueAtTime(2600, t + secs);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + secs * 0.85);
    src.connect(bp).connect(g).connect(out.current);
    // A low gurgle under it, rising with the water.
    const o = ac.createOscillator();
    const og = ac.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(70, t);
    o.frequency.exponentialRampToValueAtTime(190, t + secs);
    og.gain.setValueAtTime(0.0001, t);
    og.gain.exponentialRampToValueAtTime(0.18, t + secs * 0.8);
    o.connect(og).connect(out.current);
    src.start(t);
    o.start(t);
    const stop = () => {
      const n = ac.currentTime;
      g.gain.cancelScheduledValues(n);
      og.gain.cancelScheduledValues(n);
      g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), n);
      og.gain.setValueAtTime(Math.max(0.0001, og.gain.value), n);
      g.gain.exponentialRampToValueAtTime(0.0001, n + 0.5);
      og.gain.exponentialRampToValueAtTime(0.0001, n + 0.5);
      src.stop(n + 0.55);
      o.stop(n + 0.55);
    };
    // Keeps going while the server answers, and is let go by pop or stop.
    rush.current = { stop };
  };

  const stop = () => {
    rush.current?.stop();
    rush.current = null;
  };

  const pop = () => {
    stop();
    blip(220, 880, 0, 0.32, 0.35);
    blip(1760, 2350, 0.06, 0.22, 0.09, "triangle");
    blip(2350, 3140, 0.14, 0.24, 0.07, "triangle");
    blip(3140, 3950, 0.22, 0.3, 0.05, "triangle");
  };

  return { unlock, plip, whoosh, stop, pop };
}
