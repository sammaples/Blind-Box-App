import Link from "next/link";
import { Onboarding } from "@/components/Onboarding";
import { SetBrowser } from "@/components/SetBrowser";
import { Shop } from "@/components/Shop";
import { PRODUCTS } from "@/lib/catalog";
import { shelfFor } from "@/lib/stock";
import type { StockEntry } from "@/lib/types";

const STEPS = [
  { n: "01", title: "Choose a box", body: "Pick from our selection of boxes you want to open." },
  { n: "02", title: "Open it", body: "Tap to open and reveal your prize." },
  { n: "03", title: "We ship it", body: "Your items are shipped directly to you." },
];

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Loaded per request: stock moves every time a box sells.
  const shelves: Record<string, StockEntry[]> = Object.fromEntries(
    await Promise.all(
      PRODUCTS.map(async (p) => [p.id, await shelfFor(p.id)] as const),
    ),
  );

  const inStock = Object.values(shelves)
    .flat()
    .filter((entry) => entry.available > 0);
  const unitsLeft = inStock.reduce((sum, entry) => sum + entry.available, 0);

  return (
    <>
      <Onboarding />

      <section className="relative mx-auto w-full max-w-6xl px-5 pt-16 pb-20 sm:px-8 sm:pt-24">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-faint">
          {inStock.length} pieces in stock · {unitsLeft.toLocaleString()} units · rates
          published
        </p>
        <h1 className="mt-5 max-w-3xl text-balance text-5xl font-semibold leading-[0.98] tracking-[-0.03em] sm:text-7xl">
          Open it here.
          <br />
          <span className="text-muted">Keep it for real.</span>
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-muted">
          A digital blind box with a physical piece behind it. Buy one box, open it on
          screen, and the figure you pulled gets packed and shipped to your door.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="#shop"
            className="rounded-full bg-chalk px-7 py-3.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.03] active:scale-[0.98]"
          >
            Buy a box
          </Link>
          <Link
            href="#set"
            className="rounded-full border border-hairline px-7 py-3.5 text-sm font-medium text-muted transition-colors hover:border-white/30 hover:text-chalk"
          >
            See every piece
          </Link>
        </div>

        <ol className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-3">
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
