import Link from "next/link";
import { ScrollToHash } from "@/components/ScrollToHash";
import { SetBrowser } from "@/components/SetBrowser";
import { Shop } from "@/components/Shop";
import { SectionLabel } from "@/components/ui";
import { PRODUCTS } from "@/lib/catalog";
import { shelfFor } from "@/lib/stock";
import type { StockEntry } from "@/lib/types";

/**
 * Four steps, because there are four.
 *
 * The old third step said "we ship it", which stopped being true when
 * bundling arrived: nothing ships until you choose to send it, and what you
 * send goes in one parcel. That is the part people get wrong if nobody tells
 * them — they expect a box per pull and a postage charge per box.
 *
 * Written short and flat on purpose. No "curated", no "seamlessly", no
 * sentence that needs reading twice. The price is a number rather than a
 * policy, because "flat rate" is a phrase people skip and "$5" is not.
 */
const STEPS = [
  { n: "01", title: "Open", body: "Choose a box and open it." },
  {
    n: "02",
    title: "Collect",
    body: "Everything you open goes straight to your vault until you're ready to ship them.",
  },
  {
    n: "03",
    title: "Ship",
    body: "Choose which pieces you want to send. Shipping is always $5, no matter how many pieces.",
  },
];

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Loaded per request: stock moves every time a box sells.
  const shelves: Record<string, StockEntry[]> = Object.fromEntries(
    await Promise.all(
      PRODUCTS.map(async (p) => [p.id, await shelfFor(p.id)] as const),
    ),
  );

  return (
    <>
      {/* "Open another" aims at #shop from another route; without this the
          fragment can resolve before the section exists and land at the top. */}
      <ScrollToHash />

      <section className="relative mx-auto w-full max-w-6xl px-5 pt-16 pb-20 sm:px-8 sm:pt-24">
        <h1 className="max-w-3xl text-balance text-5xl font-semibold leading-[0.98] tracking-[-0.03em] sm:text-7xl">
          Open it here.
          <br />
          <span className="text-muted">Keep it for real.</span>
        </h1>
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link
            href="#shop"
            className="gloss gloss-chalk rounded-full px-7 py-3.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.03] active:scale-[0.98]"
          >
            Buy a box
          </Link>
          <Link
            href="#set"
            className="rounded-full border border-hairline px-7 py-3.5 text-sm font-medium text-muted transition-colors hover:border-white/30 hover:text-chalk"
          >
            See current stock
          </Link>
        </div>

        <div className="mt-16">
          <SectionLabel>How it works</SectionLabel>
        </div>
        {/* Two up on a small screen and four across on a wide one. Three
            columns for four steps leaves one stranded on its own row. */}
        <ol className="mt-5 grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline md:grid-cols-3">
          {STEPS.map((step) => (
            <li key={step.n} className="bg-ink-card p-6">
              <p className="font-mono text-xs text-faint">{step.n}</p>
              <p className="mt-3 text-sm font-semibold">{step.title}</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <Shop shelves={shelves} />
      <SetBrowser shelves={shelves} />
    </>
  );
}
