"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { nextSpinAt, SPIN_ODDS, SPIN_SLOTS, untilLabel } from "@/lib/spin";
import { useAccount } from "./AccountBar";
import { Coin, Coins } from "./Coin";

/**
 * The daily spin.
 *
 * The server decides the prize before the wheel moves; the wheel is told
 * where to stop and makes getting there feel like something. A wind-back,
 * seven turns that slow over six seconds, a pointer that flicks and clicks on
 * every slot it passes, and a landing that lights the slot, throws coins and
 * counts the prize up. The one slot worth 1,500 gets more of all of it.
 */

const N = SPIN_SLOTS.length;
const SEG = 360 / N;
const C = 200; // centre of the 400 x 400 drawing
const SPIN_MS = 6000;
const TURNS = 7;

type Phase = "loading" | "ready" | "spinning" | "won" | "done";

/** A point on the wheel: `r` out from the centre, `deg` clockwise from the top. */
function at(r: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [C + r * Math.sin(a), C - r * Math.cos(a)];
}

function wedge(i: number, r0: number, r1: number): string {
  const a0 = i * SEG - SEG / 2;
  const a1 = i * SEG + SEG / 2;
  const [x0, y0] = at(r1, a0);
  const [x1, y1] = at(r1, a1);
  const [x2, y2] = at(r0, a1);
  const [x3, y3] = at(r0, a0);
  return `M${x0} ${y0} A${r1} ${r1} 0 0 1 ${x1} ${y1} L${x2} ${y2} A${r0} ${r0} 0 0 0 ${x3} ${y3}Z`;
}

/** Fast at first, then a long slow settle — the part people hold their breath for. */
const ease = (t: number) => 1 - Math.pow(1 - t, 4.2);

/* ------------------------------- sound ------------------------------- */

function useSound() {
  const ctx = useRef<AudioContext | null>(null);
  const last = useRef(0);
  const unlock = () => {
    if (!ctx.current) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AC) ctx.current = new AC();
    }
    void ctx.current?.resume();
  };
  const tone = (freq: number, at: number, dur: number, gain: number, type: OscillatorType = "sine") => {
    const ac = ctx.current;
    if (!ac) return;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, ac.currentTime + at);
    g.gain.setValueAtTime(0.0001, ac.currentTime + at);
    g.gain.exponentialRampToValueAtTime(gain, ac.currentTime + at + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + at + dur);
    o.connect(g).connect(ac.destination);
    o.start(ac.currentTime + at);
    o.stop(ac.currentTime + at + dur + 0.02);
  };
  /** The click of the pointer catching a peg. Throttled: at full speed they would blur. */
  const tick = () => {
    const now = performance.now();
    if (now - last.current < 38) return;
    last.current = now;
    tone(1500 + Math.random() * 200, 0, 0.045, 0.05, "triangle");
  };
  const win = (big: boolean) => {
    const notes = big ? [523, 659, 784, 1047, 1319, 1568, 2093] : [659, 784, 1047, 1319];
    notes.forEach((f, i) => tone(f, i * (big ? 0.09 : 0.075), big ? 0.9 : 0.55, big ? 0.09 : 0.07));
    if (big) [2637, 3136, 2637, 3520].forEach((f, i) => tone(f, 0.7 + i * 0.12, 0.6, 0.03));
  };
  return { unlock, tick, win };
}

/* ------------------------------- wheel ------------------------------- */

function slotFill(value: number, i: number): string {
  if (value === 1500) return "url(#spin-gold)";
  if (value === 250) return "url(#spin-blue)";
  return i % 2 === 0 ? "url(#spin-navy-a)" : "url(#spin-navy-b)";
}

function WheelFace({ lit }: { lit: number | null }) {
  return (
    <svg viewBox="0 0 400 400" className="block size-full" aria-hidden>
      <defs>
        <radialGradient id="spin-gold" cx={C} cy={C} r="190" gradientUnits="userSpaceOnUse">
          <stop offset="0.25" stopColor="#7a4a06" />
          <stop offset="0.7" stopColor="#f2b42a" />
          <stop offset="1" stopColor="#ffe7a0" />
        </radialGradient>
        <radialGradient id="spin-blue" cx={C} cy={C} r="190" gradientUnits="userSpaceOnUse">
          <stop offset="0.25" stopColor="#10308f" />
          <stop offset="0.75" stopColor="#3f86f5" />
          <stop offset="1" stopColor="#8cc4ff" />
        </radialGradient>
        <radialGradient id="spin-navy-a" cx={C} cy={C} r="190" gradientUnits="userSpaceOnUse">
          <stop offset="0.25" stopColor="#0d0f1a" />
          <stop offset="1" stopColor="#2b3150" />
        </radialGradient>
        <radialGradient id="spin-navy-b" cx={C} cy={C} r="190" gradientUnits="userSpaceOnUse">
          <stop offset="0.25" stopColor="#11131f" />
          <stop offset="1" stopColor="#363d63" />
        </radialGradient>
        <linearGradient id="spin-rim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f4f5f8" />
          <stop offset="0.45" stopColor="#9aa0ae" />
          <stop offset="0.55" stopColor="#c9ccd5" />
          <stop offset="1" stopColor="#5d6270" />
        </linearGradient>
        <radialGradient id="spin-coin" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#fff3c4" />
          <stop offset="0.55" stopColor="#f5c542" />
          <stop offset="1" stopColor="#b7801a" />
        </radialGradient>
      </defs>

      {/* The rim, then the slots inside it. */}
      <circle cx={C} cy={C} r="194" fill="url(#spin-rim)" />
      <circle cx={C} cy={C} r="182" fill="#07080d" />
      {SPIN_SLOTS.map((value, i) => (
        <path key={i} d={wedge(i, 0, 180)} fill={slotFill(value, i)} />
      ))}
      {/* Hairlines between slots. */}
      {SPIN_SLOTS.map((_, i) => {
        const [x0, y0] = at(54, i * SEG - SEG / 2);
        const [x1, y1] = at(180, i * SEG - SEG / 2);
        return <line key={i} x1={x0} y1={y0} x2={x1} y2={y1} stroke="rgba(255,255,255,0.14)" strokeWidth="1.2" />;
      })}

      {/* The landed slot, lit. */}
      {lit !== null && (
        <path d={wedge(lit, 54, 180)} fill="rgba(255,255,255,0.18)" stroke="#fff" strokeWidth="3" className="spin-lit" />
      )}

      {/* Labels, upright when their slot is under the pointer. */}
      {SPIN_SLOTS.map((value, i) => {
        const jackpot = value === 1500;
        return (
          <g key={i} transform={`rotate(${i * SEG} ${C} ${C})`}>
            <text
              x={C}
              y={C - 138}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={jackpot ? 20 : value === 250 ? 22 : 21}
              fontWeight={800}
              fill={jackpot ? "#3b2300" : "#fff"}
              style={{ letterSpacing: "-0.02em" }}
            >
              {value.toLocaleString()}
            </text>
            <circle cx={C} cy={C - 108} r="9.5" fill="url(#spin-coin)" stroke="#8a5a0b" strokeWidth="1" />
            <text x={C} y={C - 107.5} textAnchor="middle" dominantBaseline="middle" fontSize="10" fontWeight={800} fill="#7a4d06">
              B
            </text>
            {jackpot && (
              <path
                d={`M${C} ${C - 172} l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3Z`}
                fill="#fff8dc"
                className="spin-sparkle"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

/** The ring of lights, which does not turn with the wheel: it twinkles at rest and chases while spinning. */
function Lights({ spinning }: { spinning: boolean }) {
  return (
    <svg viewBox="0 0 400 400" className="pointer-events-none absolute inset-0 size-full" aria-hidden>
      {Array.from({ length: N * 2 }, (_, k) => {
        const [x, y] = at(188, (k * SEG) / 2);
        return (
          <circle
            key={k}
            cx={x}
            cy={y}
            r="3.6"
            className={spinning ? "spin-bulb-chase" : "spin-bulb"}
            style={{ animationDelay: `${spinning ? (k % 4) * 90 : (k % 2) * 700}ms` }}
          />
        );
      })}
    </svg>
  );
}

/* ------------------------------ the page ----------------------------- */

interface Burst {
  id: number;
  dx: number;
  dy: number;
  rot: number;
  delay: number;
  size: number;
}

export function SpinWheel() {
  const { account, loading, signIn, refresh } = useAccount();
  const sound = useSound();
  const [phase, setPhase] = useState<Phase>("loading");
  const [won, setWon] = useState<number | null>(null);
  const [lit, setLit] = useState<number | null>(null);
  const [shown, setShown] = useState(0);
  const [nextAt, setNextAt] = useState<number>(() => nextSpinAt().getTime());
  const [now, setNow] = useState(() => Date.now());
  const [burst, setBurst] = useState<Burst[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [oddsOpen, setOddsOpen] = useState(false);

  const wheel = useRef<HTMLDivElement>(null);
  const pointer = useRef<HTMLDivElement>(null);
  const angle = useRef(0);

  // What today looks like: still to spin, or already spun.
  useEffect(() => {
    if (loading) return;
    let live = true;
    void fetch("/api/rewards/spin")
      .then((r) => r.json())
      .then((d: { available?: boolean; won?: number | null; nextAt?: string }) => {
        if (!live) return;
        if (d.nextAt) setNextAt(new Date(d.nextAt).getTime());
        if (d.available === false) {
          setWon(d.won ?? null);
          setShown(d.won ?? 0);
          setPhase("done");
        } else {
          setPhase("ready");
        }
      })
      .catch(() => live && setPhase("ready"));
    return () => {
      live = false;
    };
  }, [loading, account?.id]);

  // The countdown, once spun.
  useEffect(() => {
    if (phase !== "won" && phase !== "done") return;
    const t = setInterval(() => {
      setNow(Date.now());
      if (Date.now() >= nextAt) {
        setPhase("ready");
        setWon(null);
        setLit(null);
      }
    }, 1000);
    return () => clearInterval(t);
  }, [phase, nextAt]);

  const kick = () => {
    pointer.current?.animate(
      [{ transform: "rotate(-24deg)" }, { transform: "rotate(0deg)" }],
      { duration: 160, easing: "cubic-bezier(.2,.9,.3,1.3)" },
    );
    sound.tick();
    navigator.vibrate?.(5);
  };

  const turnTo = (deg: number) => {
    angle.current = deg;
    if (wheel.current) wheel.current.style.transform = `rotate(${deg}deg)`;
  };

  const celebrate = useCallback(
    (coins: number) => {
      const big = coins >= 1500;
      const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      sound.win(big);
      navigator.vibrate?.(big ? [40, 60, 40, 60, 120] : [30, 50, 60]);
      if (!reduced) {
        const count = big ? 64 : coins >= 250 ? 34 : 20;
        setBurst(
          Array.from({ length: count }, (_, id) => {
            const a = Math.random() * Math.PI * 2;
            const v = (big ? 170 : 120) + Math.random() * (big ? 150 : 90);
            return {
              id,
              dx: Math.cos(a) * v,
              dy: Math.sin(a) * v - 40,
              rot: Math.random() * 720 - 360,
              delay: Math.random() * (big ? 380 : 160),
              size: 14 + Math.random() * 12,
            };
          }),
        );
        setTimeout(() => setBurst([]), 2600);
      }
      // Count the prize up rather than printing it.
      const start = performance.now();
      const dur = big ? 1400 : 900;
      const step = (t: number) => {
        const p = Math.min(1, (t - start) / dur);
        setShown(Math.round(coins * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    },
    [sound],
  );

  const spin = async () => {
    if (phase !== "ready") return;
    if (!account) {
      signIn("Sign in to spin the daily wheel. It’s free, once a day.");
      return;
    }
    sound.unlock();
    setError(null);
    setLit(null);
    setPhase("spinning");
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    // The wind-back plays while the prize is fetched, so there is no dead
    // moment between the tap and the wheel going.
    const from = angle.current;
    const windBack = reduced ? Promise.resolve() : new Promise<void>((resolve) => {
      const t0 = performance.now();
      const w = (t: number) => {
        const p = Math.min(1, (t - t0) / 320);
        turnTo(from - 14 * Math.sin(p * Math.PI * 0.5));
        if (p < 1) requestAnimationFrame(w);
        else resolve();
      };
      requestAnimationFrame(w);
    });

    let result: { coins: number; slot: number; nextAt: string };
    try {
      const [res] = await Promise.all([fetch("/api/rewards/spin", { method: "POST" }), windBack]);
      const data = await res.json();
      if (res.status === 409) {
        turnTo(from);
        setPhase("done");
        if (data.nextAt) setNextAt(new Date(data.nextAt).getTime());
        return;
      }
      if (!res.ok) throw new Error(data?.error ?? "Could not spin right now");
      result = data;
    } catch (err) {
      turnTo(from);
      setError(err instanceof Error ? err.message : "Something went wrong");
      setPhase("ready");
      return;
    }

    // Where to stop: the prize slot under the pointer, a little off-centre
    // so it does not look placed, after whole turns.
    const start = angle.current;
    const jitter = (Math.random() - 0.5) * SEG * 0.6;
    const want = (((-result.slot * SEG + jitter) % 360) + 360) % 360;
    const base = ((start % 360) + 360) % 360;
    const target = start + (reduced ? 1 : TURNS) * 360 + ((want - base + 360) % 360);
    const dur = reduced ? 1200 : SPIN_MS;

    let peg = Math.floor((start + SEG / 2) / SEG);
    await new Promise<void>((resolve) => {
      const t0 = performance.now();
      const frame = (t: number) => {
        const p = Math.min(1, (t - t0) / dur);
        const deg = start + (target - start) * ease(p);
        turnTo(deg);
        const now = Math.floor((deg + SEG / 2) / SEG);
        if (now !== peg) {
          peg = now;
          kick();
        }
        if (p < 1) requestAnimationFrame(frame);
        else resolve();
      };
      requestAnimationFrame(frame);
    });

    setLit(result.slot);
    setWon(result.coins);
    setNextAt(new Date(result.nextAt).getTime());
    setPhase("won");
    celebrate(result.coins);
    void refresh();
  };

  const jackpot = won !== null && won >= 1500;
  const spinning = phase === "spinning";
  const ready = phase === "ready";

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center px-5 pb-8 pt-4">
      <div className="flex w-full items-center justify-between">
        <Link href="/rewards" className="text-[13px] font-medium text-muted transition-colors hover:text-chalk">
          ← Rewards
        </Link>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <h1
          className="shimmer-text shimmer-slow w-fit text-3xl font-semibold tracking-tight"
          style={{ backgroundImage: "linear-gradient(100deg, #b98a2a 0%, #f5c542 28%, #fff6d6 48%, #f5c542 68%, #b98a2a 100%)" }}
        >
          Daily spin
        </h1>
        {/* The odds, one tap away rather than on the screen. */}
        <button
          type="button"
          onClick={() => setOddsOpen(true)}
          aria-label="Odds"
          aria-haspopup="dialog"
          className="grid size-6 place-items-center rounded-full border border-hairline bg-white/[0.06] text-[12px] font-bold italic text-muted transition-colors hover:text-chalk"
        >
          i
        </button>
      </div>
      <OddsCard open={oddsOpen} onClose={() => setOddsOpen(false)} />

      {/* The wheel. */}
      {/* Sized to the screen's height as well as its width, so the whole
          page — wheel, prize and countdown — fits a small phone unscrolled. */}
      {/* The top margin leaves room for the pointer, which stands proud of
          the rim and would otherwise run into the title. */}
      <div className="relative mt-10 aspect-square w-full max-w-[min(22rem,calc(100svh-65px-4.25rem-env(safe-area-inset-bottom)-17.75rem))]">
        {/* Light behind it, warmer once it has paid out. */}
        <div
          aria-hidden
          className={`absolute -inset-6 rounded-full blur-3xl transition-opacity duration-700 ${jackpot ? "opacity-90" : "opacity-50"}`}
          style={{ background: jackpot ? "radial-gradient(circle, #f5c54299, transparent 70%)" : "radial-gradient(circle, #5b6cff55, transparent 70%)" }}
        />
        <div ref={wheel} className="absolute inset-0 will-change-transform">
          <WheelFace lit={lit} />
        </div>
        <Lights spinning={spinning} />

        {/* The pointer, fixed at the top. It flicks on every peg. */}
        <div
          ref={pointer}
          aria-hidden
          className="absolute left-1/2 top-[-4%] z-10 h-[15%] w-[11%] -translate-x-1/2"
          style={{ transformOrigin: "50% 18%" }}
        >
          <svg viewBox="0 0 40 56" className="size-full drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)]">
            <defs>
              <linearGradient id="spin-ptr" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#ffffff" />
                <stop offset="0.6" stopColor="#cfd2da" />
                <stop offset="1" stopColor="#8b909d" />
              </linearGradient>
            </defs>
            <path d="M20 54 L4 18 A17 17 0 1 1 36 18 Z" fill="url(#spin-ptr)" stroke="#5d6270" strokeWidth="1.5" />
            <circle cx="20" cy="17" r="6.5" fill="#f5c542" stroke="#9a6a10" strokeWidth="1.5" />
          </svg>
        </div>

        {/* The hub: the button. */}
        <button
          type="button"
          onClick={() => void spin()}
          disabled={!ready}
          aria-label={ready ? "Spin the wheel" : "Already spun today"}
          className={`absolute left-1/2 top-1/2 z-10 grid size-[27%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-[3px] border-white/70 text-[15px] font-black tracking-[0.08em] text-[#1b1c22] transition-transform ${
            ready ? "spin-hub-ready hover:scale-[1.05] active:scale-95" : ""
          }`}
          style={{
            background: "radial-gradient(circle at 35% 28%, #ffffff 0%, #e2e4ea 45%, #9ea3b0 100%)",
            boxShadow: "0 6px 18px rgba(0,0,0,0.55), inset 0 -3px 6px rgba(0,0,0,0.18)",
          }}
        >
          {phase === "loading" ? "" : ready ? "SPIN" : spinning ? "" : (
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="5" y="11" width="14" height="9" rx="2" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
          )}
        </button>

        {/* Coins, thrown from the middle on a win. */}
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 z-20">
          {burst.map((b) => (
            <span
              key={b.id}
              className="spin-coin absolute"
              style={
                {
                  "--dx": `${b.dx}px`,
                  "--dy": `${b.dy}px`,
                  "--rot": `${b.rot}deg`,
                  animationDelay: `${b.delay}ms`,
                  marginLeft: -b.size / 2,
                  marginTop: -b.size / 2,
                } as React.CSSProperties
              }
            >
              <Coin size={b.size} />
            </span>
          ))}
        </div>
      </div>

      {/* Under the wheel: the prize, or what is on offer. */}
      <div className="mt-6 flex min-h-[5.5rem] w-full flex-col items-center justify-center text-center">
        {phase === "won" || phase === "done" ? (
          <>
            {won !== null && (
              <>
                {jackpot && phase === "won" && (
                  <p className="spin-jackpot text-[13px] font-black uppercase tracking-[0.3em] text-amber-300">Jackpot!</p>
                )}
                <p className={`flex items-center gap-2 font-semibold ${phase === "won" ? "spin-pop text-4xl" : "text-2xl"}`}>
                  <span className="text-emerald-300">+</span>
                  <Coins amount={phase === "won" ? shown : won} size={phase === "won" ? 30 : 22} />
                </p>
              </>
            )}
            <p className="mt-2 text-[13px] text-muted">
              {phase === "won" ? "Added to your coins · " : won !== null ? "Today’s spin · " : ""}
              Next spin in {untilLabel(nextAt - now)}
            </p>
          </>
        ) : (
          <>
            <p className="text-[13px] text-muted">{spinning ? "Good luck…" : "Tap the middle to spin"}</p>
          </>
        )}
        {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}
      </div>
    </div>
  );
}

/**
 * The odds, behind the ⓘ beside the title.
 *
 * Off the main screen to keep it clean, but one tap away — the slots on the
 * wheel are not drawn to scale (the jackpot is one slot of fourteen, and lands
 * one spin in a hundred), so the real chances have to be somewhere a person
 * can find them.
 */
function OddsCard({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!mounted || !open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Daily spin odds"
        onClick={(e) => e.stopPropagation()}
        className="spin-pop relative w-full max-w-xs rounded-3xl border border-hairline bg-ink-raised p-5"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          autoFocus
          className="absolute right-3.5 top-3.5 grid size-8 place-items-center rounded-full bg-white/10 text-chalk"
        >
          <svg viewBox="0 0 24 24" aria-hidden className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
        <h2 className="text-lg font-semibold tracking-tight">Odds</h2>
        <ul className="mt-4 grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline">
          {[...SPIN_ODDS].reverse().map((o) => (
            <li key={o.coins} className="flex items-center justify-between bg-ink-card px-4 py-3 text-sm">
              <Coins amount={o.coins} size={15} />
              <span className="font-mono text-muted">{o.chance}%</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[12px] text-faint">Every spin wins. Free, once a day.</p>
      </div>
    </div>,
    document.body,
  );
}
