"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useState } from "react";
import { useScrollLock } from "@/lib/useScrollLock";
import { useAccount } from "./AccountBar";
import { AppleButton } from "./AppleButton";
import { ProductBox } from "./ProductBox";

/**
 * What somebody is told when they open the app, before anything asks them for
 * something.
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

/** Records that the cards have been seen. Nothing reads it — see below. */
const SEEN_KEY = "bb_onboarded";

/**
 * Whether to show it: every time the app is opened.
 *
 * It used to be once, ever, remembered in the browser and on the account. It
 * is now every open, which is a deliberate change and not a lost flag — the
 * three cards are the shortest statement of what this shop is, and they are
 * one tap to leave.
 *
 * "Open" means a fresh load of the app, not a move around inside it. This
 * lives in the root layout, so it mounts once per document and stays mounted
 * across every link followed afterwards; going to the vault and back does not
 * bring it round again.
 *
 * Open from the very first frame, rendered by the server, not switched on
 * once the page has loaded. It used to wait for the account check, and on the
 * home page — the heaviest one there is — that took up to three seconds, so
 * the shop appeared, somebody started reading it, and then a full-screen card
 * dropped over the top. That is a pop-up, however friendly its contents. The
 * one part that depends on the account is the last card, which is at least
 * two taps away, and the account is known long before anybody gets there.
 *
 * Both records are still written on the way out, and neither is read. That is
 * on purpose: they are what "has this person been shown this" would be
 * answered from, and keeping them true means going back to once-ever is a
 * change to this function and nothing else.
 */
function useWelcome(): [boolean, () => void] {
  const [open, setOpen] = useState(true);

  const dismiss = useCallback(() => {
    setOpen(false);
    try {
      window.localStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* nothing to do: the flag is a record, not a requirement */
    }
    // And on the account too, when there is one to write to.
    void fetch("/api/auth/onboarded", { method: "POST" }).catch(() => {});
  }, []);

  return [open, dismiss];
}

export function Onboarding() {
  const [open, dismiss] = useWelcome();
  const { account, apple } = useAccount();
  const reduced = useReducedMotion();
  const [card, setCard] = useState(0);
  useScrollLock(open);

  const last = card === CARDS.length - 1;
  const step = CARDS[card];

  return (
    // `initial={false}` on both of these: the first paint is the server's
    // HTML, and an entrance animation there starts from opacity zero — so the
    // page underneath would show through until the script had loaded and
    // faded the cover in, which is the flash this is all here to avoid.
    // Leaving still animates, and so does every card after the first.
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex flex-col bg-ink"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          role="dialog"
          aria-modal="true"
          aria-label="Welcome to Blind Box"
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
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={step.n}
                  initial={reduced ? { opacity: 0 } : { opacity: 0, x: 28 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, x: -28 }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  className="flex w-full max-w-sm flex-col items-center"
                >
                  <CardArt kind={step.art} reduced={!!reduced} />
                  {/* No step number above the title: the dots already say
                      where you are, and "02" over "Collect" was saying it twice. */}
                  <h2 className="mt-8 text-4xl font-semibold tracking-tight">{step.title}</h2>
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
                    {/* Nobody is asked to sign in twice. These cards are shown
                        on every open now, so the person reading them is as
                        likely to be a collector with a vault as a stranger,
                        and a signed-in collector wants the door held open,
                        not a login. */}
                    {apple && !account ? (
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
                      {account
                        ? "Signed in. Your vault is where everything you open goes."
                        : apple
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
 * The third is a shipping box, which is the one thing here that is not a box
 * you open — so it is drawn, in the flat cardboard style of a parcel icon.
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
            three boxes all turning at once is a display case, not a shelf.
            The two behind are solid and a shade darker rather than
            see-through: boxes behind the front one, not ghosts of it. */}
        <div className="relative grid place-items-center">
          <span className="absolute -left-[76px] top-5 block rotate-[-14deg] brightness-[0.62]">
            <ProductBox accent={BRONZE} printed width={62} spin={false} />
          </span>
          <span className="absolute -right-[76px] top-5 block rotate-[14deg] brightness-[0.62]">
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
      {/* A shipping box, the kind that turns up on a doorstep: taped shut,
          with the end of the tape left hanging where it was torn off the
          roll. The flat taped square it replaced read as a tile, not as
          anything that had been posted. */}
      <ShippingBox />
    </motion.div>
  );
}

/**
 * A cardboard shipping box, drawn.
 *
 * Three faces lit from the top left — light lid, mid front, dark side — which
 * is all the shading a flat illustration needs to read as a solid. Tape runs
 * across the lid and hangs down the front with a torn edge, and a soft glare
 * sits on the front face. The same markup is in the simulator.
 */
function ShippingBox() {
  return (
    <svg
      viewBox="0 0 194 192"
      width={150}
      height={148}
      aria-hidden
      className="relative overflow-visible drop-shadow-[0_18px_20px_rgba(0,0,0,0.5)]"
    >
      <polygon points="82,30 184,66 112,94 10,58" fill="#E4B17E" />
      <polygon points="10,58 112,94 112,184 10,148" fill="#D09760" />
      <polygon points="112,94 184,66 184,156 112,184" fill="#B98150" />
      <rect x="19" y="75" width="7" height="44" rx="3.5" fill="#DEAB77" />
      <ellipse cx="22.5" cy="130" rx="3.6" ry="4.4" fill="#DEAB77" />
      <polygon points="44.7,70.2 116.7,42.2 135,48.7 63,76.7" fill="#F3DEB3" />
      <polygon points="44.7,70.2 63,76.7 63,128.7 61.2,122.1 59.4,127.4 57.5,120.8 55.7,126.1 53.9,119.5 52,124.8 50.2,118.2 48.4,123.5 46.5,116.9 44.7,122.2" fill="#DDB78E" />
      <polyline points="10,58 112,94 184,66" fill="none" stroke="#EDC596" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}
