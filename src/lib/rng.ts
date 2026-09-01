import { createHash, randomBytes } from "node:crypto";

/**
 * Turns a seed string into a uniform float in [0, 1). Deterministic, so an
 * order's roll can be recomputed from its stored seed during a dispute.
 */
export function seededUnit(seed: string): number {
  const digest = createHash("sha256").update(seed).digest();
  // 52 bits of entropy is plenty and stays inside Number's exact integer range.
  const hi = digest.readUInt32BE(0) % 0x200000; // 21 bits
  const lo = digest.readUInt32BE(4); // 32 bits
  return (hi * 0x100000000 + lo) / (0x200000 * 0x100000000);
}

export function newSeed(): string {
  return randomBytes(24).toString("hex");
}

export interface Weighted {
  weight: number;
}

/**
 * Picks an entry proportionally to its weight using a pre-drawn unit float.
 * Keeping the draw separate from the pick lets callers persist the exact value.
 */
export function pickWeighted<T extends Weighted>(items: readonly T[], unit: number): T {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  if (total <= 0) throw new Error("Cannot draw from a pool with no weight");

  let cursor = unit * total;
  for (const item of items) {
    cursor -= item.weight;
    if (cursor < 0) return item;
  }
  // Only reachable through floating point drift at the very top of the range.
  return items[items.length - 1];
}
