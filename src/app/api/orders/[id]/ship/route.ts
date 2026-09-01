import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { publicOrder } from "@/lib/serialize";
import { currentCollectorId } from "@/lib/auth";
import { getOrder, updateOrder } from "@/lib/store";
import type { ShippingAddress } from "@/lib/types";

const REQUIRED = ["name", "line1", "city", "region", "postal", "country"] as const;

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

/** Attaches a shipping address to a revealed order and queues it for packing. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const collectorId = await currentCollectorId();
  const order = await getOrder(id);

  if (!order || !collectorId || order.collectorId !== collectorId) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.status === "paid") {
    return NextResponse.json(
      { error: "Open the box before arranging delivery" },
      { status: 409 },
    );
  }

  let body: { shipping?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request body" }, { status: 400 });
  }

  const shipping = parseAddress(body.shipping);
  if (!shipping) {
    return NextResponse.json(
      { error: "Every address field except line 2 is required" },
      { status: 400 },
    );
  }

  const updated = await updateOrder(order.id, {
    shipping,
    status: "packing",
    trackingNumber:
      order.trackingNumber ?? `BB${randomBytes(5).toString("hex").toUpperCase()}`,
  });
  if (!updated) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  return NextResponse.json({ order: publicOrder(updated) });
}
