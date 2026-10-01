"use client";

import { motion, useReducedMotion } from "framer-motion";
import { memo, useId } from "react";
import { boxGeometry, type BoxFace } from "@/lib/boxShape";
import { BoxPrint } from "./BoxPrint";

/**
 * The carton, as a picture.
 *
 * Lifted out of the shop so the onboarding can show the same object the shop
 * sells rather than a drawing of one. Two boxes that are meant to be the same
 * box and are built twice are two boxes that drift — the first time one of
 * them is tuned, the other is wrong and nobody notices.
 */

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

function ProductBoxImpl({
  accent,
  printed,
  width = 63,
  /** Turned off where several sit together and one turning box is enough. */
  spin = true,
  /** A band of light that sweeps across the walls now and then — for the box
      on sale, where it should look like foil catching the light. */
  glint = false,
}: {
  accent: string;
  printed: boolean;
  width?: number;
  spin?: boolean;
  glint?: boolean;
}) {
  const box = boxGeometry(width);
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
        boxShadow: "inset 0 0 0 1px rgb(255 255 255 / 0.08)",
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
    </div>
  );

  /*
   * The glint, as a plane of its own a pixel off each wall — not a layer
   * inside the wall. An animated child of a wall is composited separately,
   * lands exactly in the wall's own plane, and loses the depth sort to it, so
   * all that showed was a sliver at the edges. Lifted off the wall, the same
   * way the question marks are, it sorts in front cleanly. And the band is
   * the plane's own background, moved by background-position: a moving child
   * clipped inside a 3D wall is exactly what the browser could not sort.
   */
  const glintPlane = (name: BoxFace) => (
    <div
      key={`glint-${name}`}
      aria-hidden
      className="box-glint"
      style={{
        ...box.face(name),
        transform: `${box.face(name).transform} translateZ(1px)`,
        pointerEvents: "none",
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
      }}
    />
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
   * The volume is built from gradients and plain shapes, never a filter —
   * see the note inside Mark for why Safari makes that a rule.
   */
  const MARK_LIFT = 2;
  /** The mark is sized off the wall it is stuck to, not off a fixed number. */
  const markSize = Math.round(width * 0.5);

  const markFace = printed ? "#fff" : accent;
  // Unique to this box on the page, and safe inside url(#…) — React's own ids
  // carry colons, which Safari has been known to stumble on there.
  const instance = `mk${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  /** The hook, the gloss that runs along its lit side, and the dot. */
  const MARK_HOOK = "M 13.4 15.2 C 13.4 8.9 26.6 8.9 26.6 15.2 C 26.6 19.8 20 20.2 20 23.4";
  const MARK_GLOSS = "M 15.2 14.2 C 15.6 10.9 19.0 9.7 22.0 10.1";
  const MARK_DOT = { cx: 20, cy: 33, r: 3.5 };

  // A function, not a component. Declared as a component inside this one,
  // it was a new component type on every render, so React threw all four
  // marks away and built them again whenever the box rendered.
  const mark = (face: "front" | "right" | "back" | "left") => {
    // Each mark is turned to face out of its own wall, or it would read in
    // mirror writing from every side but the front.
    const turn = {
      front: "",
      right: "rotateY(90deg) ",
      back: "rotateY(180deg) ",
      left: "rotateY(-90deg) ",
    }[face];

    // The gradient lives in the document, so every mark on every box needs
    // its own id. Per instance, not per colour: the looping rail draws the
    // same box more than once, and Safari resolves a duplicated id to
    // whichever copy it meets first — when that copy is on a wall turned
    // away, the gradient paints nothing.
    const uid = `${instance}-${face}`;

    const stroke = {
      fill: "none" as const,
      strokeWidth: 6.6,
      strokeLinecap: "round" as const,
      strokeLinejoin: "round" as const,
    };

    return (
      <div
        key={face}
        aria-hidden
        className="absolute inset-x-0 top-1/2 flex justify-center"
        style={{
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
          transform: `${turn}translateZ(${box.width / 2 + MARK_LIFT}px) translateY(-50%)`,
        }}
      >
        {/*
          Four passes over one shape, and not a filter among them.

          The puff used to come from an SVG lighting filter: the glyph's alpha
          blurred into a height map, lit, composited back. It renders
          beautifully in Chrome. Safari on a phone does not — it draws a
          filtered layer in a 3D scene as a separate flat layer and sorts it
          against the walls wrongly, so on a turning box the marks on two of
          the four walls vanished behind the walls they sit on.

          Gradients and plain shapes have no such trouble, so the volume is
          built from those: a shadow dropped underneath, the body in its
          colour, a wash across it light at the top left and deep blue at the
          bottom right, and a gloss along the lit side. The body is a plain
          fill, so even if the wash ever failed the mark would still be there.
        */}
        <svg
          width={markSize}
          height={markSize}
          viewBox="0 0 40 40"
          shapeRendering="geometricPrecision"
          style={{ overflow: "visible" }}
        >
          <defs>
            {/* One light across the whole mark rather than one per shape, so
                the dot is lit from the same side as the hook above it. */}
            <linearGradient
              id={`${uid}-dome`}
              gradientUnits="userSpaceOnUse"
              x1="8"
              y1="5"
              x2="32"
              y2="36"
            >
              <stop offset="0" stopColor="#fff" stopOpacity="0.62" />
              <stop offset="0.42" stopColor="#fff" stopOpacity="0.05" />
              <stop offset="1" stopColor="#0b2236" stopOpacity="0.34" />
            </linearGradient>
          </defs>

          {/* What it casts on the wall. Offset rather than blurred: a blur is
              a filter, and filters are the thing this is avoiding. */}
          <g transform="translate(0 1.9)" opacity="0.42">
            <path d={MARK_HOOK} stroke="#08192a" {...stroke} />
            <circle {...MARK_DOT} fill="#08192a" />
          </g>

          {/* The body, then the light across it. */}
          <path d={MARK_HOOK} stroke={markFace} {...stroke} />
          <circle {...MARK_DOT} fill={markFace} />
          <path d={MARK_HOOK} stroke={`url(#${uid}-dome)`} {...stroke} />
          <circle {...MARK_DOT} fill={`url(#${uid}-dome)`} />

          {/* The gloss: a short highlight riding the top of the tube, which is
              what a lit round surface has and a flat one does not. */}
          <path
            d={MARK_GLOSS}
            fill="none"
            stroke="#fff"
            strokeWidth="1.7"
            strokeLinecap="round"
            opacity="0.8"
          />
          <circle cx="18.7" cy="31.7" r="1.15" fill="#fff" opacity="0.7" />
        </svg>
      </div>
    );
  };

  return (
    <motion.div
      className="relative"
      style={{ perspective: `${width * 11}px` }}
      whileHover={spin ? { scale: 1.05 } : undefined}
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
        animate={reducedMotion || !spin ? undefined : { rotateY: [-24, 336] }}
        transition={
          reducedMotion || !spin
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

        {glint && !reducedMotion &&
          (["front", "right", "back", "left", "top"] as BoxFace[]).map(glintPlane)}
        {mark("front")}
        {mark("right")}
        {mark("back")}
        {mark("left")}
      </motion.div>
    </motion.div>
  );
}

/**
 * Memoised: a box only changes when its colour, print, size or spin does.
 *
 * The shop re-renders every time the centred box changes, and the rail holds
 * eight of these at around six hundred elements each. Rebuilding all of them
 * for a change none of them shows held the page for long enough that the
 * light and the name visibly lagged the swipe.
 */
export const ProductBox = memo(ProductBoxImpl);
