import type { CSSProperties } from "react";
import type { BoxFace } from "@/lib/boxShape";

/**
 * A printed box wrap: the app's own figures scattered across a pale blue
 * ground, the way a real blind box carries a picture of what might be inside.
 *
 * Drawn rather than photographed, from the same silhouette the catalogue art
 * uses, so it needs no image asset and stays sharp at any size.
 *
 * One sheet, six windows. Every face shows a different region of the same
 * artwork, so the print reads as continuous around the box instead of the same
 * tile repeated on each side.
 */

/** Sheet coordinates. Three face-width windows across, one face tall. */
const SHEET_W = 840;
const SHEET_H = 440;
/** A face at print scale: boxes are 7 wide to 11 tall. */
const FACE_W = 280;
const FACE_H = 440;

/** The figure's own box, and the point it rotates about. */
const FIG_W = 200;
const FIG_H = 320;
const FIG_CX = 100;
const FIG_CY = 160;

/**
 * The colours the figures come in. Saturated and unmixed — at this size a
 * figure is a few pixels of flat colour, and anything subtle turns to mud
 * against the blue.
 */
const INK = [
  "#ec4899", "#f472b6", "#ef4444", "#fb923c", "#fbbf24", "#22c55e",
  "#14b8a6", "#22d3ee", "#3b82f6", "#6366f1", "#a855f7", "#d946ef",
  "#f8fafc", "#cbd5e1", "#1e293b", "#b45309",
];

const GROUND = "#a3d0f2";

/**
 * Deterministic scatter.
 *
 * The layout has to be identical on the server and in the browser or React
 * throws away the markup it was sent, so this is a seeded generator rather
 * than Math.random — same seed, same sheet, every render.
 */
function scatter(seed: number) {
  let s = seed >>> 0;
  return () => {
    // mulberry32
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Fig {
  x: number;
  y: number;
  scale: number;
  rotate: number;
  fill: string;
}

/**
 * Figures are placed on a loose grid and then jittered, which keeps them from
 * clumping or leaving bald patches the way pure random placement does. The
 * margins are deliberately overrun so figures run off every edge — a wrap that
 * stops short of the fold looks like a sticker, not a print.
 */
const FIGURES: Fig[] = (() => {
  const rand = scatter(0x8bad5eed);
  // Dense and small: the box front is about sixty pixels across on a card, and
  // a handful of large figures at that size reads as smudges rather than as a
  // crowd of toys. Many small ones read as a print.
  const cols = 10;
  const rows = 8;
  const cellW = (SHEET_W + 160) / cols;
  const cellH = (SHEET_H + 160) / rows;
  const out: Fig[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      out.push({
        x: -80 + col * cellW + rand() * cellW * 0.9,
        y: -80 + row * cellH + rand() * cellH * 0.9,
        scale: 0.13 + rand() * 0.2,
        rotate: -95 + rand() * 190,
        fill: INK[Math.floor(rand() * INK.length)],
      });
    }
  }
  return out;
})();

/** Which part of the sheet each face shows. */
const WINDOW: Record<BoxFace, [number, number, number, number]> = {
  front: [0, 0, FACE_W, FACE_H],
  right: [FACE_W, 0, FACE_W, FACE_H],
  left: [FACE_W * 2, 0, FACE_W, FACE_H],
  back: [FACE_W / 2, 0, FACE_W, FACE_H],
  // The lid and floor are square, so they take a square bite out of the middle.
  top: [FACE_W, 80, FACE_W, FACE_W],
  bottom: [FACE_W * 1.6, 80, FACE_W, FACE_W],
};

export function BoxPrint({ face, style }: { face: BoxFace; style?: CSSProperties }) {
  const [x, y, w, h] = WINDOW[face];
  const gid = `bbfig-${face}`;

  return (
    <svg
      aria-hidden
      viewBox={`${x} ${y} ${w} ${h}`}
      preserveAspectRatio="none"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", ...style }}
    >
      <defs>
        <g id={gid}>
          <circle cx={70} cy={46} r={17} />
          <circle cx={130} cy={46} r={17} />
          <path d="M56 118V70a44 44 0 0 1 88 0v48z" />
          <rect x={86} y={112} width={28} height={16} rx={4} />
          <circle cx={48} cy={142} r={13} />
          <circle cx={152} cy={142} r={13} />
          <rect x={62} y={126} width={76} height={80} rx={9} />
          <rect x={35} y={134} width={26} height={74} rx={13} />
          <rect x={139} y={134} width={26} height={74} rx={13} />
          <rect x={62} y={200} width={76} height={26} rx={7} />
          <rect x={65} y={220} width={33} height={72} rx={10} />
          <rect x={102} y={220} width={33} height={72} rx={10} />
        </g>
      </defs>

      {/* The ground is drawn oversize: `preserveAspectRatio: none` stretches the
          window to the face, and a rect sized to the window alone can leave a
          hairline of the face's own colour along an edge after rounding. */}
      <rect x={x - 20} y={y - 20} width={w + 40} height={h + 40} fill={GROUND} />

      {FIGURES.map((f, i) => (
        <use
          key={i}
          href={`#${gid}`}
          fill={f.fill}
          transform={`translate(${f.x} ${f.y}) rotate(${f.rotate}) scale(${f.scale}) translate(${-FIG_CX} ${-FIG_CY})`}
        />
      ))}
    </svg>
  );
}

/** Products whose box is printed rather than plain. */
const PRINTED = new Set(["hundred"]);

export function isPrinted(productId: string): boolean {
  return PRINTED.has(productId);
}
