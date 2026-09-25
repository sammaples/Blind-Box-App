"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { useScrollLock } from "@/lib/useScrollLock";
import { useAccount } from "./AccountBar";
import { AppleButton } from "./AppleButton";
import { ProductBox } from "./ProductBox";

/**
 * What a first-time visitor is told, before anything asks them for something.
 *
 * Three cards, and they are the three the front page already carries under
 * "How it works" — deliberately the same words. Onboarding that explains the
 * product differently to the page underneath it is two explanations to keep
 * in step, and the first one anybody notices is the one that went stale.
 *
 * The order is the order it happens in, and each line answers the question
 * the one before it raises: you open a box, so where does the thing go, so
 * how do I ever get it.
 */
const CARDS = [
  {
    n: "01",
    title: "Open",
    body: "Choose a box and open it. What is inside is drawn when you buy, against rates published per piece.",
    art: "box",
  },
  {
    n: "02",
    title: "Collect",
    body: "Everything you open goes straight to your vault. Nothing ships until you say so, and nothing expires.",
    art: "vault",
  },
  {
    n: "03",
    title: "Ship",
    body: "Pick what you want sent and it goes in one parcel. Shipping is always $5, however many pieces are in it.",
    art: "ship",
  },
] as const;

/** Set once the cards have been seen, for a visitor with no account to write to. */
const SEEN_KEY = "bb_onboarded";

/**
 * Whether to show it, decided from two places.
 *
 * The account is the real record, so a collector who signed up on a phone is
 * not walked through it again on a laptop. The local flag is for everyone
 * else — somebody browsing before they sign in, who should still only see
 * this once.
 *
 * Both have to be quiet before it opens, and the account wins: signing in is
 * the last card, so an account that has been through it has been through it
 * whatever the browser thinks.
 */
function useFirstRun(): [boolean, () => void] {
  const { account, loading } = useAccount();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (account) {
      // A signed-in collector who has done this is done. One who has not —
      // an account made before onboarding existed — is not shown it either;
      // they have already used the thing it explains.
      setOpen(false);
      return;
    }
    let seen = false;
    try {
      seen = window.localStorage.getItem(SEEN_KEY) === "1";
    } catch {
      // Private browsing, or storage switched off. Better to show nothing
      // than to trap somebody in an overlay they cannot dismiss for good.
      seen = true;
    }
    setOpen(!seen);
  }, [account, loading]);

  const dismiss = useCallback(() => {
    setOpen(false);
    try {
      window.localStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* nothing to do: the flag is a convenience, not a requirement */
    }
    // And on the account too, when there is one to write to.
    void fetch("/api/auth/onboarded", { method: "POST" }).catch(() => {});
  }, []);

  return [open, dismiss];
}

export function Onboarding() {
  const [open, dismiss] = useFirstRun();
  const { apple } = useAccount();
  const reduced = useReducedMotion();
  const [card, setCard] = useState(0);
  useScrollLock(open);

  const last = card === CARDS.length - 1;
  const step = CARDS[card];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex flex-col bg-ink"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          role="dialog"
          aria-modal="true"
          aria-label="Welcome to Bricks"
        >
          {/* The same wash the app sits on, so this reads as the front door
              of the thing rather than a screen in front of it. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(30rem 20rem at 12% -10%, rgb(249 115 22 / 0.13), transparent 65%)," +
                "radial-gradient(26rem 18rem at 88% 4%, rgb(168 85 247 / 0.13), transparent 62%)," +
                "radial-gradient(23rem 17rem at 50% 108%, rgb(34 211 238 / 0.10), transparent 60%)",
            }}
          />

          <div className="relative flex min-h-0 flex-1 flex-col px-6 pb-8 pt-[max(2rem,env(safe-area-inset-top))]">
            {/* Skip sits at the top and stays there. A shop that will not let
                you look at it before signing up is a shop people leave. */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-faint">
                Welcome
              </span>
              <button
                type="button"
                onClick={dismiss}
                className="rounded-full px-3 py-1.5 text-sm text-muted transition-colors hover:text-chalk"
              >
                Look around first
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col items-center justify-center text-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step.n}
                  initial={reduced ? { opacity: 0 } : { opacity: 0, x: 28 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, x: -28 }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  className="flex w-full max-w-sm flex-col items-center"
                >
                  <CardArt kind={step.art} reduced={!!reduced} />
                  <p className="mt-8 font-mono text-xs text-faint">{step.n}</p>
                  <h2 className="mt-2 text-4xl font-semibold tracking-tight">{step.title}</h2>
                  <p className="mt-3 text-[15px] leading-relaxed text-muted">{step.body}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="mx-auto w-full max-w-sm">
              {/* Where you are, and a way back. Three dots rather than a bar:
                  it is three cards, and a bar would imply a longer road. */}
              <div className="flex items-center justify-center gap-2">
                {CARDS.map((c, i) => (
                  <button
                    key={c.n}
                    type="button"
                    aria-label={`Step ${i + 1}: ${c.title}`}
                    aria-current={i === card}
                    onClick={() => setCard(i)}
                    className="p-2"
                  >
                    <span
                      className={`block size-1.5 rounded-full transition-all ${
                        i === card ? "w-5 bg-chalk" : "bg-white/25"
                      }`}
                    />
                  </button>
                ))}
              </div>

              <div className="mt-4">
                {last ? (
                  <>
                    {apple ? (
                      <AppleButton next="/#shop" label="Continue with Apple" />
                    ) : (
                      <button
                        type="button"
                        onClick={dismiss}
                        className="h-12 w-full rounded-xl bg-chalk text-[15px] font-semibold text-ink transition-transform hover:scale-[1.01] active:scale-[0.99]"
                      >
                        Start collecting
                      </button>
                    )}
                    <p className="mt-3 text-center text-[11px] leading-relaxed text-faint">
                      {apple
                        ? "One tap, no password. Use Hide My Email if you would rather."
                        : "Sign-in is not configured on this deployment yet."}
                    </p>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCard((c) => Math.min(c + 1, CARDS.length - 1))}
                    className="h-12 w-full rounded-xl bg-chalk text-[15px] font-semibold text-ink transition-transform hover:scale-[1.01] active:scale-[0.99]"
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */

/**
 * One picture per card.
 *
 * The first two show the real carton — the same component the shop card
 * renders, at a size that suits a picture rather than a product tile. It was
 * a hand-drawn stand-in, and a drawing of the box is the wrong thing to open
 * an app with: the first carton somebody sees should be the carton they are
 * about to buy, printed and turning, not an approximation of it that will
 * quietly stop matching the moment the real one is tuned.
 *
 * The third is a parcel, which is the one thing here that is not a box you
 * open — so it is still drawn.
 */

/** The bronze card's accent, since that is the box a newcomer meets first. */
const BRONZE = "#c2795a";

function CardArt({ kind, reduced }: { kind: "box" | "vault" | "ship"; reduced: boolean }) {
  const float = reduced
    ? undefined
    : { y: [0, -8, 0], transition: { duration: 4.5, repeat: Infinity, ease: "easeInOut" as const } };

  if (kind === "box") {
    return (
      <motion.div animate={float} className="relative grid h-44 place-items-center">
        <div
          aria-hidden
          className="absolute size-52 rounded-full blur-2xl"
          style={{ background: `radial-gradient(circle, ${BRONZE} 0%, transparent 70%)`, opacity: 0.6 }}
        />
        <ProductBox accent={BRONZE} printed width={108} />
      </motion.div>
    );
  }

  if (kind === "vault") {
    return (
      <motion.div animate={float} className="relative grid h-44 place-items-center">
        <div
          aria-hidden
          className="absolute size-52 rounded-full blur-2xl"
          style={{ background: "radial-gradient(circle, #c084fc 0%, transparent 70%)", opacity: 0.45 }}
        />
        {/* Three, fanned: a vault is more than one thing, and a neat stack
            reads as a single object seen edge on. Only the front one turns —
            three boxes all turning at once is a display case, not a shelf. */}
        <div className="relative grid place-items-center">
          <span className="absolute -left-[76px] top-5 block rotate-[-14deg] opacity-40">
            <ProductBox accent={BRONZE} printed width={62} spin={false} />
          </span>
          <span className="absolute -right-[76px] top-5 block rotate-[14deg] opacity-40">
            <ProductBox accent={BRONZE} printed width={62} spin={false} />
          </span>
          <span className="relative z-10 block">
            <ProductBox accent={BRONZE} printed width={88} />
          </span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div animate={float} className="relative grid h-44 place-items-center">
      <div
        aria-hidden
        className="absolute size-52 rounded-full blur-2xl"
        style={{ background: "radial-gradient(circle, #34d399 0%, transparent 70%)", opacity: 0.4 }}
      />
      {/* A parcel: taped across the middle, because that is what a box with
          several pieces in it looks like once it is sealed. */}
      <div className="relative h-24 w-32 rounded-lg bg-gradient-to-br from-[#d8cbb4] to-[#a8977c] shadow-[0_18px_30px_rgba(0,0,0,0.45)]">
        <span className="absolute inset-y-0 left-1/2 w-5 -translate-x-1/2 bg-white/25" />
        <span className="absolute inset-x-0 top-1/2 h-4 -translate-y-1/2 bg-white/15" />
      </div>
    </motion.div>
  );
}
