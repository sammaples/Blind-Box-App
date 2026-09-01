import "server-only";
import { backend } from "./db";
import type { Collector, Order } from "./types";

/**
 * Collector and order persistence. Every call goes to the active backend, so
 * which database is behind it is decided in one place (src/lib/db/index.ts)
 * and nothing here or above needs to know.
 */

export async function upsertCollector(
  id: string,
  patch: Partial<Omit<Collector, "id" | "createdAt">> = {},
): Promise<Collector> {
  return backend().upsertCollector(id, patch);
}

export async function getOrder(id: string): Promise<Order | null> {
  return backend().getOrder(id);
}

export async function listOrders(collectorId: string): Promise<Order[]> {
  return backend().listOrders(collectorId);
}

export async function updateOrder(
  id: string,
  patch: Partial<Omit<Order, "id" | "collectorId" | "pieceId">>,
): Promise<Order | null> {
  return backend().updateOrder(id, patch);
}
