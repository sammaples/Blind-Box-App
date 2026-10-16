"use client";

import { DEFAULT_LINE, getLine, LINES, type LineId } from "@/lib/lines";
import { bannerNameClass, CollectionBanner } from "@/components/CollectionBanner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AddProduct, type EditableProduct, type NewProduct } from "@/components/AddProduct";
import { listingBase } from "@/lib/listings";
import { CatalogueGrid } from "@/components/CatalogueGrid";
import {
  RARITY_ORDER,
  seriesLabel,
  TIER_ACCENT,
  TIER_LABEL,
  TIER_ORDER,
} from "@/lib/catalog";
import { UNITS_BY_RARITY } from "@/lib/inventory";
import type { AuditBatch, Category, Palette, PatternKind, Rarity, Scale, Tier } from "@/lib/types";

/** The slice of a piece the console needs. */
export interface AdminPiece {
  id: string;
  line: LineId;
  name: string;
  setName: string;
  series: number | null;
  category: Category | null;
  scale: Scale;
  tier: Tier;
  rarity: Rarity;
  pattern: PatternKind;
  palette: Palette;
  imageUrl: string | null;
  archived: boolean;
}

type Levels = Record<string, { stocked: number; sold: number }>;
type Change = { pieceId: string; op: "add" | "set" | "pull"; units?: number };

/** Whether a piece is from the generated demo catalogue rather than listed by hand. */
function isDemo(piece: { id: string; imageUrl: string | null }): boolean {
  return piece.imageUrl === null && /^(s\d+-|big-\d+-)/.test(piece.id);
}

/** Must match the phrase the reset endpoint checks for. */
const RESET_PHRASE = "RESET";

/**
 * One shelf per box, because a shelf is now exactly what a box draws from.
 * Labels and colours come from the catalogue rather than being restated here —
 * a console calling something gold that the shop sells as silver is the kind of
 * disagreement that only shows up once stock has already moved.
 */
const SHELVES: { tier: Tier; label: string; accent: string }[] = TIER_ORDER.map(
  (tier) => ({
    tier,
    label: `${TIER_LABEL[tier]} shelf`,
    accent: TIER_ACCENT[tier],
  }),
);

/**
 * The inventory console. Stock lives in the database, so restocking is a few
 * clicks rather than an edit and a deploy — and because pull rates are derived
 * from units, changing stock here republishes the odds at the same instant.
 */
export function AdminConsole({
  pieces,
  stock,
  audit,
  covers,
  bootstrapAccess,
}: {
  pieces: AdminPiece[];
  /** Each collection's front-page cover photo, or null for the drawing. */
  covers: Record<LineId, string | null>;
  stock: Levels;
  audit: AuditBatch[];
  bootstrapAccess: boolean;
}) {
  const [levels, setLevels] = useState<Levels>(stock);
  const [log, setLog] = useState<AuditBatch[]>(audit);

  // Stock is held in state so an edit shows up the instant it lands, but state
  // seeded from a prop keeps its first value forever. Without this, a piece
  // stocked as part of adding it — or any change made in another tab — reads as
  // zero until a full page load, which looks exactly like a save that failed.
  useEffect(() => setLevels(stock), [stock]);
  useEffect(() => setLog(audit), [audit]);
  const [tier, setTier] = useState<Tier>("bronze");
  // The catalogue opens first. Adding a product and stocking it are the two
  // things done most often, and both start from a list of what already exists.
  const [tab, setTab] = useState<"all" | "box" | "log">("box");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const byId = useMemo(() => new Map(pieces.map((p) => [p.id, p])), [pieces]);

  // One collection at a time: Bearbrick, Pop Mart and Squishy each have their
  // own four shelves, and a list of every collection's pieces at once would
  // put a Pop Mart figure next to the Bearbrick it never competes with.
  // Null is the first screen: the collections to choose from.
  const [picked, setPicked] = useState<LineId | null>(null);
  const line = picked ?? DEFAULT_LINE;
  const shown = useMemo(() => pieces.filter((p) => p.line === line), [pieces, line]);

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
    const rows = shown
      .filter((p) => p.tier === tier && levels[p.id])
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
  }, [shown, levels, tier]);


  const unitsLeft = shelf.reduce((sum, r) => sum + r.available, 0);
  const unitsSold = shelf.reduce((sum, r) => sum + r.sold, 0);
  const inStock = shelf.filter((r) => r.available > 0).length;

  /* --------------------------- series shortcuts ------------------------- */

  const seriesRows = useMemo(() => {
    // Every tier holds shown from every series, so the shortcut stocks the
    // slice of a series that belongs to the shelf you are looking at — not the
    // whole series, which would put gold shown on the bronze shelf.
    const map = new Map<
      number,
      { label: string; total: number; stocked: number; available: number }
    >();
    for (const piece of shown) {
      if (piece.tier !== tier || piece.series === null || piece.archived) continue;
      const row = map.get(piece.series) ?? {
        // Whatever the shop calls this set, not a name invented here.
        label: seriesLabel(piece),
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
  }, [shown, levels, tier]);

  const stockSeries = (series: number) => {
    const changes = shown
      .filter((p) => p.series === series && p.tier === tier)
      .map((p) => ({
        pieceId: p.id,
        op: "set" as const,
        units: UNITS_BY_RARITY[p.scale][p.rarity],
      }));
    void send(changes, `Series ${series} stocked — ${changes.length} shown`);
  };

  const pullSeries = (series: number) => {
    const changes = shown
      .filter((p) => p.series === series && p.tier === tier && levels[p.id])
      .map((p) => ({ pieceId: p.id, op: "pull" as const }));
    void send(changes, `Series ${series} pulled from the shelf`);
  };

  const boxCount = (t: Tier) => shown.filter((p) => p.tier === t && !p.archived).length;
  // Products, not listings: one in all four boxes is one product.
  const productCount = new Set(shown.filter((p) => !p.archived).map((p) => listingBase(p.id))).size;

  /* ------------------------- first: which collection ------------------------ */

  if (picked === null) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-7 sm:px-8 sm:py-10">
        <Link href="/" className="text-xs text-faint transition-colors hover:text-muted">
          ← Back to the shop
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Inventory</h1>
        <p className="mt-1.5 text-[13px] text-muted">Pick a collection.</p>

      {bootstrapAccess && (
        <p className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs leading-relaxed text-amber-200">
          No <code className="font-mono">ADMIN_EMAILS</code> is set, so any signed-in
          account reaches this console. Fine locally; in production it refuses to load
          until you list the addresses that should have it.
        </p>
      )}

        <ul className="mt-6 flex flex-col gap-3">
          {LINES.map((l) => {
            const own = pieces.filter((p) => p.line === l.id && !p.archived);
            const units = own.reduce((sum, p) => {
              const level = levels[p.id];
              return sum + (level ? Math.max(0, level.stocked - level.sold) : 0);
            }, 0);
            return (
              <li key={l.id} className="h-28 sm:h-32">
                <button
                  type="button"
                  onClick={() => {
                    setPicked(l.id);
                    setTier("bronze");
                    setTab("box");
                    setNote(null);
                    setError(null);
                  }}
                  className="group relative flex h-full w-full items-center overflow-hidden rounded-[22px] border border-white/10 bg-ink-card text-left [container-type:size] active:scale-[0.985]"
                >
                  <CollectionBanner line={l.id} coverUrl={covers[l.id] ?? null} />
                  <span aria-hidden className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent" />
                  <span className="relative flex w-full items-center justify-between gap-3 p-4">
                    <span className={`min-w-0 ${bannerNameClass(l.id, covers[l.id] ?? null)}`}>
                      <span className="block truncate text-[22px] font-bold leading-none text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)]">
                        {l.name}
                      </span>
                      <span className="mt-1.5 block text-[12px] font-medium text-white/75 drop-shadow-[0_1px_6px_rgba(0,0,0,0.6)]">
                        {own.length} piece{own.length === 1 ? "" : "s"} · {units.toLocaleString()} unit{units === 1 ? "" : "s"}
                      </span>
                    </span>
                    <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-white/15 text-white">
                      ›
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  /* ------------------------ then: one collection's boxes ------------------------ */

  const lineInfo = getLine(line);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-7 sm:px-8 sm:py-10">
      <button
        type="button"
        onClick={() => {
          setPicked(null);
          setNote(null);
          setError(null);
        }}
        className="text-xs text-faint transition-colors hover:text-muted"
      >
        ← All collections
      </button>
      <h1 className="mt-3 flex items-center gap-2.5 text-2xl font-semibold tracking-tight sm:text-3xl">
        <span aria-hidden className="size-3 rounded-full" style={{ background: lineInfo?.accent }} />
        {lineInfo?.name ?? line}
      </h1>

      {bootstrapAccess && (
        <p className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs leading-relaxed text-amber-200">
          No <code className="font-mono">ADMIN_EMAILS</code> is set, so any signed-in
          account reaches this console. Fine locally; in production it refuses to load
          until you list the addresses that should have it.
        </p>
      )}

      {/* which box — everything below is this box's */}
      <div className="mt-5 grid grid-cols-4 gap-2" role="tablist" aria-label="Box">
        {SHELVES.map((s) => (
          <button
            key={s.tier}
            type="button"
            role="tab"
            aria-selected={tier === s.tier}
            onClick={() => setTier(s.tier)}
            className="rounded-2xl px-2 py-3 text-center transition-colors"
            style={
              tier === s.tier
                ? { background: s.accent, color: "#08080b" }
                : { color: "#8b8b99", boxShadow: "inset 0 0 0 1px #26262f" }
            }
          >
            <span className="block text-[14px] font-semibold">{TIER_LABEL[s.tier]}</span>
            <span className="mt-0.5 block text-[11px] opacity-75">
              {boxCount(s.tier)} piece{boxCount(s.tier) === 1 ? "" : "s"}
            </span>
          </button>
        ))}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-4">
        <Stat label="Pieces in stock" value={inStock.toLocaleString()} />
        <Stat label="Units available" value={unitsLeft.toLocaleString()} />
        <Stat label="Units sold" value={unitsSold.toLocaleString()} />
        <Stat
          label="Box status"
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

      {/* this box's views */}
      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-hairline">
        {(["all", "box", "log"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`-mb-px flex-1 whitespace-nowrap border-b-2 px-1.5 py-2.5 text-center text-[13px] font-medium transition-colors sm:flex-none sm:px-4 ${
              tab === t
                ? "border-chalk text-chalk"
                : "border-transparent text-muted hover:text-chalk"
            }`}
          >
            {t === "all"
              ? `All products (${productCount})`
              : t === "box"
                ? `In this box (${boxCount(tier)})`
                : "Change log"}
          </button>
        ))}
      </div>

      {tab !== "log" && (
        <Catalogue
          key={tab}
          scope={tab}
          pieces={shown}
          totalPieces={pieces.length}
          line={line}
          tier={tier}
          onShowBox={setTier}
          levels={levels}
          busy={busy}
          onChange={send}
        />
      )}
      {tab === "log" && <ChangeLog entries={log} byId={byId} />}

      {/* series shortcuts */}
      {seriesRows.length > 0 && (
        <section className="mt-10">
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
                {/* The set's own name leads; the number is only worth repeating
                    when the name is not already "Series 12". */}
                <p className="truncate text-[12px] font-medium">{row.label}</p>
                <p className="mt-0.5 truncate text-[11px] text-faint">
                  {row.label === `Series ${row.series}`
                    ? `${row.total} piece${row.total === 1 ? "" : "s"}`
                    : `Series ${row.series} · ${row.total} piece${row.total === 1 ? "" : "s"}`}
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


      <CoverRow key={line} line={line} initial={covers[line] ?? null} />
    </div>
  );
}

/**
 * The selected collection's cover photo: the picture in its bar on the front
 * page. Upload one and it shows at once; remove it and the drawing returns.
 * Wide photos suit the bar best — it is about two and a half times as wide as
 * it is tall, and the photo is cropped to fill it.
 */
function CoverRow({ line, initial }: { line: LineId; initial: string | null }) {
  const [url, setUrl] = useState<string | null>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const name = getLine(line)?.name ?? line;

  const save = async (next: string | null) => {
    const res = await fetch("/api/admin/covers", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ line, url: next }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error ?? "Could not save the cover");
    setUrl(data.url ?? null);
  };

  const upload = async (picked: File) => {
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", picked);
      const res = await fetch("/api/admin/images", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "That photo would not upload");
      await save(data.url as string);
    } catch (err) {
      setError(err instanceof Error ? err.message : "That photo would not upload");
    } finally {
      setBusy(false);
      if (file.current) file.current.value = "";
    }
  };

  return (
    <div className="mt-4 flex items-center gap-4 rounded-2xl border border-hairline bg-ink-card p-3">
      <span className="relative block h-16 w-40 shrink-0 overflow-hidden rounded-xl">
        <CollectionBanner line={line} coverUrl={url} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-medium">{name} cover</span>
        <span className="mt-0.5 block text-[11px] text-faint">{url ? "Your photo" : "Drawing — upload a photo to replace it"}</span>
        {error && <span className="mt-1 block text-[11px] text-rose-400">{error}</span>}
        <span className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => file.current?.click()}
            className="rounded-full bg-chalk px-3.5 py-1.5 text-[12px] font-semibold text-ink disabled:opacity-50"
          >
            {busy ? "Uploading…" : url ? "Change cover" : "Upload cover"}
          </button>
          {url && (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setBusy(true);
                setError(null);
                save(null)
                  .catch((err) => setError(err instanceof Error ? err.message : "Could not remove it"))
                  .finally(() => setBusy(false));
              }}
              className="rounded-full border border-hairline px-3.5 py-1.5 text-[12px] text-muted hover:text-chalk"
            >
              Remove
            </button>
          )}
        </span>
      </span>
      <input
        ref={file}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const picked = e.target.files?.[0];
          if (picked) void upload(picked);
        }}
      />
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
    <div className="bg-ink-card p-3 sm:p-4">
      <dt className="text-[10px] uppercase tracking-[0.16em] text-faint">{label}</dt>
      <dd
        className="mt-1 font-mono text-base sm:mt-1.5 sm:text-lg"
        style={{ color: tone === "warn" ? "#fbbf24" : tone === "good" ? "#34d399" : undefined }}
      >
        {value}
      </dd>
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
    tier: Tier;
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
function Catalogue({
  scope,
  pieces,
  totalPieces,
  line,
  tier,
  onShowBox,
  levels,
  busy,
  onChange,
}: {
  /** Every product in the collection, once each, or this box's listings. */
  scope: "all" | "box";
  /** The collection's pieces, every box — editing needs to see them all. */
  pieces: AdminPiece[];
  /** Every piece in every collection, for the "empty the shop" warning. */
  totalPieces: number;
  /** The collection on show, which a new piece is added to. */
  line: LineId;
  /** The box on show: the list is its pieces, and a new piece starts in it. */
  tier: Tier;
  /** Switches the console to another box, to show a piece saved there. */
  onShowBox: (tier: Tier) => void;
  levels: Levels;
  busy: boolean;
  onChange: (changes: Change[], message: string) => void;
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  // The piece the form is correcting. Null while adding a new one.
  const [editing, setEditing] = useState<EditableProduct | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [csv, setCsv] = useState<string>("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [working, setWorking] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showReset, setShowReset] = useState(false);
  const [resetTyped, setResetTyped] = useState("");

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pieces
      .filter((p) => showArchived || !p.archived)
      .filter((p) => scope === "all" || p.tier === tier)
      .filter(
        (p) =>
          q === "" ||
          p.name.toLowerCase().includes(q) ||
          p.setName.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q),
      )
      // Your own listings before the generated demo set, so a real product is
      // never hidden past the first 120 behind hundreds of test figures.
      .sort((a, b) => Number(isDemo(a)) - Number(isDemo(b)))
      // All products shows each product once — its cheapest box's listing —
      // however many boxes it is in.
      .filter((p, i, list) => scope === "box" || list.findIndex((q) => listingBase(q.id) === listingBase(p.id)) === i)
      .slice(0, 120);
  }, [pieces, query, showArchived, tier, scope]);

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

  // Every box a piece's product is in, from its listings in this collection.
  const boxesOf = (piece: { id: string; tier: Tier }): Tier[] => {
    const found = TIER_ORDER.filter((t) =>
      pieces.some((p) => !p.archived && p.tier === t && listingBase(p.id) === listingBase(piece.id)),
    );
    return found.length > 0 ? found : [piece.tier];
  };

  // Units left in a box for this piece's product, from its listing there.
  const unitsIn = (piece: { id: string }, t: Tier): number => {
    const there = pieces.find(
      (p) => !p.archived && p.tier === t && listingBase(p.id) === listingBase(piece.id),
    );
    const level = there && levels[there.id];
    return level ? Math.max(0, level.stocked - level.sold) : 0;
  };

  const setBoxes = async (piece: AdminPiece, tiers: Tier[], add: Partial<Record<Tier, number>>) => {
    setWorking(true);
    setError(null);
    try {
      await post("/api/admin/catalog", { action: "setBoxes", pieceId: piece.id, tiers, add });
      const names = tiers.map((t) => TIER_LABEL[t]);
      const added = tiers
        .filter((t) => (add[t] ?? 0) > 0)
        .map((t) => `${add[t]} to ${TIER_LABEL[t]}`);
      setNote(
        `${piece.name} is in ${tiers.length === TIER_ORDER.length ? "every box" : names.join(", ")}` +
          (added.length > 0 ? ` — added ${added.join(", ")}.` : "."),
      );
      // Taken out of the box on show: there is no sheet left to look at here.
      if (!tiers.includes(tier)) setOpen(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That did not work");
    } finally {
      setWorking(false);
    }
  };

  const remove = async (piece: AdminPiece) => {
    setWorking(true);
    setError(null);
    try {
      const data = await post("/api/admin/catalog", {
        action: "delete",
        pieceId: piece.id,
      });
      // The server archives instead when units have shipped, and says why —
      // reporting "deleted" for something that is still there would be a lie.
      setNote(data.deleted ? `Deleted ${piece.name}.` : String(data.message));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete that");
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

  const reset = async () => {
    setWorking(true);
    setError(null);
    try {
      const data = await post("/api/admin/catalog", {
        action: "resetShop",
        confirm: RESET_PHRASE,
      });
      const r = data.reset as {
        pieces: number;
        stockRows: number;
        orders: number;
        images: number;
      };
      setNote(
        `Shop emptied — ${r.pieces} piece${r.pieces === 1 ? "" : "s"}, ` +
          `${r.stockRows} stock line${r.stockRows === 1 ? "" : "s"}, ` +
          `${r.orders} order${r.orders === 1 ? "" : "s"} and ` +
          `${r.images} photo${r.images === 1 ? "" : "s"} removed. ` +
          "Your account is untouched.",
      );
      setShowReset(false);
      setResetTyped("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not empty the shop");
    } finally {
      setWorking(false);
    }
  };

  /* --------------------------- adding a product -------------------------- */

  if (adding || editing) {
    return (
      <AddProduct
        editing={editing}
        defaultLine={line}
        defaultTiers={[tier]}
        onCancel={() => {
          setAdding(false);
          setEditing(null);
        }}
        onSaved={(product: NewProduct) => {
          const wasEdit = editing !== null;
          setAdding(false);
          setEditing(null);
          setNote(
            wasEdit ? `Saved changes to ${product.name}.` : `${product.name} is in the catalogue.`,
          );
          setError(null);
          // Show it: a new product landing on page four of an unfiltered list
          // looks exactly like a save that did not happen.
          setQuery(product.name);
          if (!product.tiers.includes(tier)) onShowBox(product.tiers[0]);
          setOpen(product.id);
          router.refresh();
        }}
      />
    );
  }

  return (
    <div className="mt-5 space-y-6">
      {/* the one button this page exists for */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setAdding(true);
            setEditing(null);
            setNote(null);
            setError(null);
          }}
          className="w-full rounded-full bg-chalk px-5 py-3 text-[14px] font-semibold text-ink sm:w-auto sm:py-2.5 sm:text-[13px]"
        >
          + Add product
        </button>
        <button
          type="button"
          onClick={() => setShowImport((v) => !v)}
          className="rounded-full border border-hairline px-5 py-2.5 text-[13px] text-muted transition-colors hover:border-white/30 hover:text-chalk"
        >
          {showImport ? "Hide bulk import" : "Import a spreadsheet"}
        </button>
        <span className="text-[11px] text-faint">
          {pieces.filter((p) => !p.archived).length} live ·{" "}
          {pieces.filter((p) => p.archived).length} archived
        </span>
      </div>

      {/* bulk import, folded away until wanted */}
      {showImport && (
        <section className="rounded-2xl border border-hairline bg-ink-card p-5">
          <h3 className="text-sm font-semibold">Upload a catalogue</h3>
          <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-muted">
            A CSV with a header row. <span className="text-chalk">name</span> and{" "}
            <span className="text-chalk">tier</span> and{" "}
            <span className="text-chalk">scale</span> are required;{" "}
            <span className="text-chalk">set</span>, <span className="text-chalk">series</span>,{" "}
            <span className="text-chalk">rarity</span>, <span className="text-chalk">category</span>,{" "}
            <span className="text-chalk">image</span>,{" "}
            <span className="text-chalk">notes</span> and{" "}
            <span className="text-chalk">quantity</span> are optional — though a row with a
            series number needs a category, same as the form. Include a quantity and
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
                      {row.name} · {TIER_LABEL[row.tier]} · {row.scale} · {row.rarity}
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
      )}

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
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={scope === "all" ? "Search all products" : "Search this box"}
            className="w-full rounded-xl border border-hairline bg-ink px-4 py-2.5 text-sm outline-none transition-colors focus:border-white/30 sm:min-w-56 sm:flex-1"
          />
          <label className="flex items-center gap-2 py-1 text-xs text-muted">
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
              Add your first product above, upload a CSV, or load the demo set to see how
              it all behaves.
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
        ) : matches.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-hairline p-12 text-center text-sm text-muted">
            Nothing in the catalogue matches that.
          </p>
        ) : (
          <div className="mt-4">
            <CatalogueGrid
              pieces={matches}
              pool={pieces}
              boxesOf={boxesOf}
              cardBoxes={scope === "all" ? boxesOf : undefined}
              cardUnits={scope === "all" ? (piece) => TIER_ORDER.reduce((sum, t) => sum + unitsIn(piece, t), 0) : undefined}
              unitsIn={unitsIn}
              onSetBoxes={(piece, tiers, add) => void setBoxes(piece, tiers, add)}
              levels={levels}
              busy={busy || working}
              onChange={onChange}
              onArchive={(piece) => void archive(piece)}
              onEdit={(piece) => {
                setEditing({
                  id: piece.id,
                  line: piece.line,
                  name: piece.name,
                  setName: piece.setName,
                  series: piece.series,
                  scale: piece.scale,
                  tier: piece.tier,
                  // Every box this product is in, so the form opens on all of them.
                  tiers: boxesOf(piece),
                  rarity: piece.rarity,
                  category: piece.category,
                  imageUrl: piece.imageUrl,
                });
                setNote(null);
                setError(null);
              }}
              onDelete={(piece) => void remove(piece)}
              focus={open}
            />
            {matches.length === 120 && (
              <p className="pt-4 text-center text-[11px] text-faint">
                Showing the first 120. Search to narrow it down.
              </p>
            )}
          </div>
        )}
      </section>

      {/* Emptying the shop. Last on the page, folded shut, and typed to confirm. */}
      {totalPieces > 0 && (
        <section className="rounded-2xl border border-hairline bg-ink-card p-5">
          {!showReset ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">Start over</h3>
                <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted">
                  Clears out test data in one go, for the changeover from trying
                  things to real stock. Deleting pieces one at a time refuses on
                  anything that has sold; this does not.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowReset(true)}
                className="rounded-full border border-hairline px-5 py-2.5 text-[13px] text-muted transition-colors hover:border-rose-400/40 hover:text-rose-300"
              >
                Empty the shop
              </button>
            </div>
          ) : (
            <div>
              <h3 className="text-sm font-semibold text-rose-300">
                This cannot be undone
              </h3>
              <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-muted">
                Removing{" "}
                <span className="text-chalk">
                  all {totalPieces} piece{totalPieces === 1 ? "" : "s"}
                </span>
                , every stock line, every order placed so far, the change log,
                and every uploaded photo. Accounts stay — you will still be
                signed in, and still an admin.
              </p>
              <label className="mt-4 block max-w-xs">
                <span className="block text-[11px] font-medium uppercase tracking-wider text-faint">
                  Type {RESET_PHRASE} to confirm
                </span>
                <input
                  value={resetTyped}
                  onChange={(e) => setResetTyped(e.target.value)}
                  autoFocus
                  placeholder={RESET_PHRASE}
                  className="mt-1.5 w-full rounded-xl border border-hairline bg-ink px-3.5 py-2.5 text-[13px] text-chalk outline-none transition-colors placeholder:text-faint focus:border-rose-400/40"
                />
              </label>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={working || resetTyped !== RESET_PHRASE}
                  onClick={() => void reset()}
                  className="rounded-full bg-rose-500/90 px-5 py-2.5 text-[13px] font-semibold text-white transition-opacity hover:bg-rose-500 disabled:opacity-40"
                >
                  {working ? "Emptying…" : "Empty the shop"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReset(false);
                    setResetTyped("");
                  }}
                  className="text-xs text-faint transition-colors hover:text-muted"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
