"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { HOW_IT_WORKS } from "@/lib/howItWorks";
import { useScrollLock } from "@/lib/useScrollLock";

/**
 * The "?" beside "Pick your box", and the card it opens.
 *
 * How it works used to be a tab of its own, which spent a fifth of the tab
 * bar on something most people read once. Here it is one tap from the place
 * the question comes up — looking at a box, wondering what happens after
 * buying it — and it closes back to exactly where they were.
 */
export function HowItWorksButton() {
  const [open, setOpen] = useState(false);
  useScrollLock(open);

  // Portalled to the body for the same reason the piece sheet is: the shop
  // section starts a stacking context, and the tab bar would paint over a
  // card rendered inside it.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const card = (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="how-it-works-title"
            initial={{ y: 24, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[calc(100svh-2.5rem)] w-full max-w-md overflow-y-auto rounded-3xl border border-hairline bg-ink-raised p-6 pt-7 shadow-[0_30px_80px_rgba(0,0,0,0.6)]"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              autoFocus
              className="absolute right-4 top-4 grid size-9 place-items-center rounded-full bg-white/10 text-chalk transition-colors hover:bg-white/16"
            >
              <svg viewBox="0 0 24 24" aria-hidden className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>

            <h2 id="how-it-works-title" className="pr-10 text-2xl font-semibold tracking-tight">
              How it works
            </h2>

            {/* One per row, not a grid: they happen in order, and side by
                side they read as options to choose between. */}
            <ol className="mt-5 grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline">
              {HOW_IT_WORKS.map((step) => (
                <li key={step.title} className="bg-ink-card p-5">
                  <p className="text-base font-semibold">{step.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{step.body}</p>
                </li>
              ))}
            </ol>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="gloss gloss-chalk mt-6 w-full rounded-2xl py-3.5 text-sm font-semibold text-ink transition-transform active:scale-[0.98]"
            >
              Got it
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="How it works"
        aria-haspopup="dialog"
        className="grid size-10 shrink-0 place-items-center rounded-full border border-hairline bg-white/[0.06] text-chalk/80 transition-colors hover:border-white/25 hover:text-chalk"
      >
        <span aria-hidden className="text-[19px] font-bold leading-none">
          ?
        </span>
      </button>
      {mounted && createPortal(card, document.body)}
    </>
  );
}
