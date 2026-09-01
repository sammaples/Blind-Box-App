import Link from "next/link";
import { Onboarding } from "@/components/Onboarding";
import { SetBrowser } from "@/components/SetBrowser";
import { Shop } from "@/components/Shop";
import { poolFor, SERIES_NUMBERS } from "@/lib/catalog";

const STEPS = [
  { n: "01", title: "Buy a sealed box", body: "Your piece is drawn and locked the moment you pay." },
  { n: "02", title: "Open it", body: "A real opening, with the odds already on the table." },
  { n: "03", title: "We ship it", body: "Add an address and the physical figure goes out to you." },
];

export default function HomePage() {
  const totalPieces = poolFor("series-roulette").length;

  return (
    <>
      <Onboarding />

      <section className="relative mx-auto w-full max-w-6xl px-5 pt-16 pb-20 sm:px-8 sm:pt-24">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-faint">
          {totalPieces} pieces · {SERIES_NUMBERS.length} series · rates published
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

      <Shop />
      <SetBrowser />
    </>
  );
}
