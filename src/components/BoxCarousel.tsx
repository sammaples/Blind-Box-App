"use client";

import { Children, useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

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
 * What is left to write is the part the browser has no opinion about: saying
 * which box you are on, and letting somebody jump to one.
 */
export function BoxCarousel({ children }: { children: ReactNode }) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  // Counted from the children, not measured from the DOM. Measuring meant the
  // dots could not exist until an effect had run, so they popped in a frame
  // after the cards — and on a slow phone that is a visible flash of a rail
  // with no position indicator, on the one screen that most needs one.
  const count = Children.count(children);

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
    const cards = [...el.querySelectorAll<HTMLElement>("[data-box-card]")];
    if (cards.length === 0) return;

    // The ends are pinned rather than measured.
    //
    // Nearest-to-centre is the right answer in the middle of the rail and the
    // wrong one at either end of a wide screen: parked at the very start with
    // three cards on show, the card nearest the middle is the second one, so
    // the first dot never lights even though nothing has been scrolled. At an
    // end, the answer people expect is the end.
    const max = el.scrollWidth - el.clientWidth;
    if (el.scrollLeft <= 1) {
      setActive(0);
      return;
    }
    if (el.scrollLeft >= max - 1) {
      setActive(cards.length - 1);
      return;
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
    setActive(nearest);
  }, []);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    measure();

    // Coalesced to a frame: a scroll event fires far more often than a dot
    // can usefully change, and doing layout reads on every one of them is
    // how a smooth rail starts stuttering on a cheap phone.
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        measure();
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  const goTo = useCallback((index: number) => {
    const el = track.current;
    if (!el) return;
    const cards = [...el.querySelectorAll<HTMLElement>("[data-box-card]")];
    const card = cards[Math.max(0, Math.min(index, cards.length - 1))];
    if (!card) return;
    el.scrollTo({
      left: card.offsetLeft + card.offsetWidth / 2 - el.clientWidth / 2,
      // Honoured by the browser, which turns it off by itself when the
      // reader has asked for reduced motion — so there is nothing to check.
      behavior: "smooth",
    });
  }, []);

  return (
    <div className="relative mt-8">
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
        className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain px-5 pb-2 sm:-mx-8 sm:px-8"
      >
        {children}
      </div>

      {count > 1 && (
        <div className="mt-5 flex items-center justify-center gap-3">
          {/*
            Arrows for everything that is not a finger. A trackpad can swipe
            this and a phone obviously can, but a mouse has no gesture for it
            at all — so on a pointer device there has to be something to click.
          */}
          <Arrow
            direction="prev"
            disabled={active === 0}
            onClick={() => goTo(active - 1)}
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
            disabled={active >= count - 1}
            onClick={() => goTo(active + 1)}
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
