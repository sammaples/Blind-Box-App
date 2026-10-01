import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { CoinWallet } from "@/components/CoinWallet";
import { COINS_EARNED_PER_DOLLAR } from "@/lib/coins";

export const metadata: Metadata = {
  title: "Wallet — Blind Box",
  description: "Your coins, and the ways to earn more.",
};

/**
 * Coins, on a page of their own: the balance, then the ways to earn more.
 *
 * Kept to almost nothing to read. Each way to earn is one row you can tap;
 * the ones not built yet say so on the row rather than in a paragraph.
 */
export default function WalletPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-10 pt-10 sm:px-8 sm:pt-16">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Wallet</h1>

      <CoinWallet />

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-faint">
          Ways to earn
        </h2>
        <div className="mt-4 overflow-hidden rounded-2xl border border-hairline bg-ink-card">
          <Way
            href="/"
            title="Buy a box"
            detail={`${COINS_EARNED_PER_DOLLAR} coins for every $1`}
            icon={<path d="M12 3 4 7v10l8 4 8-4V7l-8-4Zm0 0v18M4 7l8 4 8-4" />}
          />
          <Way
            href="/rewards/spin"
            title="Daily spin"
            detail="Up to 1,500 coins, free"
            icon={
              <>
                <circle cx="12" cy="12" r="8.5" />
                <path d="M12 3.5v17M3.5 12h17M6 6l12 12M18 6 6 18" />
                <circle cx="12" cy="12" r="2.2" fill="currentColor" />
              </>
            }
          />
          <Way
            href="/rewards"
            title="Challenges"
            detail="Daily & weekly"
            soon
            icon={
              <>
                <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
                <path d="M3.5 9.5h17M8 3v4M16 3v4M9 14.5l2 2 4-4" />
              </>
            }
          />
          <Way
            href="/rewards"
            title="Refer a friend"
            detail="Bring a friend in"
            soon
            icon={
              <>
                <circle cx="9" cy="8.5" r="3.2" />
                <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5M17 8v6M14 11h6" />
              </>
            }
          />
        </div>
      </section>
    </div>
  );
}

function Way({
  href,
  title,
  detail,
  soon = false,
  icon,
}: {
  href: string;
  title: string;
  detail?: string;
  soon?: boolean;
  icon: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 border-b border-hairline px-5 py-4 transition-colors last:border-b-0 hover:bg-white/[0.04]"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/[0.06]">
        <svg viewBox="0 0 24 24" aria-hidden className="size-[22px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          {icon}
        </svg>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium">{title}</span>
        {detail && <span className="mt-0.5 block text-[13px] text-muted">{detail}</span>}
      </span>
      {soon && (
        <span className="shrink-0 rounded-full bg-white/[0.08] px-2.5 py-1 text-[11px] font-medium text-muted">
          Soon
        </span>
      )}
      <svg viewBox="0 0 24 24" aria-hidden className="size-5 shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m9 18 6-6-6-6" />
      </svg>
    </Link>
  );
}
