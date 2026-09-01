import { newSeed, pickWeighted, seededUnit } from "./rng";
import type { PoolSnapshot } from "./types";

export interface DrawResult {
  pieceId: string;
  seed: string;
  rollValue: number;
}

/**
 * Draws one piece from a snapshot of the shelf, weighted by units remaining —
 * so a piece with six left is six times as likely as one with a single unit.
 * Runs server-side only: the client is never told what it pulled until it asks
 * for the reveal.
 */
export function drawFrom(snapshot: PoolSnapshot): DrawResult {
  if (snapshot.length === 0) throw new Error("Cannot draw from an empty shelf");

  const seed = newSeed();
  const rollValue = seededUnit(seed);
  const items = snapshot.map(([pieceId, units]) => ({ pieceId, weight: units }));
  return { pieceId: pickWeighted(items, rollValue).pieceId, seed, rollValue };
}

/**
 * Replays a stored roll against the shelf as it stood at the time. Stock moves
 * on, so the snapshot travels with the order — without it a past draw could
 * never be checked again.
 */
export function verifyDraw(
  snapshot: PoolSnapshot,
  seed: string,
  pieceId: string,
): boolean {
  if (snapshot.length === 0) return false;
  const items = snapshot.map(([id, units]) => ({ pieceId: id, weight: units }));
  return pickWeighted(items, seededUnit(seed)).pieceId === pieceId;
}
