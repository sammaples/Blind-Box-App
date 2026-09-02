import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { importCatalogue } from "@/lib/csv";
import { savePieces } from "@/lib/pieces";
import { applyStockChanges } from "@/lib/stock";

/**
 * Imports a catalogue spreadsheet.
 *
 * `dryRun` reads the file and reports what it found without changing anything,
 * so the console can show a preview before an upload is committed — an import
 * that silently rewrites a live shop is not something to find out about after.
 */
export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  }

  let body: { csv?: unknown; dryRun?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request body" }, { status: 400 });
  }

  if (typeof body.csv !== "string" || body.csv.trim() === "") {
    return NextResponse.json({ error: "No file contents were sent" }, { status: 400 });
  }
  if (body.csv.length > 4_000_000) {
    return NextResponse.json(
      { error: "That file is larger than this importer accepts (4 MB)." },
      { status: 413 },
    );
  }

  const result = importCatalogue(body.csv);

  if (body.dryRun) {
    return NextResponse.json({
      preview: true,
      columns: result.columns,
      accepted: result.rows.length,
      withQuantity: result.rows.filter((r) => r.quantity !== undefined).length,
      errors: result.errors,
      sample: result.rows.slice(0, 8).map((r) => ({
        id: r.piece.id,
        name: r.piece.name,
        scale: r.piece.scale,
        rarity: r.piece.rarity,
        quantity: r.quantity ?? null,
        hasImage: r.piece.imageUrl !== null,
      })),
    });
  }

  if (result.rows.length === 0) {
    return NextResponse.json(
      { error: "Nothing in that file could be imported.", errors: result.errors },
      { status: 400 },
    );
  }

  await savePieces(result.rows.map((r) => r.piece));

  // Quantities in the sheet set stock in the same pass, so one upload can put
  // a whole drop on the shelf.
  const stockChanges = result.rows
    .filter((r) => r.quantity !== undefined)
    .map((r) => ({ pieceId: r.piece.id, op: "set" as const, units: r.quantity! }));
  if (stockChanges.length > 0) await applyStockChanges(stockChanges);

  return NextResponse.json({
    ok: true,
    imported: result.rows.length,
    stocked: stockChanges.length,
    errors: result.errors,
  });
}
