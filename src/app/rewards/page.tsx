import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Rewards — Blind Box",
  description: "Ways to earn coins beyond opening boxes — daily sign-ins and more, on the way.",
};

/**
 * Held for what comes next: the other ways to earn coins — a daily sign-in,
 * and whatever follows it. Opening a box already earns them; this tab is
 * where the rest will live, and it says so plainly rather than sitting empty.
 */
export default function RewardsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-10 pt-10 sm:px-8 sm:pt-16">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Rewards</h1>
      <div className="mt-8 rounded-3xl border border-dashed border-hairline px-6 py-12 text-center">
        <p className="text-base font-semibold">Coming soon</p>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted">
          Daily sign-in rewards and more ways to earn coins are on the way. For now, every box
          you open earns coins.
        </p>
        <Link
          href="/wallet"
          className="gloss gloss-chalk mt-6 inline-block rounded-full px-7 py-3 text-sm font-semibold text-ink transition-transform hover:scale-[1.03] active:scale-[0.98]"
        >
          Open your wallet
        </Link>
      </div>
    </div>
  );
}
