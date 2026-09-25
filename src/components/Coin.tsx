"use client";

import { formatCoins } from "@/lib/coins";

/**
 * The coin itself.
 *
 * Drawn rather than an image, for the same reason the box's question mark is:
 * it appears at half a dozen sizes across the app and a bitmap would be soft
 * at most of them. A rim, a face a shade brighter, and a "B" struck into it —
 * enough to read as a minted thing at sixteen pixels, which is the size it
 * spends most of its life at.
 */
export function Coin({ size = 16 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden
      className="shrink-0"
    >
      <defs>
        <linearGradient id="coin-face" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#ffe9a8" />
          <stop offset="0.5" stopColor="#f5c542" />
          <stop offset="1" stopColor="#c8860d" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="11" fill="url(#coin-face)" />
      {/* The rim, inset so the face reads as raised out of it. */}
      <circle cx="12" cy="12" r="8.6" fill="none" stroke="#00000026" strokeWidth="1.2" />
      <text
        x="12"
        y="16.4"
        textAnchor="middle"
        fontSize="11"
        fontWeight="700"
        fill="#8a5c05"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        B
      </text>
    </svg>
  );
}

/**
 * A number of coins, with the coin beside it.
 *
 * One component so the pairing is identical everywhere: a balance in the
 * header, a price on a button and a credit in a toast are the same currency
 * and should not each invent their own spacing.
 */
export function Coins({
  amount,
  size = 16,
  className = "",
}: {
  amount: number;
  size?: number;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 tabular-nums ${className}`}>
      <Coin size={size} />
      {formatCoins(amount)}
    </span>
  );
}
