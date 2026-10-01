import type { Metadata } from "next";
import Link from "next/link";
import { SectionLabel } from "@/components/ui";
import { HOW_IT_WORKS } from "@/lib/howItWorks";

export const metadata: Metadata = {
  title: "How it works — Blind Box",
  description:
    "Open a sealed blind box, keep what you pull in your vault, and send the pieces you want in one parcel for a flat $5.",
};

/**
 * A page of its own rather than a slab on the front. The shop opens the same
 * steps in a card from the "?" beside its heading; this is the linkable copy.
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
        {HOW_IT_WORKS.map((step) => (
          <li key={step.title} className="bg-ink-card p-6 sm:p-7">
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
