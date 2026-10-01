import { Lobster_Two } from "next/font/google";

/**
 * The wordmark's face — a heavy brush script, the one thing on the page that is
 * not the interface typeface. Bold italic on purpose: the weight and the lean
 * are what make it read as a painted sign rather than handwriting.
 *
 * Loaded through next/font rather than a stylesheet link: it is self-hosted at
 * build time, so the name is painted in its own face on first frame instead of
 * appearing in a fallback and then jumping. `display: swap` keeps the header
 * readable if that ever fails. Shared here so the header and the sign-in
 * screen set the name in the same face.
 */
export const wordmark = Lobster_Two({
  weight: "700",
  style: "italic",
  subsets: ["latin"],
  display: "swap",
});
