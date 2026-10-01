"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";

/**
 * Layout effect on the client, plain effect on the server.
 *
 * The rail's opening scroll position has to be set before the first paint or
 * it is a visible lurch, and only a layout effect runs that early — but React
 * warns about one during server rendering, where there is no layout to do.
 */
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * How many spare boxes are kept either side of the real run when it loops.
 *
 * This is what makes the wrap invisible: the box past the last one is already
 * on screen, drawn and in place, rather than something that has to be
 * scrolled to. One would do at rest, since a card is as wide as the rail and
 * you can never see two of them — the second is for a hard flick, which can
 * carry past a snap point before the rail is put back.
 *
 * Whole copies of the run would be simpler to reason about and cost a great
 * deal more: a carton is around six hundred elements, so three copies of four
 * boxes is seven thousand of them sitting in a phone's memory to make a wrap
 * work.
 */
const PAD = 2;

/** How long the rail has to be still before it counts as stopped. */
const SETTLE_MS = 140;

/**
 * How many of those to spend waiting for a glide that has not arrived.
 *
 * A smooth scroll asked for and not yet begun looks exactly like a rail at
 * rest, so there has to be some patience here — and a limit on it, because a
 * glide a finger interrupted will never arrive at all and the rail must not
 * be left unable to wrap.
 */
const STALLS = 6;

/**
 * Which box a slot in the padded strip is showing.
 *
 * Slots are positions in what is rendered; boxes are positions in the
 * catalogue. They are the same thing without the padding, and the whole of
 * the looping rail is the arithmetic between them.
 */
function boxAt(slot: number, count: number, looping: boolean): number {
  return looping ? (((slot - PAD) % count) + count) % count : slot;
}

/**
 * The boxes, as a rail you swipe.
 *
 * Built on CSS scroll-snap rather than a gesture handler, and that is the
 * whole design decision. A hand-rolled swipe means owning momentum, rubber
 * banding at the ends, what happens when a drag starts on a button, and every
 * input that is not a finger — and it means reimplementing all of it worse
 * than the browser already does. Snap gives all of that away for free, and it
 * also gives a trackpad, a shift-wheel, a keyboard and a screen reader a way
 * through, none of which a touch handler would have served.
 *
 * ── Looping ──────────────────────────────────────────────────────────────
 *
 * With `loop`, the rail has no ends: past diamond is bronze again, and left
 * of bronze is diamond. There is no CSS for that, so it is done the way every
 * infinite carousel is done — the run is padded at both ends with copies of
 * the boxes from the other end, and once the rail comes to rest on one of
 * those copies the scroll position is quietly moved a whole run along, onto
 * the real box it was standing in for. Nothing appears to happen, because the
 * two are identical: all that changes is how much rail is left either side.
 *
 * The "once it comes to rest" part is the load-bearing half. Setting
 * scrollLeft during a flick kills the browser's momentum mid-glide, which
 * feels like the rail catching on something — so the seam is only ever
 * crossed after the scroll has stopped, snapped, and stayed stopped.
 */
export function BoxCarousel({
  children,
  onActive,
  backdrop,
  loop = false,
  fill = false,
  onTrackHeight,
}: {
  children: ReactNode;
  /** Told whenever the centred card changes, so a panel outside the rail can
      follow it without being inside it and scrolling away. */
  onActive?: (index: number) => void;
  /**
   * Drawn behind the boxes, centred on the rail and outside it.
   *
   * Outside is the point. A horizontally scrolling element clips its other
   * axis too — CSS will not let `overflow-x: auto` keep `overflow-y: visible`,
   * it computes to auto — so a glow rendered among the cards is sliced off
   * flat at the rail's top and bottom edges, which reads as letterboxing.
   * Here it is a sibling of the scroller, and nothing crops it.
   */
  backdrop?: ReactNode;
  /** Whether the rail wraps around instead of stopping at either end. */
  loop?: boolean;
  /**
   * Take whatever height the parent gives, instead of being as tall as the
   * boxes. For a screen laid out to fit exactly, where the rail is the part
   * that gives way.
   */
  fill?: boolean;
  /** Told the track's height whenever it changes, so the boxes can be sized to it. */
  onTrackHeight?: (height: number) => void;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  // Counted from the children, not measured from the DOM. Measuring meant the
  // dots could not exist until an effect had run, so they popped in a frame
  // after the cards — and on a slow phone that is a visible flash of a rail
  // with no position indicator, on the one screen that most needs one.
  const count = Children.count(children);
  const looping = loop && count > 1;

  // Where we are in the rendered strip, clones and all, as against `active`
  // which is a box in the catalogue. A ref because nothing draws from it and
  // a scroll must not rerender to keep it current.
  const rendered = useRef(0);
  // Where a glide of our own is heading, or null if nothing was asked for.
  // The wrap has to know: a smooth scroll that has been requested but has not
  // started moving yet is indistinguishable from a rail standing still, and
  // moving the rail under one sends it to an address that no longer means
  // what it meant — which is a box sliding away from under a thumb.
  const glide = useRef<number | null>(null);

  const items = Children.toArray(children);
  const rail = looping
    ? Array.from({ length: count + PAD * 2 }, (_, slot) => {
        const child = items[(((slot - PAD) % count) + count) % count];
        // Rekeyed by slot: the same child in two places is two elements as
        // far as React is concerned, and they have to be told apart or one
        // of them is dropped.
        return isValidElement(child) ? cloneElement(child, { key: `slot${slot}` }) : child;
      })
    : items;

  const cardsOf = useCallback((el: HTMLElement) => {
    return [...el.querySelectorAll<HTMLElement>("[data-box-card]")];
  }, []);

  /**
   * Which card is centred.
   *
   * Measured from scroll position rather than watched with an observer: a
   * snap rail has exactly one answer at rest — the card whose middle is
   * nearest the track's middle — and computing it directly is both simpler
   * and right during the scroll as well as after it.
   */
  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const cards = cardsOf(el);
    if (cards.length === 0) return;

    // The ends are pinned rather than measured.
    //
    // Nearest-to-centre is the right answer in the middle of the rail and the
    // wrong one at either end of a wide screen: parked at the very start with
    // three cards on show, the card nearest the middle is the second one, so
    // the first dot never lights even though nothing has been scrolled. At an
    // end, the answer people expect is the end.
    //
    // A looping rail has no ends to pin. It is never parked at one either —
    // it rests in the middle copy, where there is always rail to spare on
    // both sides and the nearest card is simply the snapped one.
    if (!looping) {
      const max = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft <= 1) {
        rendered.current = 0;
        setActive(0);
        return;
      }
      if (el.scrollLeft >= max - 1) {
        rendered.current = cards.length - 1;
        setActive(cards.length - 1);
        return;
      }
    }

    const middle = el.scrollLeft + el.clientWidth / 2;
    let nearest = 0;
    let best = Infinity;
    cards.forEach((card, i) => {
      const distance = Math.abs(card.offsetLeft + card.offsetWidth / 2 - middle);
      if (distance < best) {
        best = distance;
        nearest = i;
      }
    });
    rendered.current = nearest;
    // While one of our glides is under way the answer is where it is going,
    // not where it has got to — the tap already said which box. Following the
    // scroll instead would show the old box until the rail was halfway over,
    // which reads as the screen lagging behind the tap.
    if (glide.current === null) setActive(boxAt(nearest, count, looping));
  }, [cardsOf, count, looping]);

  /**
   * The width of one whole copy of the rail.
   *
   * Measured off the cards rather than worked out from widths and gaps,
   * because a difference of two offsets already contains the gap, the
   * padding and whatever a browser does with sub-pixel widths. Getting this
   * wrong by one pixel would mean the wrap left the rail a pixel off its
   * snap point, every single time round.
   */
  const copyWidth = useCallback(() => {
    const el = track.current;
    if (!el) return 0;
    const cards = cardsOf(el);
    if (cards.length <= count) return 0;
    return cards[count].offsetLeft - cards[0].offsetLeft;
  }, [cardsOf, count]);

  /** Moves the rail with no animation, whatever a stylesheet has asked for. */
  const jump = useCallback((left: number) => {
    const el = track.current;
    if (!el) return;
    const behaviour = el.style.scrollBehavior;
    el.style.scrollBehavior = "auto";
    el.scrollLeft = left;
    el.style.scrollBehavior = behaviour;
  }, []);

  /**
   * Slides the rail to a card, animated, the way a tap or an arrow should —
   * and says which box it is going to straight away, so the name, the rates
   * and the light change on the tap rather than halfway through the slide.
   */
  const glideTo = useCallback((card: HTMLElement, slot: number) => {
    const el = track.current;
    if (!el) return;
    const left = card.offsetLeft + card.offsetWidth / 2 - el.clientWidth / 2;
    glide.current = left;
    setActive(boxAt(slot, count, looping));
    el.scrollTo({
      left,
      // Honoured by the browser, which turns it off by itself when the
      // reader has asked for reduced motion — so there is nothing to check.
      behavior: "smooth",
    });
  }, [count, looping]);

  /**
   * Puts the rail back in the middle copy, if it has wandered out of it.
   *
   * Called only once the rail is still. The move is a whole copy's width, so
   * the box under your eyes does not change and neither does its position on
   * screen — all that changes is that there is a full copy of rail to spare
   * again in the direction you were heading.
   */
  const recentre = useCallback(() => {
    if (!looping) return;
    const el = track.current;
    if (!el) return;
    const width = copyWidth();
    if (width <= 0) return;
    // The rail rests on the real run, slots PAD through PAD + count - 1.
    // Anywhere else is a padding copy, and standing on one means the same box
    // is available a whole run away, where there is spare rail again.
    if (rendered.current < PAD) {
      jump(el.scrollLeft + width);
      rendered.current += count;
    } else if (rendered.current >= PAD + count) {
      jump(el.scrollLeft - width);
      rendered.current -= count;
    }
  }, [copyWidth, count, jump, looping]);

  // Open on the first real box rather than at slot zero, before the first
  // paint. Start at the left edge and the rail has nothing to its left, which
  // is the one thing looping is for.
  useIsoLayoutEffect(() => {
    if (!looping) return;
    const el = track.current;
    if (!el) return;
    const first = cardsOf(el)[PAD];
    if (!first) return;
    jump(first.offsetLeft + first.offsetWidth / 2 - el.clientWidth / 2);
    rendered.current = PAD;
  }, [cardsOf, jump, looping]);

  // Measured before paint, so boxes sized from it are the right size in the
  // first frame they are seen rather than one frame later.
  useIsoLayoutEffect(() => {
    const el = track.current;
    if (!el || !onTrackHeight) return;
    onTrackHeight(el.clientHeight);
    const watch = new ResizeObserver(() => onTrackHeight(el.clientHeight));
    watch.observe(el);
    return () => watch.disconnect();
  }, [onTrackHeight]);

  // Reported out on change rather than on every frame of a scroll: the panel
  // below rerenders on this, and a scroll fires far more often than the
  // centred card actually changes.
  useEffect(() => {
    onActive?.(active);
  }, [active, onActive]);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    measure();

    // Coalesced to a frame: a scroll event fires far more often than a dot
    // can usefully change, and doing layout reads on every one of them is
    // how a smooth rail starts stuttering on a cheap phone.
    let frame = 0;
    // Reset by every scroll event, so only the last one of a flick lives
    // long enough to fire.
    let settle = 0;
    let seen = -1;
    let stalls = 0;

    const again = () => {
      window.clearTimeout(settle);
      settle = window.setTimeout(check, SETTLE_MS);
    };

    /**
     * Is the rail stopped, and if so, does it need putting back?
     *
     * Two things have to be true before the seam may be crossed, and both of
     * them are here because getting either wrong is visible. The rail has to
     * have actually stopped, which is two readings of the same number rather
     * than the absence of an event. And nothing of ours may be on its way
     * anywhere: a glide carries an address, and moving the rail out from
     * under one does not move the address with it, so the box would arrive
     * somewhere nobody asked it to go.
     */
    function check() {
      const el = track.current;
      if (!el) return;
      measure();

      if (el.scrollLeft !== seen) {
        seen = el.scrollLeft;
        stalls = 0;
        again();
        return;
      }

      if (glide.current !== null && Math.abs(el.scrollLeft - glide.current) > 1) {
        // Asked for and not arrived. Either it has not begun or a finger took
        // the rail off it; wait a few beats for the first, give up for the
        // second.
        if (++stalls < STALLS) {
          again();
          return;
        }
      }

      glide.current = null;
      stalls = 0;
      recentre();
    }

    const onScroll = () => {
      seen = el.scrollLeft;
      stalls = 0;
      again();

      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        measure();
      });
    };

    /*
     * A hand on the rail cancels whatever we had asked it to do, the same way
     * it cancels the browser's own smooth scroll — and, if the rail is resting
     * on a padding copy, puts it back on the real run before the finger moves.
     *
     * This is what lets a fast swiper go round and round. Waiting for the rail
     * to sit still first is right in general, but somebody swiping box after
     * box never lets it: each swipe lands just as the next one starts, so the
     * rail never rested, never wrapped, and one lap in it ran out of padding —
     * stuck on the last copy (silver, with four boxes) until it was left alone
     * long enough to wrap. The arrows never had this, because a tap on one
     * puts the rail back first; this does the same for a finger.
     *
     * Only when it is resting exactly on a box. A finger landing mid-glide
     * stops the rail between two boxes, and a jump from there lands between
     * two boxes too, where the browser's snapping is free to pull it to one
     * side under the finger. Resting on a box, the jump lands exactly on the
     * same box a copy away, and there is nothing to see.
     */
    const onTakeOver = () => {
      glide.current = null;
      if (!looping) return;
      measure();
      const card = cardsOf(el)[rendered.current];
      if (!card) return;
      const centred = card.offsetLeft + card.offsetWidth / 2 - el.clientWidth / 2;
      if (Math.abs(el.scrollLeft - centred) <= 1) recentre();
    };

    // Where the browser can say a scroll has finished — snap included — it is
    // believed straight away rather than waited out. The timer stays for the
    // browsers that cannot.
    const onScrollEnd = () => {
      window.clearTimeout(settle);
      check();
    };

    const onResize = () => {
      measure();
      recentre();
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("scrollend", onScrollEnd);
    el.addEventListener("pointerdown", onTakeOver, { passive: true });
    el.addEventListener("touchstart", onTakeOver, { passive: true });
    el.addEventListener("wheel", onTakeOver, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.clearTimeout(settle);
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("scrollend", onScrollEnd);
      el.removeEventListener("pointerdown", onTakeOver);
      el.removeEventListener("touchstart", onTakeOver);
      el.removeEventListener("wheel", onTakeOver);
      window.removeEventListener("resize", onResize);
    };
  }, [cardsOf, looping, measure, recentre]);

  /**
   * One box along, in the direction given.
   *
   * Relative, not an index into the catalogue, because in a looping rail the
   * box after diamond is the first box of the next copy — a neighbour in the
   * strip. Asking for a neighbour is always answerable; asking for "index 4
   * of 4" is not.
   */
  const step = useCallback(
    (delta: number) => {
      const el = track.current;
      if (!el) return;
      // Put the rail back first, so "one along" is counted from a real box
      // and not from a padding copy somebody is part-way through. The move is
      // instant and invisible, and it is what lets the arrows be hammered.
      recentre();
      const cards = cardsOf(el);
      const slot = Math.max(0, Math.min(rendered.current + delta, cards.length - 1));
      const card = cards[slot];
      if (card) glideTo(card, slot);
    },
    [cardsOf, glideTo, recentre],
  );

  /**
   * Straight to a box, by its place in the catalogue.
   *
   * The nearest copy of it wins. From bronze, the diamond dot is one box to
   * the left as well as three to the right, and going the short way is both
   * what the arrows would do and what the rail looks like it should do.
   */
  const goTo = useCallback(
    (index: number) => {
      const el = track.current;
      if (!el) return;
      recentre();
      const cards = cardsOf(el);
      if (cards.length === 0) return;

      let nearest = -1;
      let best = Infinity;
      cards.forEach((_, i) => {
        if (boxAt(i, count, looping) !== index) return;
        const distance = Math.abs(i - rendered.current);
        if (distance < best) {
          best = distance;
          nearest = i;
        }
      });

      const slot = nearest >= 0 ? nearest : Math.min(index, cards.length - 1);
      const card = cards[slot];
      if (card) glideTo(card, slot);
    },
    [cardsOf, count, glideTo, looping, recentre],
  );

  return (
    <div className={fill ? "relative mt-5 flex min-h-0 flex-1 flex-col [@media(max-height:720px)]:mt-3" : "relative mt-8"}>
      {/*
        The rail and the light it sits in, as siblings. `isolate` keeps the
        backdrop's negative layer from sinking behind the page rather than
        just behind the boxes, and the wrapper is sized by the scroller alone
        so the light is centred on the boxes and not on the dots as well.

        The backdrop reaches the screen edges, like the rail does, and clips
        there sideways only. The light is wider than a phone, and left alone
        it made the whole document wider than one — which Chrome hides and
        iOS Safari lets you pan into. `overflow-x: clip` is the one value that
        does not drag the other axis along with it, the way `hidden` or `auto`
        would: the light is cut at the edges of the glass, where a cut is
        invisible, and still runs free above and below.
      */}
      <div className={fill ? "relative isolate min-h-0 flex-1" : "relative isolate"}>
        {backdrop && (
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-x-5 inset-y-0 -z-10 overflow-x-clip sm:-inset-x-8"
          >
            {backdrop}
          </div>
        )}

        <div
          ref={track}
          role="group"
          aria-roledescription="carousel"
          aria-label="Boxes for sale"
          /*
            The negative margin pulls the rail out to the screen edges while the
            padding keeps the first card lined up with the heading above it. Cards
            then scroll off the edge of the phone rather than stopping inside a
            gutter, which is what makes it feel like a rail rather than a box
            with things sliding about inside it.
          */
          className={`no-scrollbar -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain px-5 pb-2 sm:-mx-8 sm:px-8 ${fill ? "h-full" : ""}`}
        >
          {rail}
        </div>
      </div>

      {count > 1 && (
        <div className="mt-3 flex shrink-0 items-center justify-center gap-3">
          {/*
            Arrows for everything that is not a finger. A trackpad can swipe
            this and a phone obviously can, but a mouse has no gesture for it
            at all — so on a pointer device there has to be something to click.
            Never dead when the rail loops: there is always a box that way.
          */}
          <Arrow
            direction="prev"
            disabled={!looping && active === 0}
            onClick={() => step(-1)}
          />

          <div className="flex items-center gap-2">
            {Array.from({ length: count }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Box ${i + 1} of ${count}`}
                aria-current={i === active}
                className="p-1.5"
              >
                <span
                  className={`block size-1.5 rounded-full transition-all ${
                    i === active ? "w-5 bg-chalk" : "bg-white/25"
                  }`}
                />
              </button>
            ))}
          </div>

          <Arrow
            direction="next"
            disabled={!looping && active >= count - 1}
            onClick={() => step(1)}
          />
        </div>
      )}
    </div>
  );
}

function Arrow({
  direction,
  disabled,
  onClick,
}: {
  direction: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "prev" ? "Previous box" : "Next box"}
      className="grid size-8 shrink-0 place-items-center rounded-full border border-hairline text-muted transition-colors hover:border-white/30 hover:text-chalk disabled:opacity-30 disabled:hover:border-hairline"
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d={direction === "prev" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
      </svg>
    </button>
  );
}
