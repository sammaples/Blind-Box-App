import "server-only";
import { randomBytes } from "node:crypto";
import { backend } from "./db";
import type { Order, Shipment, ShippingAddress } from "./types";

/**
 * Bundles.
 *
 * A pull sits in the collection until its owner picks it for a parcel. What
 * they pick goes out together, so a fortnight of opening boxes costs one
 * postage instead of six.
 */

/** A pull that has been opened and is not already travelling. */
export function isShippable(order: Order): boolean {
  return order.status !== "paid" && order.shipmentId === null;
}

export async function createShipment(
  collectorId: string,
  orderIds: readonly string[],
  address: ShippingAddress,
): Promise<Shipment | null> {
  return backend().createShipment({
    id: `shp_${randomBytes(9).toString("hex")}`,
    collectorId,
    address,
    trackingNumber: `BB${randomBytes(5).toString("hex").toUpperCase()}`,
    createdAt: new Date().toISOString(),
    orderIds,
  });
}

export async function listShipments(collectorId: string): Promise<Shipment[]> {
  return backend().listShipments(collectorId);
}
