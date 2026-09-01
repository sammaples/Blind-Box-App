"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const KEY = "bb.onboarded.v1";

const STEPS = [
  {
    title: "Pick a box",
    body: "Two boxes, 100% or 400%. Every rate is published before you buy.",
    art: "box",
  },
  {
    title: "Open it here",
    body: "Your piece is drawn and locked in the moment you buy. Opening it is just you finding out.",
    art: "open",
  },
  {
    title: "We ship the real one",
    body: "Whatever you pull is packed and posted to you. The digital pull is a receipt, not the product.",
    art: "ship",
  },
] as const;

/**
 * First-visit intro. Three cards, one button, gone forever after that — the
 * whole point is that it does not stand between a new visitor and the shop.
 */
export function Onboarding() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setOpen(true);
    } catch {
      // Private mode or storage disabled — just skip the intro.
    }
  }, []);

  const finish = () => {
    setOpen(false);
    try {
      localStorage.setItem(KEY, new Date().toISOString());
    } catch {
      /* nothing to do */
    }
    void fetch("/api/me", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    }).catch(() => {});
  };

  const current = STEPS[step];
  const last = step === STEPS.length - 1;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/92 p-5 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ y: 24, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 12, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full max-w-sm rounded-3xl border border-hairline bg-ink-raised p-7"
          >
            <div className="flex h-44 items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.art}
                  initial={{ opacity: 0, y: 14, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -14, scale: 0.96 }}
                  transition={{ duration: 0.3 }}
                >
                  <StepArt kind={current.art} />
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="mt-2 min-h-[6.5rem]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.title}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.24 }}
                >
                  <h2 className="text-xl font-semibold tracking-tight">{current.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{current.body}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="flex gap-1.5">
                {STEPS.map((s, i) => (
                  <span
                    key={s.title}
                    className={`h-1 rounded-full transition-all ${
                      i === step ? "w-5 bg-chalk" : "w-1.5 bg-white/20"
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3">
                {!last && (
                  <button
                    type="button"
                    onClick={finish}
                    className="text-xs text-faint transition-colors hover:text-muted"
                  >
                    Skip
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => (last ? finish() : setStep((s) => s + 1))}
                  className="rounded-full bg-chalk px-6 py-2.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.03] active:scale-[0.98]"
                >
                  {last ? "Start collecting" : "Next"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function StepArt({ kind }: { kind: "box" | "open" | "ship" }) {
  if (kind === "box") {
    return (
      <svg viewBox="0 0 160 120" className="h-36 w-auto">
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(${i * 46} ${i === 1 ? -8 : 0})`}>
            <rect x={8} y={34} width={42} height={42} rx={6} fill="#16161d" stroke="#2b2b36" />
            <rect x={8} y={34} width={42} height={9} rx={4} fill="#22222c" />
            <circle cx={29} cy={58} r={7} fill="none" stroke={["#f97316", "#a855f7", "#22d3ee"][i]} strokeWidth={2} />
          </g>
        ))}
      </svg>
    );
  }
  if (kind === "open") {
    return (
      <svg viewBox="0 0 160 120" className="h-36 w-auto">
        <defs>
          <linearGradient id="ob-beam" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M58 74 L46 16 h68 l-12 58 z" fill="url(#ob-beam)" />
        <rect x={52} y={70} width={56} height={36} rx={6} fill="#16161d" stroke="#2b2b36" />
        <rect x={44} y={52} width={72} height={12} rx={5} fill="#22222c" transform="rotate(-9 80 58)" />
        <circle cx={80} cy={44} r={9} fill="#f97316" opacity="0.9" />
        <circle cx={62} cy={34} r={3} fill="#fbbf24" />
        <circle cx={100} cy={30} r={2.4} fill="#fbbf24" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 160 120" className="h-36 w-auto">
      <rect x={26} y={44} width={62} height={44} rx={6} fill="#16161d" stroke="#2b2b36" />
      <path d="M88 56h24l16 18v14H88z" fill="#16161d" stroke="#2b2b36" />
      <circle cx={48} cy={92} r={9} fill="#0e0e13" stroke="#3a3a48" strokeWidth={3} />
      <circle cx={110} cy={92} r={9} fill="#0e0e13" stroke="#3a3a48" strokeWidth={3} />
      <path d="M14 58h18M8 70h24M18 82h14" stroke="#22d3ee" strokeWidth={3} strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}
