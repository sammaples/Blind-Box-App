import type { ReactNode } from "react";
import { RARITY_COLOR, RARITY_LABEL } from "@/lib/catalog";
import type { Rarity } from "@/lib/types";

export function RarityChip({
  rarity,
  className = "",
}: {
  rarity: Rarity;
  className?: string;
}) {
  const color = RARITY_COLOR[rarity];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${className}`}
      style={{
        color,
        background: `color-mix(in srgb, ${color} 14%, transparent)`,
        boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${color} 34%, transparent)`,
      }}
    >
      <span className="size-1.5 rounded-full" style={{ background: color }} />
      {RARITY_LABEL[rarity]}
    </span>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-faint">
      {children}
    </p>
  );
}

export function Price({ cents }: { cents: number }) {
  return <>{`$${(cents / 100).toFixed(2)}`}</>;
}
