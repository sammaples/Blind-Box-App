"use client";

import { useEffect } from "react";

/**
 * Holds the page still while a sheet is open.
 *
 * A sheet is `position: fixed`, so it stays put on its own — but the page
 * behind it does not. Flick a thumb anywhere on a modal and the shop scrolls
 * underneath it, so closing the sheet drops you somewhere you never navigated
 * to. That is the "and it stays there" half of a bottom sheet.
 *
 * `overflow: hidden` on the body is the usual answer and it does not work on
 * iOS Safari, which happily keeps scrolling. Pinning the body with a negative
 * offset does work everywhere: the page cannot move, and the offset is what
 * keeps it looking unmoved while it is pinned. The scroll position is put back
 * on release, since fixing the body loses it.
 *
 * Locks are counted, so two overlapping sheets do not release each other's.
 */

let locks = 0;
let saved: { top: string; position: string; width: string; scrollY: number } | null = null;

export function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;

    if (locks === 0) {
      const { body } = document;
      const scrollY = window.scrollY;
      saved = {
        top: body.style.top,
        position: body.style.position,
        width: body.style.width,
        scrollY,
      };
      body.style.position = "fixed";
      body.style.top = `-${scrollY}px`;
      // Fixing the body collapses it to its content width without this.
      body.style.width = "100%";
    }
    locks += 1;

    return () => {
      locks -= 1;
      if (locks > 0 || !saved) return;

      const { body } = document;
      const { top, position, width, scrollY } = saved;
      saved = null;
      body.style.position = position;
      body.style.top = top;
      body.style.width = width;
      // Undoing `position: fixed` returns the page to the top, so put the
      // reader back where they were.
      window.scrollTo(0, scrollY);
    };
  }, [active]);
}
