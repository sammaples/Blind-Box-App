"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { RARITY_COLOR, RARITY_LABEL } from "@/lib/catalog";
import type { Pull, StockEntry } from "@/lib/types";
import { PieceImage } from "./PieceImage";
import { PieceDetail } from "./PieceDetail";

/**
 * What people have been pulling out of this box.
 *
 * The rates under the box say what the odds are. This says what actually
 * happened, which is the thing a shop like this runs on: a wall of numbers
 * argues, a list of what somebody just opened persuades. It sits where the
 * chases used to, under the box it belongs to, and changes with it.
 *
 * Everything else about the box lives behind "Box details" beside the title.
 * The one job of this screen is the Buy button, and a full breakdown of every
 * piece and every rate competes with it — so the breakdown gets its own page
 * and this keeps a single line of it.
 */

/** "42m ago". Short, because it is read beside a name on a small card. */
function ago(iso: string, now: number): string {
  const secs = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (secs < 60) return "just now";
  // Floored, not rounded: rounding turns 59½ minutes into "60m ago".
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/** How long a card sits in front of you before the row moves on. */
const ROTATE_MS = 5550;

/**
 * How long a new pull stays lit, start to finish: about four and a half
 * seconds held with a slow pulse, then a fade. Long enough to be noticed by
 * somebody who was looking at the box rather than the row when it landed.
 */
const GLOW_S = 6;

export function RecentPulls({
  pulls,
  shelf,
  productId,
  productName,
}: {
  pulls: Pull[];
  shelf: StockEntry[];
  productId: string;
  productName: string;
}) {
  const [selected, setSelected] = useState<StockEntry | null>(null);
  const [paused, setPaused] = useState(false);
  // Set as a new pull is let in, so the row knows to wait out its glow.
  const landed = useRef(false);
  const track = useRef<HTMLDivElement>(null);

  // What the row is showing, which trails `pulls` while a new one is let in
  // (see "A new pull, live" below).
  const [shown, setShown] = useState(pulls);
  const [shownFor, setShownFor] = useState(productId);
  if (shownFor !== productId) {
    // A different box's list is not news; it arrives with the box's own fade.
    setShownFor(productId);
    setShown(pulls);
  }

  /*
   * Rendered on the server and the client from the same list, so the "how long
   * ago" has to be decided after mount or the two disagree and React throws the
   * markup away. Null until then, which renders the card without its timestamp
   * for one frame rather than with a wrong one.
   */
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  /*
   * The row moves on by itself, and stops the moment it is touched: a carousel
   * that keeps sliding while a finger is reaching for a card is one that gets
   * the wrong card tapped. It also holds while a piece's sheet is open, since
   * nothing behind a sheet should be moving.
   */
  useEffect(() => {
    if (paused || selected || shown.length < 2) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    // The row is looked up on every tick rather than once: switching boxes
    // swaps it for a new element after the old one has faded out, and an
    // interval holding the first one would go on scrolling a detached node.
    const step = () => {
      const el = track.current;
      const card = el?.firstElementChild as HTMLElement | null | undefined;
      if (!el || !card) return;
      const by = card.offsetWidth + 8;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
      el.scrollTo({ left: atEnd ? 0 : el.scrollLeft + by, behavior: "smooth" });
    };
    // A pull that has just landed holds the row until its glow has run out,
    // so the card is not carried off while it is still lit.
    const first = landed.current ? Math.max(ROTATE_MS, GLOW_S * 1000 + 600) : ROTATE_MS;
    landed.current = false;
    let id = 0;
    const lead = window.setTimeout(() => {
      step();
      id = window.setInterval(step, ROTATE_MS);
    }, first);
    return () => {
      window.clearTimeout(lead);
      window.clearInterval(id);
    };
    // The box and the newest pull are dependencies so the clock restarts on a
    // new box or a new pull, rather than moving the card that just came into
    // view on a moment after it got there.
  }, [paused, selected, shown.length, productId, shown[0]?.orderId]);

  /*
   * A new pull, live.
   *
   * The row shows `shown`, not `pulls`, so that a pull can be let in at the
   * right moment rather than the moment the poll answers. The row has usually
   * moved along by itself, so the new card's place at the front is off to the
   * left. Inserting it there and then would be invisible — and worse, a
   * snapping row re-snaps to whichever card it was resting on, so the cards in
   * view would lurch along instead. So the row first glides back to the start
   * with the list it already has, then snapping is switched off, the new card
   * is let in and grows in place at the front, pushing the rest along, and
   * snapping comes back once it has landed. The glow plays where it can be
   * seen.
   *
   * Somebody with a finger on the row, or a sheet open, keeps their place: the
   * pull waits until they let go, then comes in the same way.
   */
  const holding = paused || selected !== null;
  const fresh =
    shownFor === productId &&
    pulls.length > 0 &&
    pulls[0].orderId !== shown[0]?.orderId;

  useEffect(() => {
    if (!fresh || holding) return;
    const el = track.current;
    if (!el) {
      setShown(pulls);
      return;
    }
    let raf = 0;
    let cancelled = false;
    const land = () => {
      if (cancelled) return;
      el.style.scrollSnapType = "none";
      el.scrollLeft = 0;
      landed.current = true;
      setShown(pulls);
    };
    if (el.scrollLeft <= 1) {
      land();
    } else {
      const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      el.scrollTo({ left: 0, behavior: reduced ? "auto" : "smooth" });
      const began = performance.now();
      const wait = () => {
        if (el.scrollLeft <= 1 || performance.now() - began > 1200) land();
        else raf = requestAnimationFrame(wait);
      };
      raf = requestAnimationFrame(wait);
    }
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [fresh, holding, pulls]);

  // Snapping back on once the new card has grown in.
  useEffect(() => {
    const el = track.current;
    if (!el || el.style.scrollSnapType !== "none") return;
    const t = setTimeout(() => {
      el.style.scrollSnapType = "";
    }, 700);
    return () => clearTimeout(t);
  }, [shown]);

  /*
   * A pull opens the same sheet the shelf opens, and that sheet wants the
   * piece's stock row for its rate. A piece pulled long enough ago may have
   * since sold out of this box, so when the shelf no longer carries it the
   * sheet is handed an empty row and says so rather than not opening.
   */
  const entryFor = useMemo(() => {
    const byId = new Map(shelf.map((e) => [e.piece.id, e]));
    return (pull: Pull): StockEntry =>
      byId.get(pull.piece.id) ?? {
        piece: pull.piece,
        stocked: 0,
        available: 0,
        odds: 0,
      };
  }, [shelf]);

  return (
    /*
     * A fixed height, as the chases row had: everything between the box and the
     * Buy button is given room for its worst case and told to stay that size,
     * so swiping between boxes never moves the button out from under a thumb
     * already on its way down.
     */
    <div className="mx-auto w-full max-w-md shrink-0">
      <div className="flex items-center justify-between gap-3 px-0.5">
        <h2
          className="shimmer-text w-fit text-[13px] font-bold tracking-tight"
          style={{
            backgroundImage:
              "linear-gradient(100deg, #8a5a12 0%, #fbbf24 30%, #fff4d2 48%, #fbbf24 66%, #8a5a12 100%)",
          }}
        >
          Recent pulls
        </h2>

        {/* The whole breakdown, one tap away and off this screen. */}
        <Link
          href={`/stock?box=${productId}`}
          className="flex shrink-0 items-center gap-1 text-[12px] font-medium text-muted transition-colors hover:text-chalk"
        >
          Box details
          <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </Link>
      </div>

      <div className="mt-2 h-[4.5rem] [@media(max-height:720px)]:h-[3.75rem]">
        <AnimatePresence mode="wait">
          <motion.div
            key={productId}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="h-full"
          >
            {shown.length === 0 ? (
              <p className="flex h-full items-center justify-center rounded-2xl border border-dashed border-hairline text-[12px] text-faint">
                Nothing pulled from this box yet
              </p>
            ) : (
              <div
                ref={track}
                onPointerEnter={() => setPaused(true)}
                onPointerLeave={() => setPaused(false)}
                onPointerDown={() => setPaused(true)}
                /* `scroll-pl` as well as `pl`: a snap point aligns to the
                   scrollport, which ignores padding, so without it the browser
                   parks the first card against the edge of the phone and out of
                   line with the heading above it. */
                className="no-scrollbar -mx-5 flex h-full [overflow-anchor:none] snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain px-5 scroll-pl-5 sm:-mx-1 sm:px-1 sm:scroll-pl-1"
              >
                {/* `initial={false}`: the cards the page loads with are just
                    there. Only one that arrives afterwards animates in. */}
                <AnimatePresence initial={false}>
                  {shown.map((pull) => (
                    <PullCard
                      key={pull.orderId}
                      pull={pull}
                      now={now}
                      onSelect={() => setSelected(entryFor(pull))}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <PieceDetail
        entry={selected}
        productName={productName}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

function PullCard({
  pull,
  now,
  onSelect,
}: {
  pull: Pull;
  now: number | null;
  onSelect: () => void;
}) {
  const { piece } = pull;
  const c = RARITY_COLOR[piece.rarity];
  const lit = `inset 0 0 0 2px ${c}, inset 0 0 22px ${c}88`;
  const bright = `inset 0 0 0 2.5px ${c}, inset 0 0 30px ${c}cc`;
  const out = `inset 0 0 0 2px ${c}00, inset 0 0 22px ${c}00`;
  return (
    /* A new pull grows into its place at the front — from no width, pushing
       the rest along, so it is seen arriving rather than appearing — and
       lands lit in its rarity's colour: a ring and a wash of light that hold
       while it settles, then fade. The negative margin cancels the row's gap
       while the card has no width, so nothing beside it jumps. */
    <motion.button
      type="button"
      /* Inset, because the row scrolls sideways and so clips top and bottom:
         a glow drawn outside the card would be cut off flat. */
      initial={{
        width: "0rem",
        marginRight: "-0.5rem",
        opacity: 0,
        scale: 0.86,
        boxShadow: lit,
      }}
      animate={{
        width: "13.5rem",
        marginRight: "0rem",
        opacity: 1,
        scale: 1,
        // Lit, breathing brighter twice while it is held, then out.
        boxShadow: [lit, bright, lit, bright, lit, out],
      }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      transition={{
        width: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
        marginRight: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
        opacity: { duration: 0.35, delay: 0.1 },
        scale: { type: "spring", stiffness: 420, damping: 24, delay: 0.1 },
        // Held lit well after the card has landed, so it is seen standing
        // still, then an even fade rather than one that drops most of it at
        // once. The last quarter of the time is the fade.
        boxShadow: { duration: GLOW_S, times: [0, 0.2, 0.4, 0.58, 0.75, 1], ease: "easeInOut" },
      }}
      onClick={onSelect}
      aria-label={`${piece.name}, ${RARITY_LABEL[piece.rarity]}`}
      className="group flex h-full w-[13.5rem] shrink-0 snap-start items-center overflow-hidden gap-2.5 rounded-2xl border border-hairline bg-white/[0.04] p-2 text-left transition-colors hover:border-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400"
    >
      <span
        className="grid h-full w-[3.25rem] shrink-0 place-items-center overflow-hidden rounded-xl"
        style={{
          background: `radial-gradient(120% 90% at 50% 12%, ${piece.palette.wash}, #0b0b10 80%)`,
        }}
      >
        <PieceImage
          piece={piece}
          thumb
          className="h-[2.75rem] w-auto drop-shadow-[0_6px_12px_rgba(0,0,0,0.55)] transition-transform duration-300 group-hover:scale-[1.08]"
        />
      </span>

      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-[12.5px] font-semibold text-chalk">
          {piece.name}
        </span>
        {/* The rarity in its own colour, which is the part of a pull anybody
            reading this feed is actually weighing. */}
        <span
          className="truncate text-[10.5px] font-semibold uppercase tracking-[0.1em]"
          style={{ color: RARITY_COLOR[piece.rarity] }}
        >
          {RARITY_LABEL[piece.rarity]}
        </span>
        <span className="font-mono text-[10.5px] text-faint">
          {now === null ? " " : ago(pull.at, now)}
        </span>
      </span>
    </motion.button>
  );
}
