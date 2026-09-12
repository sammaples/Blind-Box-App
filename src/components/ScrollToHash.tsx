"use client";

import { useEffect } from "react";

/**
 * Lands a #hash link on its section, even when the page arrives after the
 * hash does.
 *
 * A browser resolves a fragment against the document it already has. Arriving
 * from another route that document is the shell, streamed in pieces, and the
 * section being aimed at may not exist yet — so the fragment resolves against
 * nothing and the page sits at the top. It is a race, which is the worst kind
 * of layout bug: it lands correctly on a fast connection, on a warm cache, and
 * on every machine you test it on.
 *
 * So the scroll is done here instead of being left to timing. It waits for the
 * element rather than assuming it, and it runs once on mount, so it never
 * yanks anyone back to a section they have already scrolled away from.
 */
export function ScrollToHash() {
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id) return;

    // A couple of dozen frames is well past any reasonable stream, and
    // giving up quietly is the right failure: the page is simply where the
    // browser left it.
    let frames = 0;
    let raf = 0;

    const settle = () => {
      const target = document.getElementById(id);
      if (target) {
        // Checked rather than assumed. Scrolling once is not enough on its
        // own: anything that restores scroll position after hydration would
        // undo it, and we would never know. This keeps correcting until the
        // section is actually up there, then stops.
        //
        // "Up there" is not zero — scroll-margin-top on the section holds the
        // heading clear of the sticky header, and scrollIntoView honours it.
        if (Math.abs(target.getBoundingClientRect().top) < 100) return;
        target.scrollIntoView({ block: "start" });
      }
      if (frames++ < 30) raf = requestAnimationFrame(settle);
    };

    raf = requestAnimationFrame(settle);
    return () => cancelAnimationFrame(raf);
  }, []);

  return null;
}
