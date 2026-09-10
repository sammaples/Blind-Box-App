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
import { playChaseWindup, type ChaseSound } from "@/lib/chaseSound";
import { BoxPrint, isPrinted } from "./BoxPrint";
import type { Piece, Product } from "@/lib/types";
import { PieceImage } from "./PieceImage";
import { RarityChip } from "./ui";

/**
 * `winding` is the beat between the tap and the flaps.
 *
 * It exists so the box can react before it opens. Every pull spends a moment
 * there while the reveal call lands; a chase spends far longer, shaking and
 * throwing colour, because that wait is the tell that something rare is
 * coming. Nothing can open before the server has said what is inside anyway,
 * so this is where that wait belongs.
 */
type Stage = "sealed" | "winding" | "opening" | "reveal";

/**
 * The opening, in seconds along one timeline.
 *
 * The camera holds. The box tips just far enough to show its mouth, the flaps
 * peel back, and then the light does the work: whatever the box is about to
 * give up starts pouring out of it in the colour of its tier, builds until it
 * is all there is, and blows out to white. The piece is standing there when
 * the white clears.
 *
 * The tier is known long before the light needs it — the reveal call returns
 * while the flaps are still moving — so the glow can be the real colour rather
 * than a guess that corrects itself.
 */
const OPEN_MS = 2600;
/** The flaps start peeling once the box has finished tipping. */
const FLAP_START = 0.35;
/** Light begins escaping as the flaps part, and builds from there. */
const GLOW_AT = 0.95;
/** The blow-out, once the light has nowhere left to go. */
const FLASH_AT = 2.15;

/**
 * Chase pulls, and only chase pulls, get the loud version.
 *
 * A chase is roughly one box in a hundred. If every tier shook and burst, the
 * one that matters would look like all the others — so the rattle, the colour
 * hunt, the riser, the rays and the shards exist here and nowhere else, and
 * every other tier keeps the calm opening exactly as it was.
 *
 * All of the fighting happens before the box opens, not during: it rattles
 * harder and harder against shut flaps while colour hunts across the frame,
 * and the opening itself is the same steady move every tier gets. That is what
 * the wind-up buys — by the time the flaps give, you already know.
 */
/** Long enough to notice, short enough not to feel like a hang. */
const CHASE_WIND_MS = 2100;
/** Everyone else: just the beat it takes the reveal call to land. */
const WIND_MIN_MS = 420;

/**
 * The rattle: one steady buzz, the same the whole way through.
 *
 * Frequency is what makes this read as something trying to get out. Eleven
 * swings across two seconds is a box rocking; this is twenty-two, about one
 * every 95ms, fast enough to blur and still resolve as a direction each way.
 *
 * It does not build. An amplitude that ramps means the first half of the
 * wind-up is a box barely moving, which reads as nothing happening rather
 * than as tension — the box is either fighting or it is not. So every swing
 * is the same throw, from the first to the last.
 *
 * Generated rather than typed out: the point is the shape, and two dozen
 * hand-written numbers hide it.
 */
const SHAKE_SWINGS = 22;

function buildShake(throwX: number, throwTilt: number) {
  const times: number[] = [];
  const x: number[] = [];
  const tilt: number[] = [];
  for (let i = 0; i <= SHAKE_SWINGS; i++) {
    const at = i / SHAKE_SWINGS;
    times.push(at);
    if (i === 0 || i === SHAKE_SWINGS) {
      // Starts and ends on centre, so it neither snaps in nor leaves the box
      // parked off to one side when the flaps take over.
      x.push(0);
      tilt.push(0);
      continue;
    }
    const side = i % 2 === 0 ? 1 : -1;
    x.push(+(side * throwX).toFixed(2));
    tilt.push(+(side * throwTilt).toFixed(2));
  }
  return { times, x, tilt };
}

const CHASE_SHAKE = buildShake(22, 4.8);
const CHASE_SHAKE_TIMES = CHASE_SHAKE.times;
const CHASE_SHAKE_X = CHASE_SHAKE.x;
const CHASE_SHAKE_TILT = CHASE_SHAKE.tilt;

/**
 * The colours that flash across the frame while a chase winds up.
 *
 * Deliberately not the tier's gold: a rare pull announcing itself in one
 * colour looks like the ordinary glow arriving early. Cycling through the
 * whole rarity palette and back to gold reads as the machine hunting for an
 * answer, and lands on the one it found.
 */
const CHASE_WIND_COLORS = [
  "#fbbf24",
  "#22d3ee",
  "#f472b6",
  "#a855f7",
  "#4ade80",
  "#fb7185",
  "#60a5fa",
  "#fbbf24",
];

/** Both halves of the spill run on the same ramp: nothing, then everything. */
const SPILL = {
  duration: OPEN_MS / 1000,
  times: [0, GLOW_AT / (OPEN_MS / 1000), FLASH_AT / (OPEN_MS / 1000), 1],
  ease: "easeIn" as const,
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
    setStage("winding");

    // Started from the tap itself, which is the only moment a browser will
    // let audio begin. Silent until we know it is a chase — the riser is
    // started here and cancelled immediately for everything else.
    const startedAt = Date.now();
    const waitUntil = (ms: number) =>
      new Promise((r) => setTimeout(r, Math.max(0, ms - (Date.now() - startedAt))));

    let sound: ChaseSound | null = null;
    try {
      const res = await fetch(`/api/orders/${orderId}/reveal`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Could not open this box");

      // The piece comes back with the reveal; the catalogue is server-side.
      const pulled = (data.piece ?? null) as Piece | null;
      if (!pulled) throw new Error("This order is missing its piece");

      // Stored before the wait, not after: the wind-up, the rattle and the
      // glow are all coloured by the tier. The figure stays gated on the
      // reveal stage, so nothing is given away but the fact it is special.
      setPiece(pulled);
      setPulledOdds(data.order.pulledOdds ?? 0);

      const isChase = pulled.rarity === "chase";
      const wind = reducedMotion ? 0 : isChase ? CHASE_WIND_MS : WIND_MIN_MS;
      if (isChase && !reducedMotion) sound = playChaseWindup(wind);

      await waitUntil(wind);
      setStage("opening");
      // The riser peaks as the box gives, so the hit lands on the flaps.
      sound?.pop();

      await waitUntil(wind + (reducedMotion ? 250 : OPEN_MS));
      // The flash is already covering the frame by now, so the swap from box
      // to piece happens behind it and is never seen.
      setStage("reveal");
      onRevealed?.(pulled);
    } catch (err) {
      sound?.stop();
      await waitUntil(400);
      setStage("sealed");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }, [orderId, onRevealed, reducedMotion, stage]);

  const glow = piece ? RARITY_COLOR[piece.rarity] : product.accent;
  const opening = stage === "opening";
  const winding = stage === "winding";
  // Known in time because the reveal call stores its result the moment it
  // lands, before the wind-up is over.
  const chase = piece?.rarity === "chase";
  const loud = chase && !reducedMotion;

  return (
    <div className="relative flex w-full flex-col items-center">
      {/*
        The bloom is the page lighting up, not a panel that lights up on it.
        Fixed and full-bleed, so it has no edge to give itself away — clipped
        to the stage it read as a rectangle of light pasted over the page.

        It has to live out here rather than inside the stage: `perspective`
        makes an element the containing block for its fixed descendants, so a
        fixed child of the stage would be measured against the stage, which is
        the very box we are trying to escape.
      */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: `radial-gradient(75rem 65rem at 50% 45%, ${glow}, transparent 72%)`,
        }}
        initial={false}
        animate={
          opening && !reducedMotion
            ? { opacity: loud ? [0.1, 0.1, 0.85, 1] : [0.1, 0.1, 0.6, 0.85] }
            : { opacity: stage === "reveal" ? (chase ? 0.42 : 0.26) : 0.1 }
        }
        transition={opening && !reducedMotion ? SPILL : { duration: 0.5 }}
      />

      {/*
        The stage is sized for the box with its flaps up. Once they are gone
        that height is a hole above the piece, pushing the buttons onto the
        bottom edge of a phone — so it draws in for the reveal. The swap
        happens while the frame is still white, so it is never seen.
      */}
      <div
        className={`relative flex w-full items-center justify-center transition-[height] duration-500 ${
          stage === "reveal" ? "h-[21rem] sm:h-[25rem]" : "h-[34rem]"
        }`}
        style={{ perspective: "1100px" }}
      >
        {/*
          The light coming out of the box, in the colour of the tier inside it.

          Head on you never see into the carton, so the glow cannot be sold by
          lighting an interior nobody can look at — it has to leave through the
          top. Two parts do that: a hot core sitting in the mouth, and a column
          rising off it. Both are anchored to the rim and scale from their base.

          Both also sit BEHIND the carton. Painted over it, the core washed
          across the near flap and the light read as a flare stuck to the front
          of the box rather than as anything inside it. Behind, the box hides
          its hottest part and the flaps stand in front of what they are
          letting out — which is the whole idea. The carton is what gives the
          light a shape; everything you see of it has cleared the rim.
        */}
        <AnimatePresence>
          {opening && !reducedMotion && (
            <motion.div key="spill" className="pointer-events-none absolute inset-0 z-0">
              <motion.div
                aria-hidden
                className="absolute left-1/2 blur-xl"
                style={{
                  width: 132,
                  height: 300,
                  marginLeft: -66,
                  // On the rim, not inside the box. Behind the carton,
                  // anything below this line is simply swallowed — the spill
                  // only exists from the mouth up.
                  bottom: "calc(50% + 116px)",
                  transformOrigin: "50% 100%",
                  mixBlendMode: "screen",
                  background: `linear-gradient(to top, ${glow}, transparent 78%)`,
                }}
                initial={{ opacity: 0, scaleY: 0.1, scaleX: 0.5 }}
                animate={{
                  opacity: [0, 0, 1, 1],
                  scaleY: [0.1, 0.1, 1, 1.4],
                  scaleX: [0.5, 0.5, 1, 1.6],
                }}
                transition={SPILL}
              />
              <motion.div
                aria-hidden
                className="absolute left-1/2 rounded-full blur-lg"
                style={{
                  width: 170,
                  height: 72,
                  marginLeft: -85,
                  bottom: "calc(50% + 98px)",
                  mixBlendMode: "screen",
                  background: `radial-gradient(closest-side, #fff, ${glow} 45%, transparent 75%)`,
                }}
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: [0, 0, 1, 1], scale: [0.4, 0.4, 1, 1.5] }}
                transition={SPILL}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/*
          The rays, chase only, above the spill they grow out of.
        */}
        <AnimatePresence>
          {loud && opening && <ChaseRays key="rays" color={glow} />}
        </AnimatePresence>

        <AnimatePresence>
          {stage !== "reveal" && (
            <BlindBox
              key="box"
              accent={product.accent}
              glow={glow}
              loud={loud}
              winding={winding}
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
              className="absolute z-20 flex flex-col items-center"
              // The piece is already standing when the white clears — it does
              // not fly out of anything. The old spring threw it up from
              // nothing, which was the right move for a box that burst and the
              // wrong one for a camera that simply walked in.
              initial={
                reducedMotion
                  ? { opacity: 0 }
                  : chase
                    ? { opacity: 0, scale: 1.35, y: 0 }
                    : { opacity: 0, scale: 0.88, y: 34 }
              }
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={
                reducedMotion
                  ? { duration: 0.2 }
                  : chase
                    ? // Slammed down out of the white rather than eased up into
                      // it: a chase should feel like it landed, not arrived.
                      { type: "spring", stiffness: 260, damping: 14, mass: 0.8 }
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

      </div>

      {/*
        The colour hunt.

        Full-bleed and cycling the whole rarity palette while the box fights,
        landing on gold. A rare pull announcing itself in its own colour from
        the first frame just looks like the ordinary glow arriving early — the
        point of throwing every colour is that you cannot tell yet, and then
        suddenly you can.
      */}
      <AnimatePresence>
        {loud && winding && (
          <motion.div
            key="hunt"
            aria-hidden
            className="pointer-events-none fixed inset-0 z-10"
            style={{ mixBlendMode: "screen" }}
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0.22, 0.16, 0.32, 0.24, 0.45, 0.34, 0.6, 0.75],
              backgroundColor: CHASE_WIND_COLORS,
            }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            transition={{ duration: CHASE_WIND_MS / 1000, ease: "linear" }}
          />
        )}
      </AnimatePresence>

      {/*
        The pop, over the whole page and above the white.

        It has to outrank the flash: fired underneath it, the burst goes off at
        the exact moment the frame turns white and is never seen at all. Above
        it, the shockwave lands just before the white and the shards carry on
        across it, so the two read as one event rather than one swallowing the
        other.
      */}
      <AnimatePresence>
        {loud && opening && <ChaseBurst key="burst" color={glow} />}
      </AnimatePresence>

      {/*
        The blow-out, over the whole page for the same reason as the bloom: the
        light builds until the frame cannot hold it, goes white in a fifth of a
        second, then holds long enough to cover the swap from box to piece
        before clearing.
      */}
      <AnimatePresence>
        {(opening || stage === "reveal") && !reducedMotion && (
          <motion.div
            key="flash"
            aria-hidden
            className="pointer-events-none fixed inset-0 z-40 bg-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: opening ? [0, 0, 1, 1] : 0 }}
            exit={{ opacity: 0 }}
            transition={
              opening
                ? {
                    duration: OPEN_MS / 1000,
                    times: [
                      0,
                      FLASH_AT / (OPEN_MS / 1000),
                      (FLASH_AT + 0.22) / (OPEN_MS / 1000),
                      1,
                    ],
                    ease: "easeIn",
                  }
                : { duration: 0.55, ease: "easeOut" }
            }
          />
        )}
      </AnimatePresence>

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

          {(winding || opening) && (
            <motion.p
              key="opening"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`text-sm tracking-[0.2em] uppercase ${
                loud && winding ? "font-semibold text-chalk" : "text-muted"
              }`}
            >
              {/* The only word said before the reveal that is not said for
                  every tier. It names the wait without naming the piece. */}
              {loud && winding ? "Something rare…" : "Opening…"}
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
 * The light getting out: sun rays off the mouth of the box.
 *
 * The spill already puts a column of colour above the rim, but a column is a
 * glow — it says the box is lit, not that something is escaping it. Rays say
 * escaping. They are struck from the same point the column rises from, so the
 * two read as one shaft of light breaking into spokes rather than two effects
 * stacked on the same box.
 *
 * Two discs of repeating wedges, counter-rotating: one narrow and white for the
 * hard spokes, one wide and tier-coloured behind it. Turning them against each
 * other makes the fan shimmer instead of sitting still, which is the difference
 * between light and a drawn sunburst.
 *
 * Everything below the rim is masked away. The rays belong to the opening, and
 * a full disc would put half of them across the front of a box that is very
 * obviously solid.
 *
 * They are struck behind the carton for the same reason the spill is: the
 * point where they converge belongs inside the box, hidden by it, so what
 * reaches the camera is only the part that has already escaped.
 */
const RAY_RADIUS = 460;

function ChaseRays({ color }: { color: string }) {
  const secs = OPEN_MS / 1000;
  /** Struck as the flaps part, at full reach by the blow-out. */
  const times = [0, GLOW_AT / secs, FLASH_AT / secs, 1];

  const disc = {
    position: "absolute" as const,
    left: 0,
    // Centred on the rim: the wedges all converge at the mouth, and the
    // wrapper crops the half that would fall down the front of the carton.
    bottom: -RAY_RADIUS,
    width: RAY_RADIUS * 2,
    height: RAY_RADIUS * 2,
  };

  /** Bright at the mouth, gone before the edge — rays thin out, they do not stop. */
  const falloff =
    "radial-gradient(closest-side, rgb(0 0 0 / 0.5) 0%, #000 16%, rgb(0 0 0 / 0.72) 44%, transparent 78%)";

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute z-0"
      style={{
        left: "50%",
        bottom: "calc(50% + 74px)",
        width: RAY_RADIUS * 2,
        height: RAY_RADIUS,
        marginLeft: -RAY_RADIUS,
        overflow: "hidden",
        // Softens the straight cut along the rim, so the fan grows out of the
        // box rather than sitting on a shelf.
        maskImage: "linear-gradient(to top, transparent, #000 16%)",
        WebkitMaskImage: "linear-gradient(to top, transparent, #000 16%)",
        // Additive, like the rest of the spill: rays brighten the flaps they
        // cross instead of painting over them.
        mixBlendMode: "screen",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0, 1, 1] }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      transition={{ duration: secs, times, ease: "easeIn" }}
    >
      {/* wide, coloured, soft — the body of the light */}
      <motion.div
        style={{
          ...disc,
          filter: "blur(9px)",
          maskImage: falloff,
          WebkitMaskImage: falloff,
          background: `repeating-conic-gradient(from 6deg, ${color} 0deg, ${color} 6deg, transparent 6deg, transparent 30deg)`,
        }}
        initial={{ scale: 0.2, rotate: 0, opacity: 0 }}
        animate={{ scale: [0.2, 0.24, 1, 1.3], rotate: [0, 0, -13, -21], opacity: [0, 0, 0.85, 0.95] }}
        transition={{ duration: secs, times, ease: "easeOut" }}
      />
      {/* narrow, white, hard — the spokes you actually read as rays */}
      <motion.div
        style={{
          ...disc,
          filter: "blur(2px)",
          maskImage: falloff,
          WebkitMaskImage: falloff,
          background:
            "repeating-conic-gradient(from 0deg, #fff 0deg, #fff 2.2deg, transparent 2.2deg, transparent 15deg)",
        }}
        initial={{ scale: 0.2, rotate: 0, opacity: 0 }}
        animate={{ scale: [0.2, 0.26, 1, 1.34], rotate: [0, 0, 9, 15], opacity: [0, 0, 0.8, 0.92] }}
        transition={{ duration: secs, times, ease: "easeOut" }}
      />
    </motion.div>
  );
}

/**
 * A chase coming out: a spray of shards.
 *
 * Timed to land before the blow-out rather than after it — a burst that
 * arrives once the frame is already white reads as a second, weaker event
 * instead of the same one. There was a shockwave ring here too; it read as a
 * drawn circle sitting on top of the box rather than as anything the box did.
 *
 * Laid out from a fixed table rather than at random: this renders on the
 * client only, but a rarity celebration that is different every time is harder
 * to recognise as *the* chase moment, and the odd unlucky seed gives you a
 * lopsided spray on the one pull that has to look right.
 */
const SHARD_COUNT = 26;

function ChaseBurst({ color }: { color: string }) {
  const shards = Array.from({ length: SHARD_COUNT }, (_, i) => {
    // Evenly spaced, then nudged off the ring so it does not read as a clock
    // face. The nudge is a function of the index, so it is the same spray on
    // every chase ever pulled.
    const angle = (i / SHARD_COUNT) * Math.PI * 2 + (i % 3) * 0.12;
    const distance = 180 + (i % 5) * 46;
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance - 30,
      size: 5 + (i % 4) * 3,
      round: i % 3 === 0,
      spin: (i % 2 ? 1 : -1) * (160 + (i % 7) * 60),
      delay: (i % 4) * 0.03,
    };
  });

  const BURST = OPEN_MS / 1000 + 0.5;
  /**
   * Well before the white, not a hair before it.
   *
   * The burst has to happen while there is still a dark frame to happen
   * against: fired at the blow-out, a gold shockwave lands on a white screen
   * and is invisible. This gives it about four-tenths of a second in the
   * clear, and the shards that are still travelling carry on across the white.
   */
  const POP = FLASH_AT - 0.45;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 grid place-items-center">
      {shards.map((sh, i) => (
        <motion.span
          key={i}
          className="absolute"
          style={{
            width: sh.size,
            height: sh.round ? sh.size : sh.size * 2.4,
            background: "#fff",
            borderRadius: sh.round ? 999 : 2,
            boxShadow: `0 0 14px ${color}, 0 0 30px ${color}`,
          }}
          initial={{ opacity: 0, x: 0, y: 0, scale: 0.4, rotate: 0 }}
          animate={{
            opacity: [0, 0, 1, 0],
            x: [0, 0, sh.x * 0.55, sh.x],
            y: [0, 0, sh.y * 0.55, sh.y],
            scale: [0.4, 0.4, 1, 0.7],
            rotate: [0, 0, sh.spin * 0.5, sh.spin],
          }}
          transition={{
            duration: BURST,
            delay: sh.delay,
            times: [0, POP / BURST, (POP + 0.2) / BURST, 1],
            ease: [0.15, 0.7, 0.3, 1],
          }}
        />
      ))}
    </div>
  );
}

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
  glow,
  loud,
  winding,
  printed,
  stage,
  reducedMotion,
  onOpen,
}: {
  accent: string;
  glow: string;
  /** A chase is inside, so the box fights before it opens. */
  loud: boolean;
  /** Wound up and rattling, flaps still shut. */
  winding: boolean;
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
        overflow: "hidden",
      }}
    >
      {/*
        The white card catching the light, painted onto the lining itself.
        This has to live inside a face and not beside one: a blurred or blended
        element as a direct child of the box flattens its 3D context, and the
        carton collapses into a flat card.
      */}
      <motion.div
        aria-hidden
        style={{ position: "absolute", inset: "-40%", background: `radial-gradient(circle at 50% 100%, ${glow}, transparent 70%)` }}
        initial={{ opacity: 0 }}
        animate={opening && !reducedMotion ? { opacity: [0, 0, 0.75, 0.95] } : { opacity: 0 }}
        transition={
          opening && !reducedMotion
            ? {
                duration: OPEN_MS / 1000,
                times: [0, GLOW_AT / (OPEN_MS / 1000), FLASH_AT / (OPEN_MS / 1000), 1],
                ease: "easeIn",
              }
            : { duration: 0.2 }
        }
      />
    </div>
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
          duration: 1.1,
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
      className="absolute z-10 cursor-pointer rounded-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-white/60"
      style={{ width: box.width, height: box.height, transformStyle: "preserve-3d" }}
      initial={{ rotateX: -14, rotateY: -26 }}
      animate={
        winding && loud
          ? {
              // Wound up and fighting, flaps still shut. The rattle is the
              // whole point of this beat: the box has to look like it is
              // holding something in before it lets it out.
              rotateX: -14,
              rotateY: -26,
              scale: 1.06,
              x: CHASE_SHAKE_X,
              rotateZ: CHASE_SHAKE_TILT,
            }
          : winding
            ? { rotateX: -14, rotateY: -26, scale: 1.02, x: 0, rotateZ: 0 }
            : opening && !reducedMotion
          ? {
              // Head on, the angle the box sits at everywhere else in the shop.
              // The camera never moves off it — the box only steps toward you,
              // since nothing else is closing the distance now. Seen this way
              // the flaps splay outward against the background rather than
              // opening into a mouth, and the light leaves through the top.
              scale: [1, 1.38, 1.38],
              rotateX: [-14, -16, -17],
              rotateY: [-26, -24, -23],
              // Sits lower than centre while it is open. The flaps swing well
              // above the carton, and centred they crowd the back link.
              y: [0, 34, 34],
              // Steady again by now. Everything violent happened during the
              // wind-up; the opening itself is the same calm move for every
              // tier, which is what makes the wind-up read as the special part.
              x: 0,
              rotateZ: 0,
            }
          : opening
            ? { rotateX: -14, rotateY: -26 }
            : { rotateX: -14, rotateY: -26, y: [0, -10, 0] }
      }
      transition={
        winding && loud
          ? {
              duration: CHASE_WIND_MS / 1000,
              x: { duration: CHASE_WIND_MS / 1000, times: CHASE_SHAKE_TIMES, ease: "linear" },
              rotateZ: { duration: CHASE_WIND_MS / 1000, times: CHASE_SHAKE_TIMES, ease: "linear" },
            }
          : winding
            ? { duration: 0.35 }
            : opening && !reducedMotion
          ? {
              duration: OPEN_MS / 1000,
              times: [0, 0.28, 1],
              ease: ["easeOut", "linear"],
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
