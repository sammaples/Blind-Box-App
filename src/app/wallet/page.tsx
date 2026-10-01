import type { Metadata } from "next";
import Link from "next/link";
import { CoinWallet } from "@/components/CoinWallet";
import { PRODUCTS, RARITY_COLOR, RARITY_LABEL } from "@/lib/catalog";
import { defaultTradeValue, formatCoins } from "@/lib/coins";
import type { Rarity } from "@/lib/types";

export const metadata: Metadata = {
  title: "Wallet — Blind Box",
  description: "Your coins, what your pulls trade in for, and how to spend them.",
};

/**
 * Coins, on a tab of their own — the Wallet.
 *
 * The wallet is the same one the vault shows — balance, buying more, and the
 * history of every movement — because two wallets that could disagree would
 * be worse than one shown twice. What this page adds is the part the vault
 * does not say: what each kind of pull is worth when you trade it in, so the
 * decision to keep or trade is made knowing the number.
 *
 * The values shown are the default ladder. A piece can be given its own value
 * in the inventory console, and the vault's trade-in button always shows the
 * real figure for the piece in front of you.
 */
const ROWS: Rarity[] = ["common", "rare", "ultra"];

export default function WalletPage() {
  const chaseByTier = PRODUCTS.map((p) => ({ name: p.name, coins: defaultTradeValue("chase", p.tier) }));

  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-10 pt-10 sm:px-8 sm:pt-16">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Wallet</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        One coin is one dollar. Trade in a piece you would rather not keep, and spend the coins on
        your next box.
      </p>

      <CoinWallet />

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-faint">
          What a pull trades in for
        </h2>
        <div className="mt-4 overflow-hidden rounded-2xl border border-hairline bg-hairline">
          <ul className="grid gap-px">
            {ROWS.map((rarity) => (
              <li key={rarity} className="flex items-center justify-between bg-ink-card px-5 py-4">
                <span className="flex items-center gap-3 text-sm">
                  <span className="size-2.5 rounded-full" style={{ background: RARITY_COLOR[rarity] }} />
                  {RARITY_LABEL[rarity]}
                  <span className="text-xs text-faint">any box</span>
                </span>
                <span className="font-mono text-sm">
                  {formatCoins(defaultTradeValue(rarity, "bronze"))} coins
                </span>
              </li>
            ))}
            {chaseByTier.map((row) => (
              <li key={row.name} className="flex items-center justify-between bg-ink-card px-5 py-4">
                <span className="flex items-center gap-3 text-sm">
                  <span className="size-2.5 rounded-full" style={{ background: RARITY_COLOR.chase }} />
                  {RARITY_LABEL.chase}
                  <span className="text-xs text-faint">{row.name}</span>
                </span>
                <span className="font-mono text-sm">{formatCoins(row.coins)} coins</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-3 text-[12px] leading-relaxed text-faint">
          The usual values. Some pieces are worth more than their rarity says, and the trade-in
          button in your vault always shows the exact figure for the piece in front of you.
        </p>
      </section>

      <div className="mt-8">
        <Link
          href="/collection"
          className="gloss gloss-chalk inline-block rounded-full px-7 py-3.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.03] active:scale-[0.98]"
        >
          Trade in from your vault
        </Link>
      </div>
    </div>
  );
}
