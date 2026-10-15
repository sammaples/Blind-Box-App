"use client";

import type { LineId } from "@/lib/lines";
import { useEffect, useState } from "react";
import { PieceImage } from "@/components/PieceImage";
import {
  formatOdds,
  pieceSubtitle,
  RARITY_COLOR,
  RARITY_LABEL,
  TIER_ACCENT,
  TIER_LABEL,
} from "@/lib/catalog";
import { useScrollLock } from "@/lib/useScrollLock";
import type { Category, Rarity, Scale, Tier } from "@/lib/types";

/**
 * The catalogue as a wall of photographs.
 *
 * A blind box shop is a visual business — the reason to stock a piece is that
 * you are holding it and it looks good. A dense table of names optimises for
 * scanning text, which is the wrong thing to optimise for here, and it is
 * miserable on the phone this is actually used on. So: big pictures, two to a
 * row, and the two facts you need on each one — how rare it is, and whether it
 * is currently in the pool.
 *
 * Tapping a card opens the stock sheet. That is the whole interaction: see the
 * thing, tap the thing, say how many you have.
 */

export interface GridPiece {
  id: string;
  line: LineId;
  name: string;
  setName: string;
  category: Category | null;
  series: number | null;
  scale: Scale;
  tier: Tier;
  rarity: Rarity;
  imageUrl: string | null;
  archived: boolean;
  // The vector fallback needs these when there is no photograph yet.
  pattern: Parameters<typeof PieceImage>[0]["piece"]["pattern"];
  palette: Parameters<typeof PieceImage>[0]["piece"]["palette"];
}

export interface GridLevel {
  stocked: number;
  sold: number;
}

export type StockChange = { pieceId: string; op: "add" | "set" | "pull"; units?: number };

export function CatalogueGrid({
  pieces,
  levels,
  busy,
  onChange,
  onArchive,
  onEdit,
  onDelete,
  pool: poolPieces,
  boxesOf,
  unitsIn,
  onSetBoxes,
  focus,
}: {
  pieces: GridPiece[];
  levels: Record<string, GridLevel>;
  busy: boolean;
  onChange: (changes: StockChange[], message: string) => void;
  onArchive: (piece: GridPiece) => void;
  onEdit: (piece: GridPiece) => void;
  onDelete: (piece: GridPiece) => void;
  /** Every piece a pull rate is a share of. Defaults to the ones shown, which
      a search or the 120 cap would make too few. */
  pool?: GridPiece[];
  /** The boxes a piece's product is in, for the Boxes menu on its sheet. */
  boxesOf?: (piece: GridPiece) => Tier[];
  /** Units left in a box, for the listing of this piece's product there. */
  unitsIn?: (piece: GridPiece, tier: Tier) => number;
  /** Puts a piece's product in exactly these boxes, adding units to each. */
  onSetBoxes?: (piece: GridPiece, tiers: Tier[], add: Partial<Record<Tier, number>>) => void;
  /** A piece to open the sheet on — how a freshly saved product introduces itself. */
  focus?: string | null;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  // A product that was just added opens its own sheet, so the next step after
  // "saved" is the one you were going to take anyway.
  useEffect(() => {
    if (focus) setOpenId(focus);
  }, [focus]);

  const open = pieces.find((p) => p.id === openId) ?? null;

  // Everything left in the pool for this piece's shelf, which is what turns a
  // unit count into a pull rate. The shelf is the tier: a piece competes for
  // the draw against the others in its own box, whatever size any of them are.
  const poolFor = (piece: GridPiece) =>
    (poolPieces ?? pieces)
      .filter((p) => p.line === piece.line && p.tier === piece.tier && !p.archived)
      .reduce((sum, p) => sum + available(levels[p.id]), 0);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {pieces.map((piece) => (
          <Card
            key={piece.id}
            piece={piece}
            level={levels[piece.id] ?? null}
            onOpen={() => setOpenId(piece.id)}
          />
        ))}
      </div>

      {open && (
        <StockSheet
          piece={open}
          level={levels[open.id] ?? null}
          pool={poolFor(open)}
          busy={busy}
          onClose={() => setOpenId(null)}
          onChange={onChange}
          onArchive={onArchive}
          onEdit={onEdit}
          onDelete={onDelete}
          boxes={boxesOf?.(open) ?? [open.tier]}
          unitsIn={(t) => unitsIn?.(open, t) ?? 0}
          onSetBoxes={onSetBoxes}
        />
      )}
    </>
  );
}

function available(level: GridLevel | null | undefined): number {
  return level ? Math.max(0, level.stocked - level.sold) : 0;
}

/* ------------------------------- one card ------------------------------- */

function Card({
  piece,
  level,
  onOpen,
}: {
  piece: GridPiece;
  level: GridLevel | null;
  onOpen: () => void;
}) {
  const units = available(level);
  const live = units > 0 && !piece.archived;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group overflow-hidden rounded-2xl bg-ink-card text-left ring-1 ring-hairline transition-colors hover:ring-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
    >
      <div className="relative">
        {/* Photographs of collectibles are shot on white. Showing them on white
            is the difference between a product shot and a cut-out floating in
            the dark. */}
        <div className="grid aspect-[4/5] place-items-center overflow-hidden bg-white">
          <PieceImage
            piece={piece}
            thumb
            className="h-full w-full p-3 transition-transform duration-300 group-hover:scale-[1.04]"
          />
        </div>

        <span className="pointer-events-none absolute left-2.5 top-2.5">
          <RarityBadge rarity={piece.rarity} />
        </span>

        <span
          className="pointer-events-none absolute right-2.5 top-2.5 grid size-6 place-items-center rounded-full bg-black/45 backdrop-blur-sm"
          title={
            piece.archived
              ? "Archived"
              : live
                ? `${units} in the pool`
                : "Not in the pool"
          }
        >
          <span
            className="size-2.5 rounded-full"
            style={{
              background: piece.archived ? "#64748b" : live ? "#22c55e" : "#3f3f46",
              boxShadow: live ? "0 0 0 3px rgb(34 197 94 / 0.22)" : undefined,
            }}
          />
        </span>

        {piece.archived && (
          <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-black/70 py-1 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
            Archived
          </span>
        )}
      </div>

      <div className="p-3">
        <p className="truncate text-[15px] font-semibold leading-tight">{piece.name}</p>
        <div className="mt-1.5 flex items-center gap-2">
          {/* Which box sells it, then how big it is: two different facts, and
              the first is the one that decides what it is in the draw with. */}
          <span
            className="rounded-md px-1.5 py-0.5 text-[11px] font-medium"
            style={{
              background: `color-mix(in srgb, ${TIER_ACCENT[piece.tier]} 22%, transparent)`,
              color: TIER_ACCENT[piece.tier],
            }}
          >
            {TIER_LABEL[piece.tier]}
          </span>
          <span className="rounded-md bg-white/[0.07] px-1.5 py-0.5 font-mono text-[11px] text-muted">
            {piece.scale}
          </span>
          <span className="truncate text-[12px] text-faint">
            {pieceSubtitle(piece, "—")}
          </span>
        </div>
        <p className="mt-2 text-[12px]">
          {piece.archived ? (
            <span className="text-faint">Out of the catalogue</span>
          ) : live ? (
            <span className="text-emerald-400">
              <span className="font-mono">{units}</span> in the pool
            </span>
          ) : (
            <span className="text-faint">Tap to stock</span>
          )}
        </p>
      </div>
    </button>
  );
}

function RarityBadge({ rarity }: { rarity: Rarity }) {
  const color = RARITY_COLOR[rarity];
  return (
    <span
      className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] backdrop-blur-sm"
      style={{
        color: rarity === "common" ? "#e7e7ea" : color,
        background:
          rarity === "common"
            ? "rgb(0 0 0 / 0.62)"
            : `color-mix(in srgb, ${color} 22%, rgb(0 0 0 / 0.7))`,
        boxShadow:
          rarity === "common"
            ? undefined
            : `inset 0 0 0 1px color-mix(in srgb, ${color} 45%, transparent)`,
      }}
    >
      {RARITY_LABEL[rarity]}
    </span>
  );
}

/* ------------------------------ stock sheet ------------------------------ */

/**
 * Everything you can do to one piece, on one surface.
 *
 * A sheet rather than an expanding row: on a phone an inline editor pushes the
 * rest of the grid around and lands the controls wherever the card happened to
 * be. This always opens in the same place, and the picture stays visible while
 * you type a number into it.
 */
function StockSheet({
  piece,
  level,
  pool,
  busy,
  onClose,
  onChange,
  onArchive,
  onEdit,
  onDelete,
  boxes,
  unitsIn,
  onSetBoxes,
}: {
  piece: GridPiece;
  level: GridLevel | null;
  pool: number;
  busy: boolean;
  onClose: () => void;
  onChange: (changes: StockChange[], message: string) => void;
  onArchive: (piece: GridPiece) => void;
  onEdit: (piece: GridPiece) => void;
  onDelete: (piece: GridPiece) => void;
  boxes: Tier[];
  unitsIn: (tier: Tier) => number;
  onSetBoxes?: (piece: GridPiece, tiers: Tier[], add: Partial<Record<Tier, number>>) => void;
}) {
  const [amount, setAmount] = useState(1);
  useScrollLock(true);

  const stocked = level?.stocked ?? 0;
  const sold = level?.sold ?? 0;
  const units = Math.max(0, stocked - sold);

  // Escape closes it, because a sheet you cannot dismiss from the keyboard is
  // a trap on a desktop.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // What this piece's odds become once the units land — the number that makes
  // "add twelve" a decision rather than a guess.
  const projected = (extra: number) => {
    const nextPool = pool + extra;
    return nextPool > 0 ? (units + extra) / nextPool : 0;
  };

  const add = () => {
    if (amount < 1) return;
    onChange(
      [{ pieceId: piece.id, op: "add", units: amount }],
      `Added ${amount} × ${piece.name} — ${units + amount} in the pool`,
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={piece.name}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-hairline bg-ink-card pb-[env(safe-area-inset-bottom)] sm:rounded-3xl"
      >
        {/* the grab handle a phone user expects on a sheet */}
        <div className="sticky top-0 z-10 flex justify-center bg-ink-card pt-3 sm:hidden">
          <span className="h-1 w-10 rounded-full bg-white/20" />
        </div>

        <div className="flex items-start gap-3.5 p-4 sm:p-5">
          <div className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white">
            <PieceImage piece={piece} thumb className="h-full w-full p-1.5" />
          </div>
          <div className="min-w-0 flex-1">
            <RarityBadge rarity={piece.rarity} />
            <h3 className="mt-2 text-lg font-semibold leading-tight">{piece.name}</h3>
            <p className="mt-1 truncate text-[12px] text-faint">
              {TIER_LABEL[piece.tier]} box · {piece.scale} ·{" "}
              {pieceSubtitle(piece, "No set")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 -mt-1 grid size-8 shrink-0 place-items-center rounded-full text-faint transition-colors hover:bg-white/10 hover:text-chalk"
          >
            ✕
          </button>
        </div>

        {piece.archived ? (
          <div className="px-4 pb-5 sm:px-5">
            <p className="rounded-xl border border-hairline bg-black/25 px-4 py-3 text-[13px] leading-relaxed text-muted">
              This piece is out of the catalogue, so it cannot be stocked or pulled.
              Restore it to put it back in play.
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={() => onArchive(piece)}
              className="mt-3 w-full rounded-xl bg-white/10 py-3 text-[14px] font-semibold transition-colors hover:bg-white/16 disabled:opacity-40"
            >
              Restore to the catalogue
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => onDelete(piece)}
              className="mt-2 w-full rounded-xl py-2.5 text-[12px] text-rose-400/80 transition-colors hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-40"
            >
              Delete permanently
            </button>
          </div>
        ) : (
          <>
            <dl className="mx-4 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:mx-5">
              <Cell label="In the pool" value={String(units)} accent={units > 0} />
              <Cell label="Sold" value={String(sold)} />
              <Cell
                label="Pull rate"
                value={units > 0 ? formatOdds(units / Math.max(pool, 1)) : "—"}
              />
            </dl>

            <div className="p-4 sm:p-5">
              {onSetBoxes && (
                <BoxesMenu
                  key={boxes.join()}
                  boxes={boxes}
                  unitsIn={unitsIn}
                  busy={busy}
                  onSave={(tiers, add) => onSetBoxes(piece, tiers, add)}
                />
              )}

              <p className={`${onSetBoxes ? "mt-5" : ""} text-[11px] font-semibold uppercase tracking-wider text-faint`}>
                Add to the pool
              </p>

              <div className="mt-2.5 flex items-stretch gap-2">
                <Stepper
                  value={amount}
                  onChange={setAmount}
                  disabled={busy}
                  label={`Units of ${piece.name} to add`}
                />
                <button
                  type="button"
                  disabled={busy || amount < 1}
                  onClick={add}
                  className="flex-1 rounded-xl bg-chalk text-[14px] font-semibold text-ink transition-opacity disabled:opacity-40"
                >
                  Add {amount}
                </button>
              </div>

              <p className="mt-3 text-[12px] leading-relaxed text-faint">
                {units + amount > 0 ? (
                  <>
                    Adding {amount} puts this piece at{" "}
                    <span className="font-mono text-muted">
                      {formatOdds(projected(amount))}
                    </span>{" "}
                    of the {TIER_LABEL[piece.tier]} shelf — a rate is just its share of the units
                    left, so every other piece shifts a little too.
                  </>
                ) : (
                  "Units are what put a piece in the draw at all."
                )}
              </p>

              {units > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-hairline pt-4">
                  <SetExact
                    stocked={stocked}
                    sold={sold}
                    busy={busy}
                    name={piece.name}
                    onSet={(next) =>
                      onChange(
                        [{ pieceId: piece.id, op: "set", units: next }],
                        `Set ${piece.name} to ${next} units`,
                      )
                    }
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      onChange(
                        [{ pieceId: piece.id, op: "pull" }],
                        `Pulled ${piece.name} out of the pool`,
                      )
                    }
                    className="ml-auto rounded-lg border border-hairline px-3.5 py-2 text-[12px] text-muted transition-colors hover:border-rose-400/40 hover:text-rose-300 disabled:opacity-40"
                  >
                    Take out of the pool
                  </button>
                </div>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-hairline pt-4">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onEdit(piece)}
                  className="rounded-lg border border-hairline px-3.5 py-2 text-[12px] text-muted transition-colors hover:border-white/30 hover:text-chalk disabled:opacity-40"
                >
                  Edit details
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onArchive(piece)}
                  className="rounded-lg border border-hairline px-3.5 py-2 text-[12px] text-muted transition-colors hover:border-white/30 hover:text-chalk disabled:opacity-40"
                >
                  Archive
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onDelete(piece)}
                  className="ml-auto rounded-lg px-3.5 py-2 text-[12px] text-rose-400/80 transition-colors hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-40"
                >
                  Delete
                </button>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-faint">
                Archiving takes a piece out of the shop but keeps it on the orders
                that pulled it. Delete removes it for good, and is only possible
                while nothing has sold.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const BOX_TIERS: Tier[] = ["bronze", "silver", "gold", "diamond"];

/**
 * Which boxes this piece is sold in, as a drop-down of the four, each with its
 * own count to add. Ticking a box lists it there too; unticking takes it out
 * of that box. Saving adds each ticked box's count to that box's pool.
 */
function BoxesMenu({
  boxes,
  unitsIn,
  busy,
  onSave,
}: {
  boxes: Tier[];
  /** Units left in each box this piece is already in. */
  unitsIn: (tier: Tier) => number;
  busy: boolean;
  onSave: (tiers: Tier[], add: Partial<Record<Tier, number>>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<Tier[]>(boxes);
  const [add, setAdd] = useState<Partial<Record<Tier, number>>>({});
  const amount = (t: Tier) => add[t] ?? 0;
  const setAmount = (t: Tier, n: number) =>
    setAdd((now) => ({ ...now, [t]: Math.max(0, Number.isFinite(n) ? Math.trunc(n) : 0) }));
  const adding = picked.some((t) => !boxes.includes(t));
  const removing = boxes.some((t) => !picked.includes(t));
  const units = picked.reduce((sum, t) => sum + amount(t), 0);
  const changed = adding || removing || units > 0;
  const toggle = (t: Tier) =>
    setPicked((now) => (now.includes(t) ? now.filter((x) => x !== t) : BOX_TIERS.filter((x) => x === t || now.includes(x))));

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-faint">Boxes</p>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="mt-2.5 flex w-full items-center justify-between gap-3 rounded-xl border border-hairline px-3.5 py-3 text-left text-[14px] transition-colors hover:border-white/30"
      >
        <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          {boxes.length === BOX_TIERS.length
            ? "Every box"
            : boxes.map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full" style={{ background: TIER_ACCENT[t] }} />
                  {TIER_LABEL[t]}
                </span>
              ))}
        </span>
        <span aria-hidden className={`text-faint transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
      </button>

      {open && (
        <div className="mt-2 rounded-xl border border-hairline bg-black/25 p-2">
          {BOX_TIERS.map((t) => {
            const on = picked.includes(t);
            const was = boxes.includes(t);
            return (
              <div key={t} className="flex items-center gap-2 rounded-lg px-1 py-1">
                <button
                  type="button"
                  role="menuitemcheckbox"
                  aria-checked={on}
                  onClick={() => toggle(t)}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-1.5 py-2 text-left text-[14px] transition-colors hover:bg-white/[0.06]"
                >
                  <span
                    aria-hidden
                    className={`grid size-5 shrink-0 place-items-center rounded-md border text-[12px] leading-none ${
                      on ? "border-transparent bg-chalk text-ink" : "border-white/25"
                    }`}
                  >
                    {on ? "✓" : ""}
                  </span>
                  <span className="size-2 shrink-0 rounded-full" style={{ background: TIER_ACCENT[t] }} />
                  <span className="min-w-0">
                    <span className="block">{TIER_LABEL[t]}</span>
                    <span className="block text-[11px] text-faint">
                      {was ? `${unitsIn(t)} in the pool` : on ? "New" : "Not in it"}
                    </span>
                  </span>
                </button>
                {on && (
                  <div className="flex shrink-0 items-stretch rounded-lg border border-hairline">
                    <button
                      type="button"
                      disabled={amount(t) <= 0}
                      onClick={() => setAmount(t, amount(t) - 1)}
                      aria-label={`One fewer for ${TIER_LABEL[t]}`}
                      className="grid w-8 place-items-center text-muted transition-colors hover:text-chalk disabled:opacity-30"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      value={amount(t) === 0 ? "" : amount(t)}
                      placeholder="0"
                      aria-label={`Units to add to ${TIER_LABEL[t]}`}
                      onChange={(e) => setAmount(t, Number(e.target.value))}
                      className="w-11 bg-transparent text-center font-mono text-[14px] text-chalk outline-none placeholder:text-faint"
                    />
                    <button
                      type="button"
                      onClick={() => setAmount(t, amount(t) + 1)}
                      aria-label={`One more for ${TIER_LABEL[t]}`}
                      className="grid w-8 place-items-center text-muted transition-colors hover:text-chalk"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          <button
            type="button"
            onClick={() => setPicked(picked.length === BOX_TIERS.length ? [] : BOX_TIERS)}
            className="w-full rounded-lg px-2.5 py-2 text-left text-[12px] font-medium text-muted transition-colors hover:text-chalk"
          >
            {picked.length === BOX_TIERS.length ? "Clear" : "All boxes"}
          </button>

          <button
            type="button"
            disabled={busy || picked.length === 0 || !changed}
            onClick={() => {
              onSave(
                picked,
                Object.fromEntries(picked.filter((t) => amount(t) > 0).map((t) => [t, amount(t)])),
              );
              setAdd({});
              setOpen(false);
            }}
            className="mt-1.5 w-full rounded-lg bg-chalk py-2.5 text-[13px] font-semibold text-ink transition-opacity disabled:opacity-40"
          >
            {picked.length === 0
              ? "Pick at least one box"
              : units > 0
                ? `Add ${units} unit${units === 1 ? "" : "s"} & save`
                : "Save boxes"}
          </button>
        </div>
      )}
    </div>
  );
}

function Cell({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-ink-card px-3 py-3 text-center">
      <dt className="text-[10px] uppercase tracking-wider text-faint">{label}</dt>
      <dd
        className={`mt-1 font-mono text-[17px] ${accent ? "text-emerald-400" : "text-chalk"}`}
      >
        {value}
      </dd>
    </div>
  );
}

/** Big enough to hit with a thumb, and still typeable for "I counted 37". */
function Stepper({
  value,
  onChange,
  disabled,
  label,
}: {
  value: number;
  onChange: (n: number) => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <div className="flex items-stretch rounded-xl border border-hairline">
      <button
        type="button"
        disabled={disabled || value <= 1}
        onClick={() => onChange(Math.max(1, value - 1))}
        aria-label="One fewer"
        className="grid w-10 place-items-center rounded-l-xl text-lg text-muted transition-colors hover:bg-white/8 hover:text-chalk disabled:opacity-30"
      >
        −
      </button>
      <input
        type="number"
        min={1}
        inputMode="numeric"
        value={value}
        disabled={disabled}
        aria-label={label}
        onChange={(e) => {
          const next = Math.trunc(Number(e.target.value));
          onChange(Number.isFinite(next) && next > 0 ? next : 1);
        }}
        className="w-14 bg-transparent text-center font-mono text-[15px] outline-none disabled:opacity-40"
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(value + 1)}
        aria-label="One more"
        className="grid w-10 place-items-center rounded-r-xl text-lg text-muted transition-colors hover:bg-white/8 hover:text-chalk disabled:opacity-30"
      >
        +
      </button>
    </div>
  );
}

/**
 * "I recounted the shelf and there are nineteen." Distinct from adding, and
 * floored at what has sold, because units that shipped cannot be un-shipped.
 */
function SetExact({
  stocked,
  sold,
  busy,
  name,
  onSet,
}: {
  stocked: number;
  sold: number;
  busy: boolean;
  name: string;
  onSet: (units: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(String(stocked));

  useEffect(() => setText(String(stocked)), [stocked]);

  if (!editing) {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={() => setEditing(true)}
        className="rounded-lg border border-hairline px-3.5 py-2 text-[12px] text-muted transition-colors hover:border-white/25 hover:text-chalk disabled:opacity-40"
      >
        Set exact count
      </button>
    );
  }

  const commit = () => {
    const next = Math.trunc(Number(text));
    if (Number.isFinite(next) && next >= 0 && next !== stocked) onSet(next);
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={sold}
        autoFocus
        inputMode="numeric"
        value={text}
        disabled={busy}
        aria-label={`Total units of ${name} ever stocked`}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setText(String(stocked));
            setEditing(false);
          }
        }}
        className="w-20 rounded-lg border border-hairline bg-ink px-2.5 py-2 text-right font-mono text-[13px] outline-none focus:border-white/30"
      />
      <button
        type="button"
        disabled={busy}
        onClick={commit}
        className="rounded-lg bg-white/10 px-3 py-2 text-[12px] font-medium transition-colors hover:bg-white/16 disabled:opacity-40"
      >
        Set
      </button>
      <button
        type="button"
        onClick={() => {
          setText(String(stocked));
          setEditing(false);
        }}
        className="text-[12px] text-faint transition-colors hover:text-muted"
      >
        Cancel
      </button>
    </div>
  );
}
