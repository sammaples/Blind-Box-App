"use client";

import { useRef, useState } from "react";
import { RARITY_LABEL, RARITY_ORDER } from "@/lib/catalog";
import type { Rarity, Scale } from "@/lib/types";

/**
 * The listing uploader: one new product, from nothing to catalogued.
 *
 * The photo is uploaded the moment it is chosen rather than at save. That is
 * deliberate — the server decides whether a file is really an image, and
 * finding that out after filling in a form is a worse way to learn it than
 * seeing the picture appear, or not, straight away.
 */

const SCALE_CHOICES: { scale: Scale; label: string; note: string; accent: string }[] = [
  {
    scale: "100%",
    label: "100% Blind Box",
    note: "The standard-size box",
    accent: "#f97316",
  },
  {
    scale: "400%",
    label: "400% Blind Box",
    note: "The eleven-inch box",
    accent: "#22d3ee",
  },
];

/** What the server did to the file, so the resize is not a silent change. */
interface ResizeReport {
  width: number;
  height: number;
  bytes: number;
  source: { width: number; height: number; bytes: number };
}

function describeResize({ width, height, bytes, source }: ResizeReport): string {
  const size = (n: number) =>
    n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`;

  const resized = width !== source.width || height !== source.height;
  const dimensions = resized
    ? `${source.width}×${source.height} → ${width}×${height}`
    : `${width}×${height}, already web-sized`;

  return `${dimensions} · ${size(source.bytes)} → ${size(bytes)}`;
}

export interface NewProduct {
  id: string;
  name: string;
  scale: Scale;
}

export function AddProduct({
  onSaved,
  onCancel,
}: {
  onSaved: (product: NewProduct) => void;
  onCancel: () => void;
}) {
  const [scale, setScale] = useState<Scale>("100%");
  const [name, setName] = useState("");
  const [collection, setCollection] = useState("");
  const [series, setSeries] = useState("");
  const [rarity, setRarity] = useState<Rarity>("common");
  const [notes, setNotes] = useState("");
  const [quantity, setQuantity] = useState("");

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [resize, setResize] = useState<ResizeReport | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/images", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "That photo would not upload");
      setImageUrl(data.url as string);
      setResize(data as ResizeReport);
    } catch (err) {
      setError(err instanceof Error ? err.message : "That photo would not upload");
      setImageUrl(null);
      setResize(null);
    } finally {
      setUploading(false);
    }
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving || uploading) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/catalog", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          scale,
          rarity,
          setName: collection,
          series: series.trim() === "" ? null : Number(series),
          imageUrl,
          notes,
          // Optional: a listing can go straight onto the shelf, because most of
          // the time you are adding a product because a box of them just came in.
          quantity: quantity.trim() === "" ? undefined : Number(quantity),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Could not save that product");
      onSaved({ id: data.piece.id, name: data.piece.name, scale: data.piece.scale });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save that product");
    } finally {
      setSaving(false);
    }
  };

  const ready = name.trim() !== "" && !uploading && !saving;

  return (
    <form
      onSubmit={save}
      className="mt-5 rounded-2xl border border-hairline bg-ink-card p-5 sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold">New product</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            A piece people can pull. It lands in the catalogue straight away; it only
            becomes pullable once it has units on the shelf.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="shrink-0 text-xs text-faint transition-colors hover:text-muted"
        >
          Cancel
        </button>
      </div>

      {/* which box */}
      <fieldset className="mt-6">
        <legend className="text-[11px] font-medium uppercase tracking-wider text-faint">
          Which blind box
        </legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {SCALE_CHOICES.map((choice) => (
            <button
              key={choice.scale}
              type="button"
              onClick={() => setScale(choice.scale)}
              aria-pressed={scale === choice.scale}
              className={`rounded-xl border p-3.5 text-left transition-colors ${
                scale === choice.scale
                  ? "border-white/35 bg-white/[0.07]"
                  : "border-hairline hover:border-white/20"
              }`}
            >
              <span className="flex items-center gap-2">
                <span
                  className="size-2 rounded-full"
                  style={{ background: choice.accent }}
                />
                <span className="text-[13px] font-medium">{choice.label}</span>
              </span>
              <span className="mt-1 block text-[11px] text-faint">{choice.note}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-6 grid gap-6 sm:grid-cols-[minmax(0,180px)_1fr]">
        {/* photo */}
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-faint">
            Photo
          </p>
          <div className="mt-2 overflow-hidden rounded-xl border border-hairline bg-black/30">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- uploaded bytes of unknown dimensions, served from this app
              <img
                src={imageUrl}
                alt=""
                className="aspect-square w-full bg-black/40 object-contain"
              />
            ) : (
              <div className="grid aspect-square w-full place-items-center px-4 text-center">
                <span className="text-[11px] leading-relaxed text-faint">
                  {uploading ? "Uploading…" : "No photo yet"}
                </span>
              </div>
            )}
          </div>

          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
              e.target.value = "";
            }}
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInput.current?.click()}
              className="flex-1 rounded-lg bg-white/10 py-2 text-[12px] font-medium transition-colors hover:bg-white/16 disabled:opacity-40"
            >
              {imageUrl ? "Replace" : "Choose a photo"}
            </button>
            {imageUrl && (
              <button
                type="button"
                onClick={() => {
                  setImageUrl(null);
                  setResize(null);
                }}
                className="rounded-lg border border-hairline px-3 py-2 text-[12px] text-muted transition-colors hover:border-white/30 hover:text-chalk"
              >
                Clear
              </button>
            )}
          </div>
          {resize ? (
            <p className="mt-2 text-[11px] leading-relaxed text-faint">
              {describeResize(resize)}
            </p>
          ) : (
            <p className="mt-2 text-[11px] leading-relaxed text-faint">
              JPEG, PNG, GIF or WebP. Large photos are resized for the web; the
              original is not kept.
            </p>
          )}
        </div>

        {/* details */}
        <div className="space-y-4">
          <Field label="Title" hint="What collectors will see on the reveal.">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              maxLength={160}
              placeholder="Neon Alley Secret"
              className={inputClass}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Set or series name" hint="Optional.">
              <input
                value={collection}
                onChange={(e) => setCollection(e.target.value)}
                maxLength={160}
                placeholder="Series 47"
                className={inputClass}
              />
            </Field>
            <Field label="Series number" hint="Optional.">
              <input
                value={series}
                onChange={(e) => setSeries(e.target.value)}
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="47"
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Rarity" hint="A label on the card. Odds come from stock.">
              <select
                value={rarity}
                onChange={(e) => setRarity(e.target.value as Rarity)}
                className={inputClass}
              >
                {RARITY_ORDER.map((r) => (
                  <option key={r} value={r} className="bg-ink">
                    {RARITY_LABEL[r]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Units in hand" hint="Optional — puts it on the shelf now.">
              <input
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="0"
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Notes" hint="Optional. Shown with the piece.">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="Chrome finish, glows under UV."
              className={`${inputClass} resize-y`}
            />
          </Field>
        </div>
      </div>

      {error && (
        <p className="mt-5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-300">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={!ready}
          className="rounded-full bg-chalk px-6 py-2.5 text-[13px] font-semibold text-ink transition-opacity disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save to catalogue"}
        </button>
        <span className="text-[11px] text-faint">
          {name.trim() === "" ? "A product needs a title." : `Goes in as a ${scale} piece.`}
        </span>
      </div>
    </form>
  );
}

const inputClass =
  "mt-1.5 w-full rounded-xl border border-hairline bg-ink px-3.5 py-2.5 text-[13px] text-chalk outline-none transition-colors placeholder:text-faint focus:border-white/30";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-medium uppercase tracking-wider text-faint">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-faint">{hint}</span>}
    </label>
  );
}
