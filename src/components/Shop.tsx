"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  formatOdds,
  PRODUCTS,
  RARITY_COLOR,
  RARITY_LABEL,
  RARITY_ORDER,
} from "@/lib/catalog";
import type { Product, Rarity, StockEntry } from "@/lib/types";
import { boxGeometry, type BoxFace } from "@/lib/boxShape";
import { BoxPrint, isPrinted } from "./BoxPrint";
import { useAccount } from "./AccountBar";
import { Price } from "./ui";
import { useScrollLock } from "@/lib/useScrollLock";

/** The boxes on sale, plus the checkout sheet that seals one. */
export function Shop({ shelves }: { shelves: Record<string, StockEntry[]> }) {
  const [checkout, setCheckout] = useState<Product | null>(null);
  const { account, signIn } = useAccount();

  /**
   * Buying needs an account, so an unsigned-in buyer is asked for one first
   * rather than being let through and refused at the end.
   */
  const startCheckout = (product: Product) => {
    if (product.comingSoon) return;
    if (!account) {
      signIn("A box is a real object that has to reach you, so we need an account before you buy. No password — we email you a link.");
      return;
    }
    setCheckout(product);
  };

  return (
    <section
      id="shop"
      className="relative z-10 mx-auto w-full max-w-6xl scroll-mt-20 px-5 sm:px-8"
    >
      <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Pick your box</h2>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {PRODUCTS.map((product, i) => (
          <ProductCard
            key={product.id}
            product={product}
            shelf={shelves[product.id] ?? []}
            index={i}
            onBuy={() => startCheckout(product)}
          />
        ))}
      </div>

      <CheckoutSheet product={checkout} onClose={() => setCheckout(null)} />
    </section>
  );
}

function ProductCard({
  product,
  shelf,
  index,
  onBuy,
}: {
  product: Product;
  shelf: StockEntry[];
  index: number;
  onBuy: () => void;
}) {
  const inStock = shelf.filter((e) => e.available > 0);
  const unitsLeft = inStock.reduce((sum, e) => sum + e.available, 0);
  const soldOut = unitsLeft === 0;
  // Not on sale yet outranks sold out: a box nobody can buy has not sold out,
  // and saying so would be the wrong story about the same disabled button.
  const comingSoon = product.comingSoon === true;

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.45, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-hairline bg-ink-card p-6 transition-colors hover:border-white/22"
    >
      {/*
        The light the box is sitting in.

        It used to be a flat disc hung above the card, so most of it fell off
        the top edge and what reached the box was a faint wash — measured, it
        lifted the card's own ground by about six levels out of 255. It is now
        centred on the box itself and painted as a gradient rather than a solid
        circle: a hot core, a broad shoulder, and nothing at the rim, which is
        what makes it read as light coming off the carton instead of a coloured
        blob behind it. Each tier glows in its own accent, so the bronze card is
        warm and the diamond one cold without either being told to be.
      */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-14 left-1/2 size-80 -translate-x-1/2 rounded-full opacity-70 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${product.accent} 0%, ${product.accent} 26%, color-mix(in srgb, ${product.accent} 55%, transparent) 48%, transparent 74%)`,
        }}
      />
      {/*
        And a tighter core inside it. One broad gradient blurred once comes out
        evenly dim: spread over that much area there is nothing bright enough
        anywhere to read as a source. This second, smaller light sits right
        behind the carton and gives the halo something to fall away from — the
        difference between a lit box and a coloured patch.
      */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-2 left-1/2 size-44 -translate-x-1/2 rounded-full opacity-75 blur-xl transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${product.accent} 0%, color-mix(in srgb, ${product.accent} 50%, transparent) 45%, transparent 72%)`,
        }}
      />

      <div className="relative flex h-40 items-center justify-center">
        <ProductBox accent={product.accent} printed={isPrinted(product.id)} />
      </div>

      <div className="relative mt-4 flex flex-1 flex-col">
        <h3 className="text-lg font-semibold tracking-tight">{product.name}</h3>
        <p className="mt-1 text-sm text-muted">{product.tagline}</p>

        <OddsByRarity shelf={shelf} />

        {/* Nothing on the shelf, nothing to report: "In stock now: 0 pieces ·
            0 units" is a line that only ever says the card is empty, which the
            button already says better. When it goes, the button takes over
            holding itself to the bottom of the card. */}
        {inStock.length > 0 && (
          <div className="mt-auto border-t border-hairline pt-4 text-[11px] text-faint">
            <p>
              In stock now: {inStock.length} pieces ·{" "}
              <span className="font-mono">{unitsLeft.toLocaleString()}</span> units
            </p>
          </div>
        )}

        {/* The card exists to be bought from, so the button gets the full width
            rather than sharing a row with anything — and at this size it is
            also a proper thumb target on a phone, which the old pill was not.
            The price is not on it: the checkout sheet states it before anything
            is committed to, which is the moment it has to be right. */}
        <div className={inStock.length > 0 ? "mt-5 pt-1" : "mt-auto pt-1"}>
          <button
            type="button"
            onClick={onBuy}
            disabled={soldOut || comingSoon}
            /* A disabled button is still read, and "Coming soon" is the whole
               message on this card until the box goes on sale — so the dead
               state gets light text on the grey (7.3:1) rather than the
               accent's dark ink dimmed into it, which came out at 1.4:1. The
               flat grey and the cursor are what say it cannot be pressed. */
            /* The gloss only on a button that can actually be pressed: a
               shimmer is an invitation, and "Sold out" is not inviting
               anything. The finish sits over the accent rather than
               replacing it, so each box keeps its own colour. */
            className={`w-full rounded-2xl py-4 text-base font-semibold transition-transform disabled:cursor-not-allowed disabled:hover:scale-100 ${
              soldOut || comingSoon
                ? "text-chalk/80"
                : "gloss text-ink hover:scale-[1.02] active:scale-[0.99]"
            }`}
            style={{ background: soldOut || comingSoon ? "#3a3a44" : product.accent }}
          >
            {comingSoon ? "Coming soon" : soldOut ? "Sold out" : "Buy a box"}
          </button>
        </div>
      </div>
    </motion.article>
  );
}

/**
 * What this box pulls, by tier.
 *
 * A horizontal bar per rarity, because the question is magnitude across a
 * handful of named things — how likely is each — and length answers that at a
 * glance where four percentages in a row do not.
 *
 * The numbers are not a marketing estimate. A tier's chance is its share of
 * the units left on this shelf, which is the same arithmetic the draw runs,
 * summed per tier. Restock a chase and the bar moves on the next page load.
 *
 * Each bar is named on its own row, so the colour is not carrying identity —
 * it is there to match the badge the same tier wears everywhere else. That
 * matters: the four rarity colours are close enough that a colourblind reader
 * could not separate them, and this chart never asks anyone to.
 */
function OddsByRarity({ shelf }: { shelf: StockEntry[] }) {
  const rows = useMemo(() => {
    const units = new Map<Rarity, number>();
    let total = 0;
    for (const entry of shelf) {
      if (entry.available <= 0) continue;
      units.set(entry.piece.rarity, (units.get(entry.piece.rarity) ?? 0) + entry.available);
      total += entry.available;
    }
    if (total === 0) return [];

    // Commonest first, so the bars read as a descending staircase and the
    // chase you are actually here for is the short one at the bottom. A tier
    // with nothing left is not listed, the same rule the shelf follows.
    const order = [...RARITY_ORDER].reverse();
    return order.filter((r) => (units.get(r) ?? 0) > 0).map((rarity) => ({
      rarity,
      units: units.get(rarity)!,
      share: units.get(rarity)! / total,
    }));
  }, [shelf]);

  if (rows.length === 0) return <div className="pb-5" />;

  return (
    <div className="mt-4 space-y-2 pb-5">
      {rows.map(({ rarity, units, share }) => (
        <div
          key={rarity}
          className="flex items-center gap-3 text-[13px]"
          title={`${units} ${units === 1 ? "unit" : "units"} of ${RARITY_LABEL[rarity]} left`}
        >
          <span className="w-[4.5rem] shrink-0 truncate text-muted">
            {RARITY_LABEL[rarity]}
          </span>
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
            {/* A floor of 3%, so a one-of-one chase still shows a mark rather
                than an empty track that reads as "none". */}
            <span
              className="block h-full rounded-full"
              style={{
                width: `${Math.max(share * 100, 3)}%`,
                background: RARITY_COLOR[rarity],
              }}
            />
          </span>
          <span className="w-14 shrink-0 text-right font-mono text-[12px] text-muted">
            {formatOdds(share)}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Seconds for one turn.
 *
 * The box used to rock: ten degrees each way, twenty degrees of travel every
 * seven seconds, which is where the turn started. It reads as a box that is
 * barely moving at that rate, so this is a little over twice as quick — fast
 * enough to register as turning while a shopper is looking at it, slow enough
 * not to pull the eye off the price.
 */
const SPIN_SECONDS = 44.4;

function ProductBox({ accent, printed }: { accent: string; printed: boolean }) {
  const box = boxGeometry(63);
  const reducedMotion = useReducedMotion();

  const faceBackground = (shade: number) =>
    `linear-gradient(150deg, color-mix(in srgb, ${accent} ${shade}%, #17171d), #0d0d12 70%)`;

  /**
   * A printed box keeps the same three-plane shading, but as a wash laid over
   * the artwork rather than as the face's own colour — without it the three
   * sides read as one flat shape and the box stops looking like an object.
   */
  const faceShade = (shade: number) =>
    `linear-gradient(150deg, rgb(0 0 0 / ${shade}), rgb(0 0 0 / ${shade + 0.1}) 78%)`;

  /**
   * How the light rolls over an edge.
   *
   * Six flat planes meeting at right angles give an edge with no width at all:
   * two shades of blue butting against each other on a hard line, which reads
   * as a cut rather than as a folded carton. A real box has a radius on every
   * fold, and what gives that radius away is not the silhouette — at this size
   * the curve is a pixel — but the light, which brightens as the surface turns
   * towards it and falls away as it turns off.
   *
   * So the edge is painted rather than modelled: a narrow band at each border
   * of every face, lit on the two sides facing the light the faces are already
   * lit from and shaded on the other two. Two or three pixels of it, which is
   * a twentieth of the face and is meant to be felt rather than seen — at
   * twice this it stops reading as a fold and starts reading as a pale frame
   * drawn around each side, which is a harder edge than the one it replaced.
   */
  const EDGE_ROLL = [
    "linear-gradient(to bottom, rgb(255 255 255 / 0.07), transparent 5%)",
    "linear-gradient(to right, rgb(255 255 255 / 0.05), transparent 4%)",
    "linear-gradient(to top, rgb(0 0 0 / 0.10), transparent 5%)",
    "linear-gradient(to left, rgb(0 0 0 / 0.08), transparent 4%)",
  ].join(", ");

  const Face = ({
    name,
    lit,
    shade,
  }: {
    name: BoxFace;
    lit: number;
    shade: number;
  }) => (
    <div
      style={{
        ...box.face(name),
        background: printed ? undefined : faceBackground(lit),
        /* The hairline this replaces was a hard white rule one pixel inside
           every border, which drew each edge rather than softening it. A blur
           in its place reads as the same light, caught on a fold. */
        boxShadow: "inset 0 0 3px 0 rgb(255 255 255 / 0.05)",
        /* Just enough to take the point off the eight corners. Past about four
           the faces stop meeting and the carton shows daylight at its folds. */
        borderRadius: 3,
        overflow: "hidden",
      }}
    >
      {printed && (
        <>
          <BoxPrint face={name} />
          <span
            aria-hidden
            style={{ position: "absolute", inset: 0, background: faceShade(shade) }}
          />
        </>
      )}
      <span
        aria-hidden
        style={{ position: "absolute", inset: 0, background: EDGE_ROLL }}
      />
    </div>
  );

  /**
   * The question mark, on all four walls — a turn shows each of them for a
   * quarter of the time, and a blank wall coming round reads as a mistake.
   *
   * It is a puffed sticker sitting on the carton, two pixels proud of it —
   * enough for the shadow to read, little enough that it does not swing
   * against its own wall as the box turns.
   *
   * The mark is drawn rather than typed. Fattening a typeface's question mark
   * with a stroke thickens the tail and the dot along with everything else,
   * and the gap between them closes until the two read as one smudge; the
   * stroke also muddies every edge it rounds. Two round-capped strokes of its
   * own have no such trouble: the hook and the dot are separate objects, and
   * the space between them is a number rather than a leftover.
   *
   * The volume is real rather than drawn on. The shape's own alpha is blurred
   * into a height map and lit from the upper left, so the surface rounds off
   * smoothly at the edges the way an inflated sticker does — stacking offset
   * copies gives thickness too, but it gives it in visible steps, which is
   * what makes those look like stacked copies rather than one solid object.
   */
  const MARK_LIFT = 2;

  const markFace = printed ? "#fff" : accent;

  const Mark = ({ face }: { face: "front" | "right" | "back" | "left" }) => {
    // Each mark is turned to face out of its own wall, or it would read in
    // mirror writing from every side but the front.
    const turn = {
      front: "",
      right: "rotateY(90deg) ",
      back: "rotateY(180deg) ",
      left: "rotateY(-90deg) ",
    }[face];

    // The filter and gradient live in the document, so every mark on every
    // card needs its own ids or they collide and share one another's lighting.
    const uid = `mk-${accent.replace(/[^a-z0-9]/gi, "")}-${face}`;

    return (
      <div
        aria-hidden
        className="absolute inset-x-0 top-1/2 flex justify-center"
        style={{
          backfaceVisibility: "hidden",
          transform: `${turn}translateZ(${box.width / 2 + MARK_LIFT}px) translateY(-50%)`,
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 40 40"
          shapeRendering="geometricPrecision"
          style={{ overflow: "visible" }}
        >
          <defs>
            {/* Across the face: lit at the top, falling into its own shade at
                the bottom. Painted over the mark's colour rather than mixed
                into it, so one pair of stops covers white and any accent. */}
            <linearGradient id={`${uid}-face`} x1="0" y1="0" x2="0.25" y2="1">
              <stop offset="0" stopColor="#fff" stopOpacity="0.5" />
              <stop offset="0.45" stopColor="#fff" stopOpacity="0.04" />
              <stop offset="1" stopColor="#000" stopOpacity="0.22" />
            </linearGradient>

            <filter
              id={`${uid}-puff`}
              x="-40%"
              y="-40%"
              width="180%"
              height="190%"
              colorInterpolationFilters="sRGB"
            >
              {/* The shape's alpha, blurred, is the height map — the blur is
                  what rounds the edges off instead of cutting them square, and
                  every unit of it also softens the mark. At this size it buys
                  the roundness at about one unit and nothing after. */}
              <feGaussianBlur in="SourceAlpha" stdDeviation="1.1" result="height" />
              <feSpecularLighting
                in="height"
                surfaceScale="2.6"
                specularConstant="0.75"
                specularExponent="26"
                lightingColor="#fff"
                result="gloss"
              >
                <fePointLight x="9" y="3" z="24" />
              </feSpecularLighting>
              {/* Light that fell outside the shape is light on nothing. */}
              <feComposite in="gloss" in2="SourceAlpha" operator="in" result="gloss" />
              <feComposite
                in="SourceGraphic"
                in2="gloss"
                operator="arithmetic"
                k1="0"
                k2="1"
                k3="1"
                k4="0"
              />
              <feDropShadow
                dx="0"
                dy="1.1"
                stdDeviation="0.8"
                floodColor="#000"
                floodOpacity="0.45"
              />
            </filter>

            {/* The hook and the dot, as one reusable pair. Three units of air
                between the end of the stem and the top of the dot: at a stroke
                this thick, anything less and the two close up into a smudge at
                card size, which is the whole reason the mark is drawn. */}
            <g id={`${uid}-glyph`}>
              <path
                d="M 13.4 15.2 C 13.4 8.9 26.6 8.9 26.6 15.2 C 26.6 19.8 20 20.2 20 23.4"
                fill="none"
                strokeWidth="6.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="20" cy="33" r="3.5" />
            </g>
          </defs>

          <g filter={`url(#${uid}-puff)`}>
            {/* The mark twice over on the same geometry: its colour, then the
                light across it. */}
            <use href={`#${uid}-glyph`} fill={markFace} stroke={markFace} />
            <use
              href={`#${uid}-glyph`}
              fill={`url(#${uid}-face)`}
              stroke={`url(#${uid}-face)`}
            />
          </g>
        </svg>
      </div>
    );
  };

  return (
    <motion.div
      className="relative"
      style={{ perspective: "700px" }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <motion.div
        className="relative"
        style={{
          width: box.width,
          height: box.height,
          transformStyle: "preserve-3d",
        }}
        initial={{ rotateX: -16, rotateY: -24 }}
        animate={reducedMotion ? undefined : { rotateY: [-24, 336] }}
        transition={
          reducedMotion
            ? undefined
            : { duration: SPIN_SECONDS, repeat: Infinity, ease: "linear" }
        }
      >
        {/* Every side, because the turn brings every side round: a face left
            out is a hole in the box. The light stays fixed to the carton, so
            the front catches the most of it and the lid the least, which is
            what separates the planes. */}
        <Face name="front" lit={34} shade={0.0} />
        <Face name="left" lit={28} shade={0.1} />
        <Face name="right" lit={24} shade={0.16} />
        <Face name="back" lit={18} shade={0.22} />
        <Face name="top" lit={14} shade={0.26} />

        <Mark face="front" />
        <Mark face="right" />
        <Mark face="back" />
        <Mark face="left" />
      </motion.div>
    </motion.div>
  );
}

function CheckoutSheet({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const { account } = useAccount();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The sheet is fixed to the bottom of the screen; this is what stops the
  // shop sliding around behind it.
  useScrollLock(product !== null);

  const buy = async () => {
    if (!product || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Could not complete the purchase");
      router.push(`/open/${data.order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={busy ? undefined : onClose}
        >
          <motion.div
            role="dialog"
            aria-label={`Buy ${product.name}`}
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-t-3xl border border-hairline bg-ink-raised p-6 sm:rounded-3xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold tracking-tight">{product.name}</h3>
                <p className="mt-1 text-sm text-muted">{product.tagline}</p>
              </div>
              <p className="font-mono text-lg">
                <Price cents={product.priceCents} />
              </p>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-muted">{product.description}</p>

            <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-hairline bg-ink px-4 py-3">
              <span className="text-[11px] uppercase tracking-[0.16em] text-faint">
                Buying as
              </span>
              <span className="truncate text-sm text-chalk">{account?.email}</span>
            </div>

            <button
              type="button"
              onClick={buy}
              disabled={busy}
              /* Same finish as the card's "Buy a box", for the same reason:
                 this is the press that spends the money, so it should read as
                 the most object-like thing on the sheet. It drops while the
                 charge is in flight — a button shimmering at you is asking to
                 be pressed, and this one is already busy. */
              className={`mt-5 w-full rounded-xl py-3.5 text-sm font-semibold text-ink transition-transform disabled:opacity-60 ${
                busy ? "" : "gloss hover:scale-[1.01] active:scale-[0.99]"
              }`}
              style={{ background: product.accent }}
            >
              {busy ? "Ripping…" : `Rip · $${(product.priceCents / 100).toFixed(2)}`}
            </button>

            {error && <p className="mt-3 text-center text-xs text-rose-400">{error}</p>}

            <p className="mt-4 text-center text-[11px] leading-relaxed text-faint">
              Demo checkout — no card is collected and nothing is charged. Your piece is
              drawn server-side the moment the box is sealed, against the published rates.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
