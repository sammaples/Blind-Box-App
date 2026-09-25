"use client";

import { motion, useReducedMotion } from "framer-motion";
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

export function ProductBox({
  accent,
  printed,
  width = 63,
  /** Turned off where several sit together and one turning box is enough. */
  spin = true,
}: {
  accent: string;
  printed: boolean;
  width?: number;
  spin?: boolean;
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
  /** The mark is sized off the wall it is stuck to, not off a fixed number. */
  const markSize = Math.round(width * 0.5);

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
          width={markSize}
          height={markSize}
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

        <Mark face="front" />
        <Mark face="right" />
        <Mark face="back" />
        <Mark face="left" />
      </motion.div>
    </motion.div>
  );
}
