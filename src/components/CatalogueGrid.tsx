"use client";

import { useEffect, useState } from "react";
import { PieceImage } from "@/components/PieceImage";
import { formatOdds, RARITY_COLOR, RARITY_LABEL } from "@/lib/catalog";
import type { Rarity, Scale } from "@/lib/types";

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
  name: string;
  setName: string;
  series: number | null;
  scale: Scale;
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
  focus,
}: {
  pieces: GridPiece[];
  levels: Record<string, GridLevel>;
  busy: boolean;
  onChange: (changes: StockChange[], message: string) => void;
  onArchive: (piece: GridPiece) => void;
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
  // unit count into a pull rate.
  const poolFor = (scale: Scale) =>
    pieces
      .filter((p) => p.scale === scale && !p.archived)
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
          pool={poolFor(open.scale)}
          busy={busy}
          onClose={() => setOpenId(null)}
          onChange={onChange}
          onArchive={onArchive}
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
          <span className="rounded-md bg-white/[0.07] px-1.5 py-0.5 font-mono text-[11px] text-muted">
            {piece.scale}
          </span>
          <span className="truncate text-[12px] text-faint">
            {piece.setName || (piece.series !== null ? `Series ${piece.series}` : "—")}
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
}: {
  piece: GridPiece;
  level: GridLevel | null;
  pool: number;
  busy: boolean;
  onClose: () => void;
  onChange: (changes: StockChange[], message: string) => void;
  onArchive: (piece: GridPiece) => void;
}) {
  const [amount, setAmount] = useState(1);

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
              {piece.scale} ·{" "}
              {piece.setName || (piece.series !== null ? `Series ${piece.series}` : "No set")}
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
              <p className="text-[11px] font-semibold uppercase tracking-wider text-faint">
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

              <div className="mt-2 flex gap-2">
                {[6, 12, 24].map((n) => (
                  <button
                    key={n}
                    type="button"
                    disabled={busy}
                    onClick={() => setAmount(n)}
                    className={`flex-1 rounded-lg border py-2 text-[13px] transition-colors disabled:opacity-40 ${
                      amount === n
                        ? "border-white/35 bg-white/10 text-chalk"
                        : "border-hairline text-muted hover:border-white/25 hover:text-chalk"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>

              <p className="mt-3 text-[12px] leading-relaxed text-faint">
                {units + amount > 0 ? (
                  <>
                    Adding {amount} puts this piece at{" "}
                    <span className="font-mono text-muted">
                      {formatOdds(projected(amount))}
                    </span>{" "}
                    of the {piece.scale} shelf — a rate is just its share of the units
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

              <button
                type="button"
                disabled={busy}
                onClick={() => onArchive(piece)}
                className="mt-4 text-[12px] text-faint underline underline-offset-4 transition-colors hover:text-muted disabled:opacity-40"
              >
                Archive this piece
              </button>
            </div>
          </>
        )}
      </div>
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
