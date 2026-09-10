import { NextResponse } from "next/server";
import { currentAccountId } from "@/lib/auth";
import { createShipment, listShipments } from "@/lib/shipments";
import type { ShippingAddress } from "@/lib/types";

/** Everything but line 2. */
const REQUIRED = ["name", "line1", "city", "region", "postal", "country"] as const;

/** How many pulls may travel in one parcel. */
const MAX_PER_BUNDLE = 60;

function parseAddress(input: unknown): ShippingAddress | null {
  if (typeof input !== "object" || input === null) return null;
  const raw = input as Record<string, unknown>;

  const clean: Record<string, string> = {};
  for (const field of REQUIRED) {
    const value = raw[field];
    if (typeof value !== "string" || value.trim() === "") return null;
    clean[field] = value.trim().slice(0, 120);
  }
  const line2 = typeof raw.line2 === "string" ? raw.line2.trim().slice(0, 120) : "";

  return {
    name: clean.name,
    line1: clean.line1,
    line2: line2 || undefined,
    city: clean.city,
    region: clean.region,
    postal: clean.postal,
    country: clean.country,
  };
}

/** Deduplicated, because the same id twice must not count as two pieces. */
function parseOrderIds(input: unknown): string[] | null {
  if (!Array.isArray(input)) return null;
  const ids = new Set<string>();
  for (const value of input) {
    if (typeof value !== "string" || value.trim() === "") return null;
    ids.add(value);
  }
  if (ids.size === 0 || ids.size > MAX_PER_BUNDLE) return null;
  return [...ids];
}

/** The collector's bundles. */
export async function GET() {
  const collectorId = await currentAccountId();
  if (!collectorId) return NextResponse.json({ shipments: [] });
  return NextResponse.json({ shipments: await listShipments(collectorId) });
}

/**
 * Packs the chosen pulls into one parcel.
 *
 * Which orders are eligible is settled inside the write, not here: checking
 * first and writing after leaves room for two tabs to both pass and the second
 * to walk pieces out of the first one's parcel.
 */
export async function POST(request: Request) {
  const collectorId = await currentAccountId();
  if (!collectorId) {
    return NextResponse.json({ error: "Sign in to arrange delivery" }, { status: 401 });
  }

  let body: { orderIds?: unknown; shipping?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request body" }, { status: 400 });
  }

  const orderIds = parseOrderIds(body.orderIds);
  if (!orderIds) {
    return NextResponse.json(
      { error: `Pick between 1 and ${MAX_PER_BUNDLE} pieces to send` },
      { status: 400 },
    );
  }

  const address = parseAddress(body.shipping);
  if (!address) {
    return NextResponse.json(
      { error: "Every address field except line 2 is required" },
      { status: 400 },
    );
  }

  const shipment = await createShipment(collectorId, orderIds, address);
  if (!shipment) {
    return NextResponse.json(
      {
        error:
          "Some of those pieces are already on their way or are not yours to send. Reload and try again.",
      },
      { status: 409 },
    );
  }

  return NextResponse.json({ shipment }, { status: 201 });
}
