"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
const ROTATE_MS = 3400;

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
  const track = useRef<HTMLDivElement>(null);

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
    if (paused || selected || pulls.length < 2) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    // The row is looked up on every tick rather than once: switching boxes
    // swaps it for a new element after the old one has faded out, and an
    // interval holding the first one would go on scrolling a detached node.
    const id = setInterval(() => {
      const el = track.current;
      const card = el?.firstElementChild as HTMLElement | null | undefined;
      if (!el || !card) return;
      const step = card.offsetWidth + 8;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
      el.scrollTo({ left: atEnd ? 0 : el.scrollLeft + step, behavior: "smooth" });
    }, ROTATE_MS);
    return () => clearInterval(id);
    // The box and the newest pull are dependencies so the clock restarts on a
    // new box or a new pull, rather than moving the card that just came into
    // view on a moment after it got there.
  }, [paused, selected, pulls.length, productId, pulls[0]?.orderId]);

  /*
   * A new pull, live.
   *
   * It arrives at the front of the list, which is usually off the left of the
   * row, since the row has been moving along by itself. Left alone, the cards
   * in view would jump a place to the right the instant it lands. So first
   * the row is shifted by exactly the width that was added, before paint,
   * which leaves what is on screen standing still — and then, unless somebody
   * has a finger on the row or a sheet open, it glides back to the start so
   * the new one is the thing in front of you. Someone mid-swipe keeps their
   * place; the new card waits at the front for them.
   *
   * A list that does not contain the old first pull at all is a different
   * box's list, not news, and is left to the box's own fade.
   */
  const firstId = useRef(pulls[0]?.orderId);
  const holding = useRef(false);
  holding.current = paused || selected !== null;
  useLayoutEffect(() => {
    const before = firstId.current;
    firstId.current = pulls[0]?.orderId;
    const el = track.current;
    if (!el || !before || before === pulls[0]?.orderId) return;

    const added = pulls.findIndex((p) => p.orderId === before);
    if (added <= 0) return;

    const card = el.firstElementChild as HTMLElement | null;
    if (!card) return;
    if (el.scrollLeft > 4) el.scrollLeft += added * (card.offsetWidth + 8);

    if (holding.current) return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: 0, behavior: reduced ? "auto" : "smooth" });
  }, [pulls]);

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
            {pulls.length === 0 ? (
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
                className="no-scrollbar -mx-5 flex h-full snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain px-5 scroll-pl-5 sm:-mx-1 sm:px-1 sm:scroll-pl-1"
              >
                {/* `initial={false}`: the cards the page loads with are just
                    there. Only one that arrives afterwards animates in. */}
                <AnimatePresence initial={false}>
                  {pulls.map((pull) => (
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
  return (
    /* A new pull lands with a small pop in its rarity's colour — a ring that
       lights and fades — so it reads as something that just happened rather
       than the row reshuffling. Scale and opacity only: its width is there
       from the first frame, which is what lets the row above shift by exactly
       one card without a jump. */
    <motion.button
      type="button"
      /* Inset, because the row scrolls sideways and so clips top and bottom:
         a ring drawn outside the card would be cut off flat. */
      initial={{ opacity: 0, scale: 0.86, boxShadow: `inset 0 0 0 2px ${RARITY_COLOR[piece.rarity]}` }}
      animate={{ opacity: 1, scale: 1, boxShadow: `inset 0 0 0 2px ${RARITY_COLOR[piece.rarity]}00` }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      transition={{
        opacity: { duration: 0.3 },
        scale: { type: "spring", stiffness: 420, damping: 24 },
        // Held lit for a second after the card has landed, so it is seen
        // standing still and not only while the row glides — then an even
        // fade, not an ease-out that drops most of it in the first instant.
        boxShadow: { duration: 1.3, ease: "easeInOut", delay: 1.1 },
      }}
      onClick={onSelect}
      aria-label={`${piece.name}, ${RARITY_LABEL[piece.rarity]}`}
      className="group flex h-full w-[13.5rem] shrink-0 snap-start items-center gap-2.5 rounded-2xl border border-hairline bg-white/[0.04] p-2 text-left transition-colors hover:border-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400"
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
