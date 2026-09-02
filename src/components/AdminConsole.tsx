"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PieceImage } from "@/components/PieceImage";
import { RarityChip } from "@/components/ui";
import { formatOdds, RARITY_LABEL, RARITY_ORDER } from "@/lib/catalog";
import { UNITS_BY_RARITY } from "@/lib/inventory";
import type { AuditBatch, Palette, PatternKind, Rarity, Scale } from "@/lib/types";

/** The slice of a piece the console needs. */
export interface AdminPiece {
  id: string;
  name: string;
  setName: string;
  series: number | null;
  scale: Scale;
  rarity: Rarity;
  pattern: PatternKind;
  palette: Palette;
  imageUrl: string | null;
  archived: boolean;
}

type Levels = Record<string, { stocked: number; sold: number }>;
type Change = { pieceId: string; op: "add" | "set" | "pull"; units?: number };

const SHELVES: { scale: Scale; label: string; accent: string }[] = [
  { scale: "100%", label: "100% shelf", accent: "#f97316" },
  { scale: "400%", label: "400% shelf", accent: "#22d3ee" },
];

/**
 * The inventory console. Stock lives in the database, so restocking is a few
 * clicks rather than an edit and a deploy — and because pull rates are derived
 * from units, changing stock here republishes the odds at the same instant.
 */
export function AdminConsole({
  pieces,
  stock,
  audit,
  openAccess,
}: {
  pieces: AdminPiece[];
  stock: Levels;
  audit: AuditBatch[];
  openAccess: boolean;
}) {
  const [levels, setLevels] = useState<Levels>(stock);
  const [log, setLog] = useState<AuditBatch[]>(audit);
  const [scale, setScale] = useState<Scale>("100%");
  const [tab, setTab] = useState<"shelf" | "add" | "catalogue" | "log">("shelf");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const byId = useMemo(() => new Map(pieces.map((p) => [p.id, p])), [pieces]);

  const send = async (changes: Change[], message: string) => {
    if (changes.length === 0 || busy) return;
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      const res = await fetch("/api/admin/stock", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ changes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Could not save that");

      setLevels((current) => {
        const next = { ...current };
        for (const row of data.applied as { pieceId: string; stocked: number; sold: number }[]) {
          if (row.stocked === 0 && row.sold === 0) delete next[row.pieceId];
          else next[row.pieceId] = { stocked: row.stocked, sold: row.sold };
        }
        return next;
      });
      setNote(message);

      // Refresh the log so the change that just happened is visible in it.
      try {
        const res = await fetch("/api/admin/audit");
        if (res.ok) setLog((await res.json()).audit as AuditBatch[]);
      } catch {
        // The edit itself succeeded; a stale log is not worth an error.
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  /* ---------------------------- derived views --------------------------- */

  const shelf = useMemo(() => {
    const rows = pieces
      .filter((p) => p.scale === scale && levels[p.id])
      .map((piece) => {
        const { stocked, sold } = levels[piece.id];
        return { piece, stocked, sold, available: Math.max(0, stocked - sold) };
      });

    const remaining = rows.reduce((sum, r) => sum + r.available, 0);
    return rows
      .map((r) => ({ ...r, odds: remaining > 0 ? r.available / remaining : 0 }))
      .sort(
        (a, b) =>
          (a.available === 0 ? 1 : 0) - (b.available === 0 ? 1 : 0) ||
          RARITY_ORDER.indexOf(a.piece.rarity) - RARITY_ORDER.indexOf(b.piece.rarity) ||
          a.piece.name.localeCompare(b.piece.name),
      );
  }, [pieces, levels, scale]);

  const unitsLeft = shelf.reduce((sum, r) => sum + r.available, 0);
  const unitsSold = shelf.reduce((sum, r) => sum + r.sold, 0);
  const inStock = shelf.filter((r) => r.available > 0).length;

  /* --------------------------- series shortcuts ------------------------- */

  const seriesRows = useMemo(() => {
    if (scale !== "100%") return [];
    const map = new Map<
      number,
      { label: string; total: number; stocked: number; available: number }
    >();
    for (const piece of pieces) {
      if (piece.scale !== "100%" || piece.series === null || piece.archived) continue;
      const row = map.get(piece.series) ?? {
        // Whatever the shop calls this set, not a name invented here.
        label: piece.setName || `Series ${piece.series}`,
        total: 0,
        stocked: 0,
        available: 0,
      };
      row.total += 1;
      const level = levels[piece.id];
      if (level) {
        row.stocked += 1;
        row.available += Math.max(0, level.stocked - level.sold);
      }
      map.set(piece.series, row);
    }
    return [...map.entries()]
      .map(([series, row]) => ({ series, ...row }))
      .sort((a, b) => b.available - a.available || a.series - b.series);
  }, [pieces, levels, scale]);

  const stockSeries = (series: number) => {
    const changes = pieces
      .filter((p) => p.series === series && p.scale === "100%")
      .map((p) => ({
        pieceId: p.id,
        op: "set" as const,
        units: UNITS_BY_RARITY[p.scale][p.rarity],
      }));
    void send(changes, `Series ${series} stocked — ${changes.length} pieces`);
  };

  const pullSeries = (series: number) => {
    const changes = pieces
      .filter((p) => p.series === series && p.scale === "100%" && levels[p.id])
      .map((p) => ({ pieceId: p.id, op: "pull" as const }));
    void send(changes, `Series ${series} pulled from the shelf`);
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <Link href="/" className="text-xs text-faint transition-colors hover:text-muted">
            ← Back to the shop
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Inventory</h1>
          <p className="mt-1.5 text-sm text-muted">
            Stock is the product. Change what is on a shelf and the published pull rates
            move with it, because a rate is just a piece&apos;s share of the units left.
          </p>
        </div>
      </div>

      {openAccess && (
        <p className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs leading-relaxed text-amber-200">
          No <code className="font-mono">ADMIN_EMAILS</code> is set, so this console is
          unlocked. That is fine locally; in production it refuses to load until you list
          the addresses that should have it.
        </p>
      )}

      {/* shelf picker */}
      <div className="mt-7 flex flex-wrap gap-2">
        {SHELVES.map((s) => (
          <button
            key={s.scale}
            type="button"
            onClick={() => setScale(s.scale)}
            className="rounded-full px-4 py-2 text-[13px] font-medium transition-colors"
            style={
              scale === s.scale
                ? { background: s.accent, color: "#08080b" }
                : { color: "#8b8b99", boxShadow: "inset 0 0 0 1px #26262f" }
            }
          >
            {s.label}
          </button>
        ))}
      </div>

      <dl className="mt-5 grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-4">
        <Stat label="Pieces in stock" value={inStock.toLocaleString()} />
        <Stat label="Units available" value={unitsLeft.toLocaleString()} />
        <Stat label="Units sold" value={unitsSold.toLocaleString()} />
        <Stat
          label="Shelf status"
          value={unitsLeft > 0 ? "Selling" : "Sold out"}
          tone={unitsLeft > 0 ? "good" : "warn"}
        />
      </dl>

      {(note || error) && (
        <p
          className={`mt-4 rounded-xl px-4 py-3 text-xs ${
            error
              ? "border border-rose-500/30 bg-rose-500/10 text-rose-300"
              : "border border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
          }`}
        >
          {error ?? note}
        </p>
      )}

      {/* series shortcuts */}
      {scale === "100%" && (
        <section className="mt-8">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-faint">
            Stock a whole series
          </h2>
          <p className="mt-1.5 text-xs text-muted">
            Sets every piece in the series to its default unit count for its rarity. One
            batch, so a series never lands half-stocked.
          </p>
          <div className="scroll-slim mt-3 flex gap-2 overflow-x-auto pb-2">
            {seriesRows.map((row) => (
              <div
                key={row.series}
                className="w-40 shrink-0 rounded-xl border border-hairline bg-ink-card p-3"
              >
                <p className="font-mono text-xs">
                  {String(row.series).padStart(2, "0")}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-muted">
                  {row.label}
                </p>
                <p className="mt-2 font-mono text-[11px] text-faint">
                  {row.available > 0
                    ? `${row.available} unit${row.available === 1 ? "" : "s"}`
                    : "not stocked"}
                </p>
                <div className="mt-2.5 flex gap-1.5">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => stockSeries(row.series)}
                    className="flex-1 rounded-lg bg-white/10 py-1.5 text-[11px] font-medium transition-colors hover:bg-white/16 disabled:opacity-40"
                  >
                    {row.available > 0 ? "Restock" : "Stock"}
                  </button>
                  {row.available > 0 && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => pullSeries(row.series)}
                      className="rounded-lg border border-hairline px-2.5 py-1.5 text-[11px] text-muted transition-colors hover:border-white/30 hover:text-chalk disabled:opacity-40"
                    >
                      Pull
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* shelf / add tabs */}
      <div className="mt-9 flex gap-1 border-b border-hairline">
        {(["shelf", "add", "catalogue", "log"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-[13px] font-medium transition-colors ${
              tab === t
                ? "border-chalk text-chalk"
                : "border-transparent text-muted hover:text-chalk"
            }`}
          >
            {t === "shelf"
              ? `On the shelf (${shelf.length})`
              : t === "add"
                ? "Stock a piece"
                : t === "catalogue"
                  ? `Catalogue (${pieces.length})`
                  : `Change log (${log.length})`}
          </button>
        ))}
      </div>

      {tab === "shelf" && <ShelfTable rows={shelf} busy={busy} onChange={send} />}
      {tab === "add" && (
        <AddPieces
          pieces={pieces.filter((p) => p.scale === scale && !p.archived && !levels[p.id])}
          busy={busy}
          onChange={send}
          byId={byId}
        />
      )}
      {tab === "catalogue" && <Catalogue pieces={pieces} busy={busy} />}
      {tab === "log" && <ChangeLog entries={log} byId={byId} />}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good" | "warn";
}) {
  return (
    <div className="bg-ink-card p-4">
      <dt className="text-[10px] uppercase tracking-[0.16em] text-faint">{label}</dt>
      <dd
        className="mt-1.5 font-mono text-lg"
        style={{ color: tone === "warn" ? "#fbbf24" : tone === "good" ? "#34d399" : undefined }}
      >
        {value}
      </dd>
    </div>
  );
}

/* ------------------------------------------------------------------ */

interface ShelfRow {
  piece: AdminPiece;
  stocked: number;
  sold: number;
  available: number;
  odds: number;
}

function ShelfTable({
  rows,
  busy,
  onChange,
}: {
  rows: ShelfRow[];
  busy: boolean;
  onChange: (changes: Change[], message: string) => void;
}) {
  if (rows.length === 0) {
    return (
      <p className="mt-8 rounded-2xl border border-dashed border-hairline p-12 text-center text-sm text-muted">
        Nothing on this shelf yet. Stock a series above, or add pieces one at a time.
      </p>
    );
  }

  return (
    <div className="mt-5 overflow-x-auto">
      <table className="w-full min-w-[46rem] border-separate border-spacing-y-1.5 text-sm">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-[0.16em] text-faint">
            <th className="px-3 pb-1 font-medium">Piece</th>
            <th className="px-3 pb-1 font-medium">Rarity</th>
            <th className="px-3 pb-1 text-right font-medium">Left</th>
            <th className="px-3 pb-1 text-right font-medium">Sold</th>
            <th className="px-3 pb-1 text-right font-medium">Pull rate</th>
            <th className="px-3 pb-1 text-right font-medium">Restock</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.piece.id}
              className={`bg-ink-card ${row.available === 0 ? "opacity-55" : ""}`}
            >
              <td className="rounded-l-xl px-3 py-2.5">
                <div className="flex items-center gap-3">
                  <div
                    className="grid size-10 shrink-0 place-items-center rounded-lg"
                    style={{
                      background: `radial-gradient(120% 90% at 50% 12%, ${row.piece.palette.wash}, #0b0b10 78%)`,
                    }}
                  >
                    <PieceImage piece={row.piece} className="h-8 w-auto" simple />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{row.piece.name}</p>
                    <p className="truncate text-[11px] text-faint">{row.piece.setName}</p>
                  </div>
                </div>
              </td>
              <td className="px-3 py-2.5">
                <RarityChip rarity={row.piece.rarity} />
              </td>
              <td className="px-3 py-2.5 text-right font-mono">
                {row.available === 0 ? (
                  <span className="text-[11px] uppercase tracking-[0.14em] text-faint">
                    Sold out
                  </span>
                ) : (
                  row.available
                )}
              </td>
              <td className="px-3 py-2.5 text-right font-mono text-muted">{row.sold}</td>
              <td className="px-3 py-2.5 text-right font-mono text-muted">
                {row.available > 0 ? formatOdds(row.odds) : "—"}
              </td>
              <td className="rounded-r-xl px-3 py-2.5">
                <div className="flex items-center justify-end gap-1.5">
                  <QuantityBox row={row} busy={busy} onChange={onChange} />
                  {[1, 5, 25].map((n) => (
                    <button
                      key={n}
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        onChange(
                          [{ pieceId: row.piece.id, op: "add", units: n }],
                          `Added ${n} × ${row.piece.name}`,
                        )
                      }
                      className="rounded-lg bg-white/8 px-2.5 py-1.5 font-mono text-[11px] transition-colors hover:bg-white/16 disabled:opacity-40"
                    >
                      +{n}
                    </button>
                  ))}
                  {row.available > 0 && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        onChange(
                          [{ pieceId: row.piece.id, op: "pull" }],
                          `Pulled ${row.piece.name} from the shelf`,
                        )
                      }
                      className="rounded-lg border border-hairline px-2.5 py-1.5 text-[11px] text-muted transition-colors hover:border-white/30 hover:text-chalk disabled:opacity-40"
                    >
                      Pull
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function AddPieces({
  pieces,
  busy,
  onChange,
  byId,
}: {
  pieces: AdminPiece[];
  busy: boolean;
  onChange: (changes: Change[], message: string) => void;
  byId: Map<string, AdminPiece>;
}) {
  const [query, setQuery] = useState("");
  const [rarity, setRarity] = useState<Rarity | "all">("all");

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pieces
      .filter((p) => rarity === "all" || p.rarity === rarity)
      .filter(
        (p) =>
          q === "" ||
          p.name.toLowerCase().includes(q) ||
          p.setName.toLowerCase().includes(q),
      )
      .slice(0, 60);
  }, [pieces, query, rarity]);

  return (
    <div className="mt-5">
      <p className="text-xs text-muted">
        Anything in the catalogue that is not already on this shelf. Adding a piece puts it
        straight into the pool at the units you choose.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or series"
          className="min-w-56 flex-1 rounded-xl border border-hairline bg-ink px-4 py-2.5 text-sm outline-none transition-colors focus:border-white/30"
        />
        <select
          value={rarity}
          onChange={(e) => setRarity(e.target.value as Rarity | "all")}
          className="rounded-xl border border-hairline bg-ink-raised px-3 py-2.5 text-xs text-chalk outline-none focus:border-white/30"
        >
          <option value="all">All rarities</option>
          {RARITY_ORDER.map((r) => (
            <option key={r} value={r}>
              {RARITY_LABEL[r]}
            </option>
          ))}
        </select>
      </div>

      <p className="mt-3 text-xs text-faint">
        {pieces.length.toLocaleString()} pieces available to stock
        {matches.length < pieces.length ? ` · showing ${matches.length}` : ""}
      </p>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {matches.map((piece) => {
          const suggested = UNITS_BY_RARITY[piece.scale][piece.rarity];
          return (
            <div
              key={piece.id}
              className="flex items-center gap-3 rounded-xl border border-hairline bg-ink-card p-3"
            >
              <div
                className="grid size-11 shrink-0 place-items-center rounded-lg"
                style={{
                  background: `radial-gradient(120% 90% at 50% 12%, ${piece.palette.wash}, #0b0b10 78%)`,
                }}
              >
                <PieceImage piece={piece} className="h-9 w-auto" simple />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium">{piece.name}</p>
                <p className="truncate text-[11px] text-faint">{piece.setName}</p>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  onChange(
                    [{ pieceId: piece.id, op: "set", units: suggested }],
                    `Stocked ${suggested} × ${piece.name}`,
                  )
                }
                className="shrink-0 rounded-lg bg-white/10 px-3 py-2 font-mono text-[11px] transition-colors hover:bg-white/16 disabled:opacity-40"
                title={`Stock ${suggested} units`}
              >
                +{suggested}
              </button>
            </div>
          );
        })}
      </div>

      {matches.length === 0 && (
        <p className="mt-6 rounded-2xl border border-dashed border-hairline p-10 text-center text-sm text-muted">
          {byId.size > 0 && pieces.length === 0
            ? "Every piece at this scale is already on the shelf."
            : "Nothing matches that search."}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

/**
 * The inventory edit log. Batches are summarised server-side, so a line always
 * reports the true size of the click that made it — an inventory log that
 * misstates what happened would be worse than no log at all.
 */
function ChangeLog({
  entries,
  byId,
}: {
  entries: AuditBatch[];
  byId: Map<string, AdminPiece>;
}) {
  if (entries.length === 0) {
    return (
      <p className="mt-8 rounded-2xl border border-dashed border-hairline p-12 text-center text-sm text-muted">
        No inventory changes yet. Stocking, restocking and pulling all land here.
      </p>
    );
  }

  return (
    <div className="mt-5">
      <p className="text-xs text-muted">
        Every stock edit, newest first, one line per change you made. Sales are not
        listed — the orders behind them already account for those units.
      </p>

      <ol className="mt-4 space-y-2">
        {entries.map((batch) => (
          <li
            key={batch.batchId}
            className="rounded-xl border border-hairline bg-ink-card p-4"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p className="text-[13px] font-medium">{describe(batch, byId)}</p>
              <time dateTime={batch.at} className="font-mono text-[11px] text-faint">
                {new Date(batch.at).toLocaleString()}
              </time>
            </div>

            <p className="mt-1.5 font-mono text-[11px] text-muted">
              {batch.delta >= 0 ? "+" : ""}
              {batch.delta.toLocaleString()} units across {batch.pieceCount.toLocaleString()}{" "}
              {batch.pieceCount === 1 ? "piece" : "pieces"}
            </p>

            {batch.single && (
              <p className="mt-1 font-mono text-[11px] text-faint">
                {batch.single.before} → {batch.single.after} in circulation
                {batch.single.sold > 0 && ` · ${batch.single.sold} already sold`}
              </p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

/** A human sentence for a batch, derived from the summary. */
function describe(batch: AuditBatch, byId: Map<string, AdminPiece>): string {
  const pieces = batch.pieceIds
    .map((id) => byId.get(id))
    .filter((p): p is AdminPiece => !!p);

  if (batch.pieceCount === 1 && pieces.length === 1) {
    const piece = pieces[0];
    if (batch.op === "pull") return `Pulled ${piece.name}`;
    if (batch.op === "add") return `Restocked ${piece.name}`;
    return batch.single?.before === 0
      ? `Stocked ${piece.name}`
      : `Set ${piece.name} to ${batch.single?.after ?? 0}`;
  }

  const verb = batch.op === "pull" ? "Pulled" : batch.delta >= 0 ? "Stocked" : "Reduced";

  // A batch whose sampled pieces all sit in one series, and whose size matches
  // that series, is a series action — anything else is described by its size.
  const series = new Set(pieces.map((p) => p.series));
  if (series.size === 1 && pieces.length > 1) {
    const only = [...series][0];
    if (only !== null) return `${verb} Series ${only}`;
  }

  return `${verb} ${batch.pieceCount.toLocaleString()} pieces`;
}

/* ------------------------------------------------------------------ */

interface ImportPreview {
  columns: string[];
  accepted: number;
  withQuantity: number;
  errors: string[];
  sample: {
    id: string;
    name: string;
    scale: string;
    rarity: string;
    quantity: number | null;
    hasImage: boolean;
  }[];
}

/**
 * The shop's own catalogue: what it sells, as opposed to what is on the shelf
 * today. Pieces arrive here by spreadsheet or one at a time, and a piece has to
 * exist here before any quantity of it can be stocked.
 */
function Catalogue({ pieces, busy }: { pieces: AdminPiece[]; busy: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [csv, setCsv] = useState<string>("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [working, setWorking] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pieces
      .filter((p) => showArchived || !p.archived)
      .filter(
        (p) =>
          q === "" ||
          p.name.toLowerCase().includes(q) ||
          p.setName.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q),
      )
      .slice(0, 120);
  }, [pieces, query, showArchived]);

  const post = async (path: string, body: unknown) => {
    const res = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error ?? "That did not work");
    return data;
  };

  const readFile = async (file: File) => {
    setError(null);
    setNote(null);
    const text = await file.text();
    setCsv(text);
    setFileName(file.name);
    setWorking(true);
    try {
      // Always previewed first: an import that silently rewrites a live shop
      // is not something to discover afterwards.
      setPreview((await post("/api/admin/catalog/import", { csv: text, dryRun: true })) as ImportPreview);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that file");
      setPreview(null);
    } finally {
      setWorking(false);
    }
  };

  const commit = async () => {
    setWorking(true);
    setError(null);
    try {
      const data = await post("/api/admin/catalog/import", { csv });
      setNote(
        `Imported ${data.imported} pieces` +
          (data.stocked ? `, and set stock on ${data.stocked} of them.` : "."),
      );
      setPreview(null);
      setCsv("");
      setFileName(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not import that file");
    } finally {
      setWorking(false);
    }
  };

  const archive = async (piece: AdminPiece) => {
    setWorking(true);
    setError(null);
    try {
      await post("/api/admin/catalog", {
        action: piece.archived ? "restore" : "archive",
        pieceId: piece.id,
      });
      setNote(`${piece.archived ? "Restored" : "Archived"} ${piece.name}.`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That did not work");
    } finally {
      setWorking(false);
    }
  };

  const loadDemo = async () => {
    setWorking(true);
    try {
      const data = await post("/api/admin/catalog", { action: "loadDemo" });
      setNote(`Loaded ${data.loaded} demo pieces. Replace them with your own when ready.`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That did not work");
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="mt-5 space-y-8">
      {/* upload */}
      <section className="rounded-2xl border border-hairline bg-ink-card p-5">
        <h3 className="text-sm font-semibold">Upload a catalogue</h3>
        <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-muted">
          A CSV with a header row. <span className="text-chalk">name</span> and{" "}
          <span className="text-chalk">scale</span> are required;{" "}
          <span className="text-chalk">set</span>, <span className="text-chalk">series</span>,{" "}
          <span className="text-chalk">rarity</span>, <span className="text-chalk">image</span>,{" "}
          <span className="text-chalk">notes</span> and{" "}
          <span className="text-chalk">quantity</span> are optional. Include a quantity and
          the piece goes straight onto the shelf. Re-uploading a sheet updates pieces rather
          than duplicating them, so a corrected export is safe to send again.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="cursor-pointer rounded-xl bg-white/10 px-4 py-2.5 text-[13px] font-medium transition-colors hover:bg-white/16">
            Choose a CSV
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void readFile(file);
                e.target.value = "";
              }}
            />
          </label>
          <a
            href="/catalogue-template.csv"
            download
            className="rounded-xl border border-hairline px-4 py-2.5 text-[13px] text-muted transition-colors hover:border-white/30 hover:text-chalk"
          >
            Download the template
          </a>
          {fileName && <span className="font-mono text-xs text-faint">{fileName}</span>}
        </div>

        {preview && (
          <div className="mt-5 rounded-xl border border-hairline bg-ink p-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-faint">
              Before importing
            </p>
            <p className="mt-2 text-sm">
              <span className="font-mono text-chalk">{preview.accepted}</span> pieces read
              {preview.withQuantity > 0 && (
                <>
                  , <span className="font-mono text-chalk">{preview.withQuantity}</span> with
                  a quantity
                </>
              )}
              .
            </p>
            <p className="mt-1 text-xs text-faint">
              Columns understood: {preview.columns.join(", ")}
            </p>

            {preview.sample.length > 0 && (
              <ul className="mt-3 space-y-1">
                {preview.sample.map((row) => (
                  <li key={row.id} className="font-mono text-[11px] text-muted">
                    {row.name} · {row.scale} · {row.rarity}
                    {row.quantity !== null && ` · ${row.quantity} units`}
                    {row.hasImage && " · photo"}
                  </li>
                ))}
                {preview.accepted > preview.sample.length && (
                  <li className="text-[11px] text-faint">
                    …and {preview.accepted - preview.sample.length} more
                  </li>
                )}
              </ul>
            )}

            {preview.errors.length > 0 && (
              <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-amber-300">
                  {preview.errors.length} rows need attention
                </p>
                <ul className="mt-2 space-y-1">
                  {preview.errors.slice(0, 6).map((message) => (
                    <li key={message} className="text-[11px] leading-relaxed text-amber-200/90">
                      {message}
                    </li>
                  ))}
                  {preview.errors.length > 6 && (
                    <li className="text-[11px] text-amber-200/70">
                      …and {preview.errors.length - 6} more
                    </li>
                  )}
                </ul>
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                disabled={working || preview.accepted === 0}
                onClick={() => void commit()}
                className="rounded-xl bg-chalk px-5 py-2.5 text-[13px] font-semibold text-ink disabled:opacity-50"
              >
                {working ? "Importing…" : `Import ${preview.accepted} pieces`}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPreview(null);
                  setCsv("");
                  setFileName(null);
                }}
                className="rounded-xl border border-hairline px-5 py-2.5 text-[13px] text-muted transition-colors hover:border-white/30 hover:text-chalk"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      {(note || error) && (
        <p
          className={`rounded-xl px-4 py-3 text-xs ${
            error
              ? "border border-rose-500/30 bg-rose-500/10 text-rose-300"
              : "border border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
          }`}
        >
          {error ?? note}
        </p>
      )}

      {/* the catalogue itself */}
      <section>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the catalogue"
            className="min-w-56 flex-1 rounded-xl border border-hairline bg-ink px-4 py-2.5 text-sm outline-none transition-colors focus:border-white/30"
          />
          <label className="flex items-center gap-2 text-xs text-muted">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />
            Show archived
          </label>
        </div>

        {pieces.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-hairline p-12 text-center">
            <p className="text-sm text-muted">
              The catalogue is empty, so there is nothing to sell yet.
            </p>
            <p className="mt-1 text-xs text-faint">
              Upload a CSV above, or load the demo set to see how it all behaves.
            </p>
            <button
              type="button"
              disabled={working}
              onClick={() => void loadDemo()}
              className="mt-4 rounded-full border border-hairline px-5 py-2.5 text-[13px] text-muted transition-colors hover:border-white/30 hover:text-chalk disabled:opacity-50"
            >
              Load the demo catalogue
            </button>
          </div>
        ) : (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {matches.map((piece) => (
              <div
                key={piece.id}
                className={`flex items-center gap-3 rounded-xl border border-hairline bg-ink-card p-3 ${
                  piece.archived ? "opacity-50" : ""
                }`}
              >
                <div
                  className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg"
                  style={{
                    background: `radial-gradient(120% 90% at 50% 12%, ${piece.palette.wash}, #0b0b10 78%)`,
                  }}
                >
                  <PieceImage piece={piece} className="h-10 w-auto" simple />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium">{piece.name}</p>
                  <p className="truncate text-[11px] text-faint">
                    {piece.setName || "—"} · {piece.scale} · {RARITY_LABEL[piece.rarity]}
                    {piece.imageUrl ? "" : " · no photo"}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busy || working}
                  onClick={() => void archive(piece)}
                  className="shrink-0 rounded-lg border border-hairline px-3 py-1.5 text-[11px] text-muted transition-colors hover:border-white/30 hover:text-chalk disabled:opacity-40"
                >
                  {piece.archived ? "Restore" : "Archive"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}


/**
 * Sets an exact number of units. The quick buttons beside it are for topping
 * up; this is for "I counted them, there are nineteen".
 */
function QuantityBox({
  row,
  busy,
  onChange,
}: {
  row: ShelfRow;
  busy: boolean;
  onChange: (changes: Change[], message: string) => void;
}) {
  const [value, setValue] = useState(String(row.stocked));

  // Follow the row when stock moves for any other reason.
  useEffect(() => setValue(String(row.stocked)), [row.stocked]);

  const commit = () => {
    const units = Number(value);
    if (!Number.isFinite(units) || units < 0 || Math.trunc(units) === row.stocked) {
      setValue(String(row.stocked));
      return;
    }
    onChange(
      [{ pieceId: row.piece.id, op: "set", units: Math.trunc(units) }],
      `Set ${row.piece.name} to ${Math.trunc(units)} units`,
    );
  };

  return (
    <input
      type="number"
      min={0}
      inputMode="numeric"
      value={value}
      disabled={busy}
      aria-label={`Units of ${row.piece.name}`}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") setValue(String(row.stocked));
      }}
      className="w-16 rounded-lg border border-hairline bg-ink px-2 py-1.5 text-right font-mono text-[11px] outline-none transition-colors focus:border-white/30 disabled:opacity-40"
    />
  );
}
