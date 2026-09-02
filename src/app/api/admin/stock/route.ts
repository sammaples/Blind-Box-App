import { NextResponse } from "next/server";
import { pieceMap } from "@/lib/pieces";
import { isAdmin } from "@/lib/admin";
import { applyStockChanges, warehouse } from "@/lib/stock";
import type { AdminStockChange, StockOp } from "@/lib/stock";

const OPS: readonly StockOp[] = ["add", "set", "pull"];

/** Current warehouse: every piece with a stock record. */
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  }
  const rows = await warehouse();
  return NextResponse.json({
    stock: rows.map(({ piece, stocked, sold, available }) => ({
      pieceId: piece.id,
      stocked,
      sold,
      available,
    })),
  });
}

/**
 * Applies a batch of stock edits. Batched so stocking a whole series is one
 * atomic change rather than fifteen that could half-apply.
 */
export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  }

  let body: { changes?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request body" }, { status: 400 });
  }

  if (!Array.isArray(body.changes) || body.changes.length === 0) {
    return NextResponse.json({ error: "No changes were sent" }, { status: 400 });
  }
  if (body.changes.length > 2000) {
    return NextResponse.json(
      { error: "That is more changes than one batch allows" },
      { status: 400 },
    );
  }

  const pieces = await pieceMap();
  const changes: AdminStockChange[] = [];
  for (const raw of body.changes as unknown[]) {
    if (typeof raw !== "object" || raw === null) continue;
    const { pieceId, op, units } = raw as Record<string, unknown>;

    if (typeof pieceId !== "string" || !pieces.has(pieceId)) {
      return NextResponse.json(
        { error: `No piece with the id ${String(pieceId)}` },
        { status: 400 },
      );
    }
    if (typeof op !== "string" || !OPS.includes(op as StockOp)) {
      return NextResponse.json(
        { error: `"${String(op)}" is not a stock operation` },
        { status: 400 },
      );
    }
    if (op !== "pull" && (typeof units !== "number" || !Number.isFinite(units) || units < 0)) {
      return NextResponse.json(
        { error: "Units must be a number of zero or more" },
        { status: 400 },
      );
    }
    changes.push({ pieceId, op: op as StockOp, units: units as number });
  }

  const applied = await applyStockChanges(changes);
  return NextResponse.json({ applied });
}
