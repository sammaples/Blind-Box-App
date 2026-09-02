"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useMemo, useState } from "react";
import { formatOdds, oddsAsOneIn, RARITY_COLOR, RARITY_LABEL } from "@/lib/catalog";
import { boxGeometry } from "@/lib/boxShape";
import type { Piece, Product } from "@/lib/types";
import { PieceImage } from "./PieceImage";
import { RarityChip } from "./ui";

type Stage = "sealed" | "shaking" | "burst" | "reveal";

const SHAKE_MS = 1700;
const BURST_MS = 620;

/** Rarer pulls get a louder celebration. */
const INTENSITY: Record<string, number> = {
  common: 18,
  uncommon: 24,
  rare: 34,
  ultra: 46,
  secret: 64,
  grail: 84,
};

export function BoxOpening({
  orderId,
  product,
  initialPiece,
  initialOdds,
  onRevealed,
}: {
  orderId: string;
  product: Product;
  initialPiece: Piece | null;
  /** Pull rate this piece had on the shelf it was drawn from. */
  initialOdds: number;
  onRevealed?: (piece: Piece) => void;
}) {
  const reducedMotion = useReducedMotion();
  const [stage, setStage] = useState<Stage>(initialPiece ? "reveal" : "sealed");
  const [piece, setPiece] = useState<Piece | null>(initialPiece);
  const [pulledOdds, setPulledOdds] = useState(initialOdds);
  const [error, setError] = useState<string | null>(null);

  const open = useCallback(async () => {
    if (stage !== "sealed") return;
    setError(null);
    setStage("shaking");

    // The suspense and the network call run together, so the box never stalls
    // waiting on a response — and never opens before one arrives either.
    const settle = new Promise((r) => setTimeout(r, reducedMotion ? 250 : SHAKE_MS));
    try {
      const res = await fetch(`/api/orders/${orderId}/reveal`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Could not open this box");

      // The piece comes back with the reveal; the catalogue is server-side.
      const pulled = (data.piece ?? null) as Piece | null;
      if (!pulled) throw new Error("This order is missing its piece");

      await settle;
      setPulledOdds(data.order.pulledOdds ?? 0);
      setPiece(pulled);
      setStage("burst");
      onRevealed?.(pulled);
      setTimeout(() => setStage("reveal"), reducedMotion ? 60 : BURST_MS);
    } catch (err) {
      await settle;
      setStage("sealed");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }, [orderId, onRevealed, reducedMotion, stage]);

  const glow = piece ? RARITY_COLOR[piece.rarity] : product.accent;
  const shardCount = piece ? INTENSITY[piece.rarity] ?? 24 : 24;

  return (
    <div className="relative flex w-full flex-col items-center">
      <div
        className="relative flex h-[26rem] w-full items-center justify-center sm:h-[30rem]"
        style={{ perspective: "1100px" }}
      >
        {/* Rarity glow behind everything */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute size-[30rem] rounded-full blur-3xl"
          style={{ background: glow }}
          animate={{
            opacity:
              stage === "reveal" ? 0.3 : stage === "burst" ? 0.55 : stage === "shaking" ? 0.22 : 0.12,
            scale: stage === "burst" ? 1.25 : 1,
          }}
          transition={{ duration: 0.5 }}
        />

        <AnimatePresence>
          {stage !== "reveal" && (
            <BlindBox
              key="box"
              accent={product.accent}
              stage={stage}
              reducedMotion={!!reducedMotion}
              onOpen={open}
            />
          )}
        </AnimatePresence>

        {/* Burst shards */}
        <AnimatePresence>
          {(stage === "burst" || stage === "reveal") && !reducedMotion && (
            <Shards key="shards" count={shardCount} color={glow} />
          )}
        </AnimatePresence>

        {/* The pull */}
        <AnimatePresence>
          {stage === "reveal" && piece && (
            <motion.div
              key="figure"
              className="absolute z-10 flex flex-col items-center"
              initial={
                reducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.28, y: 90, rotateY: -220 }
              }
              animate={{ opacity: 1, scale: 1, y: 0, rotateY: 0 }}
              transition={
                reducedMotion
                  ? { duration: 0.2 }
                  : { type: "spring", stiffness: 120, damping: 15, mass: 0.9 }
              }
            >
              {/* light column */}
              <motion.div
                aria-hidden
                className="pointer-events-none absolute bottom-0 h-[26rem] w-40 blur-2xl"
                style={{
                  background: `linear-gradient(to top, ${glow}, transparent 78%)`,
                }}
                initial={{ opacity: 0.85, scaleY: 1.3 }}
                animate={{ opacity: 0.22, scaleY: 1 }}
                transition={{ duration: 1.1 }}
              />
              <PieceImage
                piece={piece}
                className={`relative h-72 w-auto drop-shadow-[0_24px_40px_rgba(0,0,0,0.65)] sm:h-80 ${
                  reducedMotion ? "" : "float-soft"
                }`}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Caption area */}
      <div className="relative z-10 mt-2 flex min-h-[9rem] w-full max-w-md flex-col items-center text-center">
        <AnimatePresence mode="wait">
          {stage === "sealed" && (
            <motion.div
              key="cta"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-col items-center gap-3"
            >
              <p className="text-sm text-muted">{product.name} · sealed</p>
              <button
                type="button"
                onClick={open}
                className="rounded-full bg-chalk px-8 py-3.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.03] active:scale-[0.98]"
              >
                Open the box
              </button>
              {error && <p className="text-xs text-rose-400">{error}</p>}
            </motion.div>
          )}

          {stage === "shaking" && (
            <motion.p
              key="shaking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm tracking-[0.2em] text-muted uppercase"
            >
              Breaking the seal…
            </motion.p>
          )}

          {stage === "reveal" && piece && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reducedMotion ? 0 : 0.45, duration: 0.5 }}
              className="w-full"
            >
              <PullSummary piece={piece} odds={pulledOdds} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function BlindBox({
  accent,
  stage,
  reducedMotion,
  onOpen,
}: {
  accent: string;
  stage: Stage;
  reducedMotion: boolean;
  onOpen: () => void;
}) {
  const box = boxGeometry(140);

  const face = (name: Parameters<typeof box.face>[0], shade: number) => ({
    ...box.face(name),
    background: `linear-gradient(150deg, color-mix(in srgb, ${accent} 30%, #17171d) 0%, #0e0e13 62%)`,
    boxShadow: `inset 0 0 0 1px rgb(255 255 255 / 0.07), inset 0 0 60px rgb(0 0 0 / ${shade})`,
  });

  const shaking = stage === "shaking";
  const burst = stage === "burst";

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      aria-label="Open the blind box"
      className="absolute cursor-pointer rounded-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-white/60"
      style={{ width: box.width, height: box.height, transformStyle: "preserve-3d" }}
      initial={{ rotateX: -14, rotateY: -26 }}
      animate={
        burst
          ? { scale: [1, 1.14, 0.9], opacity: [1, 1, 0], rotateY: -26 }
          : shaking && !reducedMotion
            ? {
                rotateY: [-26, -18, -34, -22, -30, -26],
                rotateX: [-14, -18, -10, -16, -12, -14],
                x: [0, -6, 7, -8, 5, 0],
                scale: [1, 1.02, 0.99, 1.03, 1, 1.06],
              }
            : { rotateX: -14, rotateY: -26, y: [0, -10, 0] }
      }
      transition={
        burst
          ? { duration: 0.45, ease: "easeOut" }
          : shaking
            ? { duration: 0.42, repeat: Infinity, ease: "easeInOut" }
            : { duration: 5, repeat: Infinity, ease: "easeInOut" }
      }
      exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.25 } }}
    >
      {/* four sides + floor */}
      <div style={face("front", 0.25)}>
        <BoxFront accent={accent} lit={shaking || burst} />
      </div>
      <div style={face("back", 0.55)} />
      <div style={face("left", 0.45)} />
      <div style={face("right", 0.5)} />
      <div style={face("bottom", 0.6)} />

      {/*
        The lid. Its transform is written out rather than animated by the
        motion library: the top face is already rotated and pushed out along
        its own Z, so "up" for the lid is more translateZ, not translateY, and
        composing that with an animated transform is easy to get subtly wrong.
      */}
      <div
        style={{
          ...face("top", 0.15),
          transform: burst
            ? `rotateX(90deg) translateZ(${box.height / 2 + box.height}px) rotate(38deg)`
            : `rotateX(90deg) translateZ(${box.height / 2}px)`,
          opacity: burst ? 0 : 1,
          transition: reducedMotion
            ? "none"
            : "transform 0.5s cubic-bezier(0.2, 0.8, 0.3, 1), opacity 0.5s",
          background: `linear-gradient(150deg, color-mix(in srgb, ${accent} 46%, #1a1a20) 0%, #101016 70%)`,
          boxShadow: "inset 0 0 0 1px rgb(255 255 255 / 0.1)",
        }}
      />

      {/* seam light escaping as it rattles */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 blur-md"
        style={{
          height: 10,
          top: -6,
          background: accent,
          transform: `translateZ(${box.width / 2 + 1}px)`,
        }}
        animate={{ opacity: burst ? 1 : shaking ? [0.15, 0.75, 0.2] : 0 }}
        transition={{ duration: 0.5, repeat: shaking ? Infinity : 0 }}
      />
    </motion.button>
  );
}

function BoxFront({ accent, lit }: { accent: string; lit: boolean }) {
  return (
    <div className="relative flex size-full items-center justify-center">
      {/* ribbon */}
      <div
        className="absolute inset-y-0 left-1/2 w-7 -translate-x-1/2"
        style={{ background: `color-mix(in srgb, ${accent} 24%, transparent)` }}
      />
      <div
        className="absolute inset-x-0 top-1/2 h-7 -translate-y-1/2"
        style={{ background: `color-mix(in srgb, ${accent} 24%, transparent)` }}
      />
      <div
        className="relative flex size-16 items-center justify-center rounded-full text-2xl font-bold"
        style={{
          background: "#0c0c11",
          color: accent,
          boxShadow: `0 0 0 1px color-mix(in srgb, ${accent} 45%, transparent), 0 0 ${
            lit ? 34 : 12
          }px color-mix(in srgb, ${accent} 60%, transparent)`,
        }}
      >
        ?
      </div>
    </div>
  );
}

function Shards({ count, color }: { count: number; color: string }) {
  // Generated after the user taps, so there is no SSR pass to mismatch.
  const shards = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
        const distance = 130 + Math.random() * 230;
        return {
          id: i,
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance - 60,
          rotate: Math.random() * 540 - 270,
          size: 4 + Math.random() * 9,
          delay: Math.random() * 0.12,
          duration: 0.9 + Math.random() * 0.8,
          round: i % 3 === 0,
        };
      }),
    [count],
  );

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
      {shards.map((s) => (
        <motion.span
          key={s.id}
          className="absolute"
          style={{
            width: s.size,
            height: s.round ? s.size : s.size * 2.2,
            background: color,
            borderRadius: s.round ? "999px" : "2px",
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0.6, rotate: 0 }}
          animate={{ x: s.x, y: s.y, opacity: 0, scale: 1, rotate: s.rotate }}
          transition={{ duration: s.duration, delay: s.delay, ease: [0.15, 0.7, 0.3, 1] }}
        />
      ))}
    </div>
  );
}

function PullSummary({ piece, odds }: { piece: Piece; odds: number }) {
  const color = RARITY_COLOR[piece.rarity];
  const isChase = piece.rarity === "grail" || piece.rarity === "secret";

  return (
    <div className="flex flex-col items-center gap-3">
      {isChase && (
        <motion.p
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="shimmer-text text-xs font-bold uppercase tracking-[0.34em]"
          style={{
            backgroundImage: `linear-gradient(90deg, ${color}, #fff, ${color})`,
          }}
        >
          {piece.rarity === "grail" ? "Grail pull" : "Secret pull"}
        </motion.p>
      )}
      <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{piece.name}</h2>
      <p className="text-sm text-muted">{piece.setName}</p>
      <div className="flex items-center gap-2">
        <RarityChip rarity={piece.rarity} />
        <span className="rounded-full bg-white/8 px-2.5 py-1 font-mono text-[11px] text-muted">
          {piece.scale}
        </span>
      </div>
      <p className="max-w-sm text-sm leading-relaxed text-muted">{piece.blurb}</p>
      <p className="text-xs text-faint">
        {RARITY_LABEL[piece.rarity]} · pulled at {formatOdds(odds)} — {oddsAsOneIn(odds)}
      </p>
    </div>
  );
}
