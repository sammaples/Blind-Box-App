import type { Metadata } from "next";
import Link from "next/link";
import { Coins } from "@/components/Coin";
import { CoinWallet } from "@/components/CoinWallet";
import { PRODUCTS } from "@/lib/catalog";
import { boxReward, redeemCost } from "@/lib/coins";

export const metadata: Metadata = {
  title: "Wallet — Blind Box",
  description: "Your coins: what you have, what opening each box earns, and what each box takes to redeem.",
};

/**
 * Coins, on a tab of their own.
 *
 * Coins are a reward now, not a currency: every box opened earns some, and
 * they redeem for boxes. So this page is the two tables that make up the
 * whole economy — what goes in, what comes out — under the balance, read
 * straight from `src/lib/coins.ts` so they cannot drift from what the server
 * actually credits and charges.
 */
export default function WalletPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-10 pt-10 sm:px-8 sm:pt-16">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Wallet</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Every box you open earns 10 coins for each dollar it cost. Save them up and redeem them for
        a box of your own, at 100 coins a dollar.
      </p>

      <CoinWallet />

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-faint">
          Earn for every box you open
        </h2>
        <Table
          rows={PRODUCTS.map((p) => ({ id: p.id, name: p.name, accent: p.accent, coins: boxReward(p.priceCents), plus: true }))}
        />
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-faint">
          Redeem for a box
        </h2>
        <Table
          rows={PRODUCTS.map((p) => ({ id: p.id, name: p.name, accent: p.accent, coins: redeemCost(p.priceCents), plus: false }))}
        />
        <p className="mt-3 text-[12px] leading-relaxed text-faint">
          Pick a box, tap Buy a box, then choose Pay with coins. A box redeemed with coins does not
          earn coins itself.
        </p>
      </section>

      <div className="mt-8">
        <Link
          href="/"
          className="gloss gloss-chalk inline-block rounded-full px-7 py-3.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.03] active:scale-[0.98]"
        >
          Pick a box
        </Link>
      </div>
    </div>
  );
}

function Table({
  rows,
}: {
  rows: { id: string; name: string; accent: string; coins: number; plus: boolean }[];
}) {
  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-hairline bg-hairline">
      <ul className="grid gap-px">
        {rows.map((row) => (
          <li key={row.id} className="flex items-center justify-between bg-ink-card px-5 py-4">
            <span className="flex items-center gap-3 text-sm">
              <span className="size-2.5 rounded-full" style={{ background: row.accent }} />
              {row.name}
            </span>
            <span className="flex items-center gap-1 font-mono text-sm">
              {row.plus && <span className="text-emerald-400">+</span>}
              <Coins amount={row.coins} size={14} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
