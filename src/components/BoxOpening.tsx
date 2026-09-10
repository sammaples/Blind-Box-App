"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useState } from "react";
import {
  formatOdds,
  oddsAsOneIn,
  pieceSubtitle,
  RARITY_COLOR,
  RARITY_LABEL,
} from "@/lib/catalog";
import { boxGeometry } from "@/lib/boxShape";
import { BoxPrint, isPrinted } from "./BoxPrint";
import type { Piece, Product } from "@/lib/types";
import { PieceImage } from "./PieceImage";
import { RarityChip } from "./ui";

type Stage = "sealed" | "opening" | "reveal";

/**
 * The opening runs as one continuous move, not a set of cuts: the camera dives
 * onto the lid while the box turns under it, the flaps peel back, the descent
 * carries on into the box until the white card fills the frame, and that white
 * becomes the reveal. These are the marks along that one move.
 */
const DIVE_MS = 2200;
/** The flaps start peeling while the dive is still accelerating. */
const FLAP_START = 0.3;
/** White fills the frame just before the piece takes over. */
const WHITEOUT_AT = 1.85;

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
    setStage("opening");

    // The dive and the network call run together, so the box never stalls
    // waiting on a response — and never opens before one arrives either.
    const settle = new Promise((r) => setTimeout(r, reducedMotion ? 250 : DIVE_MS));
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
      // The white-out is already covering the frame by now, so the swap from
      // box to piece happens behind it and is never seen.
      setStage("reveal");
      onRevealed?.(pulled);
    } catch (err) {
      await settle;
      setStage("sealed");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }, [orderId, onRevealed, reducedMotion, stage]);

  const glow = piece ? RARITY_COLOR[piece.rarity] : product.accent;
  const opening = stage === "opening";

  return (
    <div className="relative flex w-full flex-col items-center">
      {/*
        The dive is sold by two things at once: the box growing, and the lens
        widening under it. Pulling the perspective in from 1100px to 460px is
        what makes the near corner of the box race past the far one — scale
        alone reads as a zoom, which is a flat, lifeless version of the same
        move.
      */}
      <motion.div
        className="relative flex h-[26rem] w-full items-center justify-center overflow-hidden sm:h-[30rem]"
        initial={false}
        animate={{ perspective: opening && !reducedMotion ? 460 : 1100 }}
        transition={{ duration: DIVE_MS / 1000, ease: [0.5, 0, 0.75, 0] }}
      >
        {/* Rarity glow behind everything */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute size-[30rem] rounded-full blur-3xl"
          style={{ background: glow }}
          animate={{
            opacity: stage === "reveal" ? 0.3 : opening ? 0.24 : 0.12,
            scale: opening ? 1.15 : 1,
          }}
          transition={{ duration: 0.5 }}
        />

        <AnimatePresence>
          {stage !== "reveal" && (
            <BlindBox
              key="box"
              accent={product.accent}
              printed={isPrinted(product.id)}
              stage={stage}
              reducedMotion={!!reducedMotion}
              onOpen={open}
            />
          )}
        </AnimatePresence>

        {/* The pull */}
        <AnimatePresence>
          {stage === "reveal" && piece && (
            <motion.div
              key="figure"
              className="absolute z-10 flex flex-col items-center"
              // The piece is already standing when the white clears — it does
              // not fly out of anything. The old spring threw it up from
              // nothing, which was the right move for a box that burst and the
              // wrong one for a camera that simply walked in.
              initial={
                reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.88, y: 34 }
              }
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={
                reducedMotion
                  ? { duration: 0.2 }
                  : { duration: 0.75, ease: [0.16, 1, 0.3, 1] }
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

        {/*
          The white-out. The box does not burst — the camera simply ends up
          inside it, and the white card is all there is left to see. Holding
          that white through the swap is what hides the cut from box to piece.
        */}
        <AnimatePresence>
          {(opening || stage === "reveal") && !reducedMotion && (
            <motion.div
              key="whiteout"
              aria-hidden
              className="pointer-events-none absolute inset-0 z-30 bg-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: opening ? [0, 0, 1] : 0 }}
              exit={{ opacity: 0 }}
              transition={
                opening
                  ? {
                      duration: DIVE_MS / 1000,
                      times: [0, WHITEOUT_AT / (DIVE_MS / 1000), 1],
                      ease: "easeIn",
                    }
                  : { duration: 0.7, ease: "easeOut" }
              }
            />
          )}
        </AnimatePresence>
      </motion.div>

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

          {opening && (
            <motion.p
              key="opening"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm tracking-[0.2em] text-muted uppercase"
            >
              Opening…
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

/* -------------------------------------------------------------------------- */

/**
 * The box, and the way it comes apart.
 *
 * A real blind box does not burst — you fold its flaps back and look inside.
 * So this one is built as an actual carton: four printed walls, a white card
 * lining, and four flaps hinged along the top edges. Opening rotates each flap
 * about its own hinge past vertical, the way board creases when you peel it.
 *
 * The camera does the rest. It dives onto the lid while the box turns beneath
 * it, keeps descending after the flaps are clear, and ends up inside, where
 * the white lining is the only thing left in frame.
 */

/** Flap angles about the hinge: flat across the mouth, then up and outward. */
const FLAP_SHUT = -90;
const FLAP_WIDE = -208;

type Side = "front" | "back" | "left" | "right";

/** Turns a flap to stand on its own wall before it is hinged. */
const SIDE_TURN: Record<Side, string> = {
  front: "",
  back: "rotateY(180deg)",
  left: "rotateY(-90deg)",
  right: "rotateY(90deg)",
};

/**
 * The die-cut.
 *
 * The tall flap is not a rectangle — it is punched into the same head the
 * figures are drawn from, so the carton looks made for what is inside it. As a
 * clip path rather than a drawn shape, both faces of the flap take it: the
 * printed board and the white card behind it are the same silhouette.
 *
 * Built from an ellipse and a rectangle rather than the catalogue's arc path,
 * because a clip path in object-bounding-box units has no way to keep an arc
 * circular when the box it scales into is not square.
 */
const HEAD_CLIP_ID = "bb-diecut-head";

function DieCutDefs() {
  return (
    <svg aria-hidden width={0} height={0} style={{ position: "absolute" }}>
      <clipPath id={HEAD_CLIP_ID} clipPathUnits="objectBoundingBox">
        {/* ears — at the free edge, where the flap tips away from the hinge */}
        <ellipse cx={0.2} cy={0.79} rx={0.17} ry={0.185} />
        <ellipse cx={0.8} cy={0.79} rx={0.17} ry={0.185} />
        {/* domed crown and the square jaw that meets the hinge */}
        <ellipse cx={0.5} cy={0.56} rx={0.44} ry={0.3} />
        <rect x={0.06} y={0.02} width={0.88} height={0.55} />
      </clipPath>
    </svg>
  );
}

function BlindBox({
  accent,
  printed,
  stage,
  reducedMotion,
  onOpen,
}: {
  accent: string;
  printed: boolean;
  stage: Stage;
  reducedMotion: boolean;
  onOpen: () => void;
}) {
  const box = boxGeometry(140);
  const opening = stage === "opening";
  const W = box.width;

  const outerFace = (name: Parameters<typeof box.face>[0], shade: number) => ({
    ...box.face(name),
    background: printed
      ? undefined
      : `linear-gradient(150deg, color-mix(in srgb, ${accent} 30%, #17171d) 0%, #0e0e13 62%)`,
    boxShadow: `inset 0 0 0 1px rgb(255 255 255 / 0.07), inset 0 0 60px rgb(0 0 0 / ${shade})`,
    overflow: "hidden" as const,
  });

  const wrap = (name: Parameters<typeof box.face>[0]) =>
    printed ? <BoxPrint face={name} style={{ zIndex: -1 }} /> : null;

  /**
   * The lining. Board is printed on one side only, so the inside of the carton
   * is bare white card — and once the camera is past the rim that lining is the
   * whole picture, which is why it gets a gradient rather than a flat fill.
   */
  const lining = (name: Parameters<typeof box.face>[0], from: string, to: string) => (
    <div
      key={`in-${name}`}
      style={{
        ...box.face(name),
        // Half a pixel in from the board it lines. Coplanar with the printed
        // wall, the two faces fight for every pixel and the box tears apart
        // into stripes as it turns.
        transform: `${box.face(name).transform} translateZ(-0.5px) rotateY(180deg)`,
        background: `linear-gradient(170deg, ${from}, ${to})`,
      }}
    />
  );

  /** One hinged flap: printed board outside, white card in. */
  const flap = (side: Side, length: number, delay: number, dieCut: boolean) => (
    <div
      key={side}
      aria-hidden
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: W,
        height: length,
        transformStyle: "preserve-3d",
        transform: `${SIDE_TURN[side]} translateZ(${W / 2}px)`,
      }}
    >
      <motion.div
        style={{ width: "100%", height: "100%", transformStyle: "preserve-3d", transformOrigin: "50% 0" }}
        initial={false}
        animate={{ rotateX: opening && !reducedMotion ? FLAP_WIDE : FLAP_SHUT }}
        transition={{
          duration: 0.8,
          delay: opening ? FLAP_START + delay : 0,
          // Overshoots a little past open, the way card springs when the
          // crease gives, then settles back.
          ease: [0.34, 1.25, 0.42, 1],
        }}
      >
        {/* White card — the side against the contents while the box is shut. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            clipPath: dieCut ? `url(#${HEAD_CLIP_ID})` : undefined,
            background: "linear-gradient(170deg, #f4f4f6, #cfd0d4)",
          }}
        />
        {/* Printed board — face up on a shut box, and the last thing to turn
            away as the flap peels back. The lid carries the same print as the
            walls; a plain-coloured top gives away that it is not one carton. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: "rotateY(180deg)",
            backfaceVisibility: "hidden",
            overflow: "hidden",
            clipPath: dieCut ? `url(#${HEAD_CLIP_ID})` : undefined,
            background: printed
              ? undefined
              : `linear-gradient(170deg, color-mix(in srgb, ${accent} 40%, #17171d), #0e0e13)`,
          }}
        >
          {printed && <BoxPrint face={side} />}
          <span
            aria-hidden
            style={{ position: "absolute", inset: 0, background: "rgb(0 0 0 / 0.12)" }}
          />
        </div>
      </motion.div>
    </div>
  );

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      aria-label="Open the blind box"
      className="absolute cursor-pointer rounded-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-white/60"
      style={{ width: box.width, height: box.height, transformStyle: "preserve-3d" }}
      initial={{ rotateX: -14, rotateY: -26 }}
      animate={
        opening && !reducedMotion
          ? {
              // The dive, in three pulls rather than one. The middle pair of
              // marks is the point of the whole shot — the box open, flaps
              // splayed, still far enough back to read — so the camera eases
              // through it before dropping over the rim. Run as a single
              // accelerating move it blows straight past that beat.
              scale: [1, 1.22, 1.62, 4.2],
              rotateX: [-14, -34, -52, -74],
              rotateY: [-26, -8, 10, 30],
              y: [0, 8, 26, 300],
            }
          : opening
            ? { rotateX: -14, rotateY: -26 }
            : { rotateX: -14, rotateY: -26, y: [0, -10, 0] }
      }
      transition={
        opening && !reducedMotion
          ? {
              duration: DIVE_MS / 1000,
              times: [0, 0.26, 0.62, 1],
              ease: ["easeOut", "easeInOut", "easeIn"],
            }
          : opening
            ? { duration: 0.2 }
            : { duration: 5, repeat: Infinity, ease: "easeInOut" }
      }
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
    >
      <DieCutDefs />

      {/* printed walls */}
      <div style={outerFace("front", 0.25)}>{wrap("front")}</div>
      <div style={outerFace("back", 0.55)}>{wrap("back")}</div>
      <div style={outerFace("left", 0.45)}>{wrap("left")}</div>
      <div style={outerFace("right", 0.5)}>{wrap("right")}</div>
      <div style={outerFace("bottom", 0.6)}>{wrap("bottom")}</div>

      {/* white lining, seen once the flaps are back */}
      {lining("front", "#e9e9ec", "#c3c4c9")}
      {lining("back", "#f6f6f8", "#d6d7db")}
      {lining("left", "#eeeef1", "#c9cace")}
      {lining("right", "#e4e4e8", "#bfc0c5")}
      {lining("bottom", "#d8d9de", "#b4b5bb")}

      {/*
        The flaps. The die-cut is the one the eye follows, so it goes on the
        near wall where it peels toward the camera, and it leads by a beat —
        all four moving at once reads as a mechanism, not a box being opened.

        It is also the shortest it can be and still show its ears. On the far
        wall, or much longer than this, the head swings up out of the frame and
        the die-cut is never seen at all.
      */}
      {flap("front", W * 0.82, 0, true)}
      {flap("back", W * 0.5, 0.08, false)}
      {flap("left", W * 0.46, 0.15, false)}
      {flap("right", W * 0.46, 0.15, false)}
    </motion.button>
  );
}

function PullSummary({ piece, odds }: { piece: Piece; odds: number }) {
  const color = RARITY_COLOR[piece.rarity];
  const isChase = piece.rarity === "chase";

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
          Chase pull
        </motion.p>
      )}
      <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{piece.name}</h2>
      <p className="text-sm text-muted">{pieceSubtitle(piece)}</p>
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
