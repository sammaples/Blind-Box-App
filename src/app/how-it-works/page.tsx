import type { Metadata } from "next";
import Link from "next/link";
import { SectionLabel } from "@/components/ui";

export const metadata: Metadata = {
  title: "How it works — Blind Box",
  description:
    "Open a sealed blind box, keep what you pull in your vault, and send the pieces you want in one parcel for a flat $5.",
};

/**
 * Three steps, because there are three.
 *
 * The old third step said "we ship it", which stopped being true when
 * bundling arrived: nothing ships until you choose to send it, and what you
 * send goes in one parcel. That is the part people get wrong if nobody tells
 * them — they expect a box per pull and a postage charge per box.
 *
 * Written short and flat on purpose. No "curated", no "seamlessly", no
 * sentence that needs reading twice. The price is a number rather than a
 * policy, because "flat rate" is a phrase people skip and "$5" is not.
 *
 * These are the same three cards the welcome screen shows, and they say the
 * same things in the same order for the same reason: two explanations of one
 * product are two things to keep in step, and the one nobody notices going
 * stale is the one nobody is looking at.
 */
const STEPS = [
  {
    n: "01",
    title: "Open",
    body: "Choose a box and open it. What is inside is drawn when you buy, against rates published per piece.",
  },
  {
    n: "02",
    title: "Collect",
    body: "Everything you open goes straight to your vault. Nothing ships until you say so, and nothing expires.",
  },
  {
    n: "03",
    title: "Ship",
    body: "Pick what you want sent and it goes in one parcel. Shipping is always $5, however many pieces are in it.",
  },
];

/**
 * A page of its own rather than a slab on the front.
 *
 * It was three cards in the middle of the home page, between the headline and
 * the boxes — which put an explanation in front of the thing being explained
 * and pushed the shop down the screen. Anybody who needs it can reach it from
 * the nav; anybody who does not gets to the boxes sooner.
 */
export default function HowItWorksPage() {
  return (
    <section className="relative mx-auto w-full max-w-3xl px-5 pb-24 pt-16 sm:px-8 sm:pt-24">
      <SectionLabel>How it works</SectionLabel>
      <h1 className="mt-4 text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.03em] sm:text-5xl">
        Open it here.
        <br />
        <span className="text-muted">Keep it for real.</span>
      </h1>

      {/* One per row, not a grid. There are three and they happen in order —
          side by side they read as options to choose between. */}
      <ol className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline">
        {STEPS.map((step) => (
          <li key={step.n} className="flex gap-5 bg-ink-card p-6 sm:gap-6 sm:p-7">
            <p className="mt-0.5 font-mono text-xs text-faint">{step.n}</p>
            <div>
              <p className="text-base font-semibold">{step.title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-10">
        <Link
          href="/#shop"
          className="gloss gloss-chalk inline-block rounded-full px-7 py-3.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.03] active:scale-[0.98]"
        >
          Pick a box
        </Link>
      </div>
    </section>
  );
}
