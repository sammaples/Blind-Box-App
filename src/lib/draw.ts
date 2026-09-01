import { weightedPoolFor } from "./catalog";
import { newSeed, pickWeighted, seededUnit } from "./rng";
import type { Piece } from "./types";

export interface DrawResult {
  piece: Piece;
  seed: string;
  rollValue: number;
}

/**
 * Draws a piece for a product. Runs server-side only: the client is never told
 * what it pulled until it asks for the reveal, and never sees the pool weights
 * being applied, only the published odds.
 */
export function draw(productId: string): DrawResult {
  const pool = weightedPoolFor(productId);
  if (pool.length === 0) throw new Error(`No pool for product ${productId}`);

  const seed = newSeed();
  const rollValue = seededUnit(seed);
  const { piece } = pickWeighted(pool, rollValue);
  return { piece, seed, rollValue };
}

/**
 * Recomputes a stored roll. Used to prove after the fact that an order's piece
 * really did follow from its seed and the published odds.
 */
export function verifyDraw(
  productId: string,
  seed: string,
  pieceId: string,
): boolean {
  const pool = weightedPoolFor(productId);
  if (pool.length === 0) return false;
  const { piece } = pickWeighted(pool, seededUnit(seed));
  return piece.id === pieceId;
}
