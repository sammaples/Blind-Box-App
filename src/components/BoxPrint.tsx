"use client";

import { createContext, useContext, type CSSProperties } from "react";
import type { BoxFace } from "@/lib/boxShape";
import { PRODUCTS } from "@/lib/catalog";
import type { LineId } from "@/lib/lines";

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

/**
 * The paper the figures are printed on, and the colour of the carton's own
 * folded edges — exported so the crease at the mouth can match the wall it
 * is folding away from rather than approximating it.
 */
export const PRINT_GROUND = "#a3d0f2";

/**
 * Which collection's wrap to print. Each collection's box carries its own
 * kind of figure on its own ground — bears on blue, vinyl figures on pink,
 * soft buns on mint — so a box says what is inside before it is opened.
 *
 * Read from context rather than threaded through every carton component: the
 * page that knows the collection sets it once around the box.
 */
export const PrintLine = createContext<LineId>("bearbrick");

const GROUNDS: Record<LineId, string> = {
  bearbrick: PRINT_GROUND,
  popmart: "#f7c3d8",
  squishy: "#b6eadf",
  tapcap: "#ffd99a",
};

/** The ground a collection's box is printed on, which its folded edges match. */
export function groundFor(line: LineId): string {
  return GROUNDS[line] ?? PRINT_GROUND;
}

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

/** Each collection's figure, in the same 200 × 320 box the bear is drawn in. */
export function Figure({ line }: { line: LineId }) {
  if (line === "popmart") {
    return (
      <>
        <ellipse cx={62} cy={64} rx={18} ry={42} transform="rotate(-14 62 64)" />
        <ellipse cx={138} cy={64} rx={18} ry={42} transform="rotate(14 138 64)" />
        <ellipse cx={100} cy={146} rx={78} ry={66} />
        <path d="M64 212c0-14 16-22 36-22s36 8 36 22v40c0 12-10 20-22 20H86c-12 0-22-8-22-20z" />
        <rect x={70} y={262} width={26} height={30} rx={12} />
        <rect x={104} y={262} width={26} height={30} rx={12} />
      </>
    );
  }
  if (line === "tapcap") {
    return (
      <>
        <path d="M56 22H144Q160 22 160 38V150L148 163 136 149 124 161 112 150 100 165 88 150 76 161 64 149 52 163 40 150V38Q40 22 56 22Z" />
        <path d="M54 180H146Q156 180 156 190V286H44V190Q44 180 54 180Z" />
      </>
    );
  }
  if (line === "squishy") {
    return (
      <>
        <path d="M30 150 42 92 82 130z" />
        <path d="M170 150 158 92 118 130z" />
        <path d="M100 112c58 0 92 42 92 106 0 56-32 84-92 84S8 274 8 218c0-64 34-106 92-106z" />
      </>
    );
  }
  return (
    <>
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
    </>
  );
}

export function BoxPrint({ face, style }: { face: BoxFace; style?: CSSProperties }) {
  const line = useContext(PrintLine);
  const [x, y, w, h] = WINDOW[face];
  const gid = `bbfig-${line}-${face}`;

  return (
    <svg
      aria-hidden
      viewBox={`${x} ${y} ${w} ${h}`}
      preserveAspectRatio="none"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", ...style }}
    >
      <defs>
        <g id={gid}>
          <Figure line={line} />
        </g>
      </defs>

      {/* The ground is drawn oversize: `preserveAspectRatio: none` stretches the
          window to the face, and a rect sized to the window alone can leave a
          hairline of the face's own colour along an edge after rounding. */}
      <rect x={x - 20} y={y - 20} width={w + 40} height={h + 40} fill={groundFor(line)} />

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

/**
 * Products whose box is printed rather than plain.
 *
 * Every tier, now that every tier is a real carton with figures in it. This
 * used to name the single 100% box by id, which meant the rename to tiers
 * would have quietly left every box opening plain — the kind of thing no
 * typechecker catches, because a product id is only ever a string.
 */
// Every box, each in its own collection's print (see PrintLine).
const PRINTED = new Set<string>(PRODUCTS.map((p) => p.id));

export function isPrinted(productId: string): boolean {
  return PRINTED.has(productId);
}
