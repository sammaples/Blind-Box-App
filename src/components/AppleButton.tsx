"use client";

/**
 * The Apple mark, drawn rather than fetched.
 *
 * Apple's guidelines are specific about this button: their logo, their
 * wording, a minimum height, and the padding around the mark. Inlining the
 * path keeps it crisp at any size and means the button never waits on an
 * image — which matters, because this is now the only way in.
 */
function AppleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M17.05 12.53c-.02-2.2 1.8-3.26 1.88-3.31-1.02-1.5-2.62-1.7-3.19-1.72-1.36-.14-2.65.8-3.34.8-.69 0-1.75-.78-2.88-.76-1.48.02-2.85.86-3.61 2.18-1.54 2.67-.39 6.62 1.11 8.79.73 1.06 1.61 2.25 2.75 2.21 1.1-.04 1.52-.71 2.85-.71 1.33 0 1.71.71 2.88.69 1.19-.02 1.94-1.08 2.67-2.14.84-1.23 1.19-2.42 1.21-2.48-.03-.01-2.32-.89-2.33-3.55zM14.88 5.6c.6-.74 1.01-1.76.9-2.78-.87.04-1.93.58-2.56 1.31-.56.65-1.06 1.69-.93 2.69.97.07 1.97-.49 2.59-1.22z" />
    </svg>
  );
}

/**
 * Continue with Apple.
 *
 * A plain link, not a fetch. The whole point of the flow is to hand the
 * browser to Apple and let it come back with a form post, and an anchor does
 * that without a line of JavaScript — which also means it still works if the
 * page's hydration has not finished when somebody taps it.
 *
 * `next` rides along so a visitor who was sent here from the checkout sheet
 * lands back on the checkout sheet rather than the front page.
 */
export function AppleButton({
  next,
  label = "Continue with Apple",
  className = "",
}: {
  next?: string;
  label?: string;
  className?: string;
}) {
  const href = next
    ? `/auth/apple?next=${encodeURIComponent(next)}`
    : "/auth/apple";

  return (
    <a
      href={href}
      className={
        // Black on white is Apple's own light treatment, and it is the one
        // that reads on this app's near-black. The height is theirs too.
        "flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white " +
        "text-[15px] font-medium text-black transition-transform " +
        "hover:scale-[1.01] active:scale-[0.99] " +
        className
      }
    >
      {/* Optically centred: the mark's own bounding box sits low, so it is
          nudged up a pixel to share a centre line with the text beside it. */}
      <AppleMark className="size-5 -translate-y-px" />
      {label}
    </a>
  );
}
