import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DailySpinCard } from "@/components/DailySpinCard";

export const metadata: Metadata = {
  title: "Rewards — Blind Box",
  description: "Free ways to earn coins: the daily spin, and more on the way.",
};

/**
 * Rewards: the free ways to earn coins.
 *
 * The daily spin leads, because it is the one that is live and the one worth
 * coming back for. What is not built yet is listed under it, marked as such,
 * so the tab says where it is going without pretending.
 */
export default function RewardsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-10 pt-10 sm:px-8 sm:pt-16">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Rewards</h1>

      <div className="mt-6">
        <DailySpinCard />
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-hairline bg-ink-card">
        <Soon
          title="Challenges"
          detail="Daily & weekly"
          icon={
            <>
              <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
              <path d="M3.5 9.5h17M8 3v4M16 3v4M9 14.5l2 2 4-4" />
            </>
          }
        />
        <Soon
          title="Refer a friend"
          detail="Bring a friend in"
          icon={
            <>
              <circle cx="9" cy="8.5" r="3.2" />
              <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5M17 8v6M14 11h6" />
            </>
          }
        />
      </div>
    </div>
  );
}

function Soon({ title, detail, icon }: { title: string; detail: string; icon: ReactNode }) {
  return (
    <div className="flex items-center gap-4 border-b border-hairline px-5 py-4 last:border-b-0">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-muted">
        <svg viewBox="0 0 24 24" aria-hidden className="size-[22px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          {icon}
        </svg>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium">{title}</span>
        <span className="mt-0.5 block text-[13px] text-muted">{detail}</span>
      </span>
      <span className="shrink-0 rounded-full bg-white/[0.08] px-2.5 py-1 text-[11px] font-medium text-muted">Soon</span>
    </div>
  );
}
