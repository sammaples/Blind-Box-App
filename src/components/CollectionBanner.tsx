import type { LineId } from "@/lib/lines";
import type { Palette, PatternKind } from "@/lib/types";
import { Figure } from "./BoxPrint";
import { CollectionArt } from "./CollectionArt";

/**
 * The picture filling a collection's bar on the front page.
 *
 * A cover photo when one has been uploaded (Inventory management → Change
 * cover). Until then, a scene: the collection's colours, a faint print of
 * its figures across the ground, and three of its figures posed on the
 * right, out of the way of the name on the left — photos of real pieces,
 * cut out, where there are some (public/collections/), drawn ones otherwise.
 */

type Pose = { palette: Pick<Palette, "base" | "accent">; pattern?: PatternKind };

interface Scene {
  ground: string;
  glow: string;
  ink: string;
  /** Left, middle (in front), right. */
  poses?: [Pose, Pose, Pose];
  photos?: [string, string, string];
  /** Silhouettes of two of the photos, for the faint print behind them, so
      the pattern is the same figures as the ones standing in front. */
  shapes?: [string, string];
  /** Where the photos stand and how tall, when the default doesn't suit
      their shapes. Whole class names, so Tailwind sees them. */
  fit?: { box: string; side: string; middle: string; row?: boolean };
}

const PHOTO_FIT = { box: "right-[16.5%] w-[32%]", side: "h-[64%]", middle: "h-[80%]" };

const SCENES: Record<LineId, Scene> = {
  bearbrick: {
    ground: "linear-gradient(115deg, #14070c 0%, #4f0d1e 42%, #b8213c 100%)",
    glow: "#ff6b81",
    ink: "#ffffff",
    photos: ["/collections/bearbrick-left.webp", "/collections/bearbrick-middle.webp", "/collections/bearbrick-right.webp"],
    shapes: ["/collections/bearbrick-shape-middle.png", "/collections/bearbrick-shape-left.png"],
  },
  popmart: {
    ground: "linear-gradient(115deg, #160a1d 0%, #5e2457 44%, #ee86b9 100%)",
    glow: "#ffc2df",
    ink: "#ffffff",
    photos: ["/collections/popmart-left.webp", "/collections/popmart-middle.webp", "/collections/popmart-right.webp"],
    shapes: ["/collections/popmart-shape-middle.png", "/collections/popmart-shape-left.png"],
    // Wider figures than the bears, so a little more room and a little less height.
    fit: { box: "right-[15%] w-[38%]", side: "h-[58%]", middle: "h-[78%]" },
  },
  tapcap: {
    ground: "linear-gradient(115deg, #050d02 0%, #1d4708 44%, #5cb514 100%)",
    glow: "#c8ff6b",
    ink: "#ffffff",
    photos: ["/collections/tapcap-left.webp", "/collections/tapcap-middle.webp", "/collections/tapcap-right.webp"],
    shapes: ["/collections/tapcap-shape-middle.png", "/collections/tapcap-shape-left.png"],
    // Boxy figures: spread wider so the two behind aren't hidden.
    fit: { box: "right-[17.5%] w-[40%]", side: "h-[60%]", middle: "h-[76%]" },
  },
  squishy: {
    ground: "linear-gradient(115deg, #061716 0%, #124d48 44%, #56c9b6 100%)",
    glow: "#b9fff1",
    ink: "#ffffff",
    photos: ["/collections/squishy-left.webp", "/collections/squishy-middle.webp", "/collections/squishy-right.webp"],
    shapes: ["/collections/squishy-shape-middle.png", "/collections/squishy-shape-left.png"],
    // Wide, low pieces — the bao with its lid most of all — so they stand
    // side by side instead of overlapping, the bao far left, low enough to
    // pass under the name.
    fit: { box: "right-[17%] gap-[2.5%]", side: "h-[34%]", middle: "h-[46%]", row: true },
  },
};

function Pose({ line, pose, uid, className }: { line: LineId; pose: Pose; uid: string; className: string }) {
  return <CollectionArt line={line} palette={pose.palette} uid={uid} className={className} />;
}

export function CollectionBanner({ line, coverUrl }: { line: LineId; coverUrl: string | null }) {
  if (coverUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={coverUrl} alt="" className="absolute inset-0 size-full object-cover" />
    );
  }

  const scene = SCENES[line];
  const pid = `cb-${line}`;
  const fig = "absolute bottom-0 drop-shadow-[0_12px_18px_rgba(0,0,0,0.55)] transition-transform duration-500";
  const photo = "absolute bottom-0 drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)] transition-transform duration-500";
  const photoInRow = "shrink-0 drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)] transition-transform duration-500";

  return (
    <span aria-hidden className="absolute inset-0 overflow-hidden" style={{ background: scene.ground }}>
      {/* A faint print of the collection's figures, fading out towards the
          name so it never sits behind the type. */}
      <svg
        className="absolute inset-0 size-full"
        style={{
          opacity: 0.13,
          maskImage: "linear-gradient(90deg, transparent 0%, transparent 18%, black 70%)",
          WebkitMaskImage: "linear-gradient(90deg, transparent 0%, transparent 18%, black 70%)",
        }}
      >
        <defs>
          <pattern id={pid} width="54" height="64" patternUnits="userSpaceOnUse" patternTransform="rotate(-18)">
            {scene.shapes ? (
              <>
                <image href={scene.shapes[0]} x="6" y="5" width="26" height="46" preserveAspectRatio="xMidYMid meet" />
                <image
                  href={scene.shapes[1]}
                  x="33"
                  y="31"
                  width="18"
                  height="30"
                  preserveAspectRatio="xMidYMid meet"
                  transform="rotate(24 42 46)"
                />
              </>
            ) : (
              <>
                <g fill={scene.ink} transform="translate(8 6) scale(0.16)">
                  <Figure line={line} />
                </g>
                <g fill={scene.ink} transform="translate(35 38) scale(0.11) rotate(24 100 160)">
                  <Figure line={line} />
                </g>
              </>
            )}
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${pid})`} />
      </svg>

      {/* The light the figures stand in. */}
      <span
        className="absolute -right-[10%] top-1/2 aspect-square w-[70%] -translate-y-1/2 rounded-full opacity-45 blur-2xl"
        style={{ background: `radial-gradient(circle, ${scene.glow} 0%, transparent 68%)` }}
      />

      {/* Three of its figures: one in front, two behind. */}
      {scene.photos ? (
        // Photos are taller and narrower than the drawings, so they are sized
        // by the bar's height rather than by width. All three at full
        // brightness with a tight shadow: they are photos, and dimming the two
        // behind made them read as out of focus.
        scene.fit?.row ? (
          <span className={`absolute inset-y-0 flex w-full items-end justify-end ${scene.fit.box}`}>
            {scene.photos.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={src}
                src={src}
                alt=""
                className={`${photoInRow} w-auto ${i === 1 ? `${scene.fit!.middle} translate-y-[3%]` : scene.fit!.side} group-hover:-translate-y-1`}
              />
            ))}
          </span>
        ) : (
        <span className={`absolute inset-y-0 ${(scene.fit ?? PHOTO_FIT).box}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={scene.photos[0]} alt="" className={`${photo} left-0 ${(scene.fit ?? PHOTO_FIT).side} w-auto origin-bottom -rotate-[7deg] group-hover:-translate-y-1`} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={scene.photos[2]} alt="" className={`${photo} right-0 ${(scene.fit ?? PHOTO_FIT).side} w-auto origin-bottom rotate-[8deg] group-hover:-translate-y-1`} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={scene.photos[1]} alt="" className={`${photo} left-1/2 ${(scene.fit ?? PHOTO_FIT).middle} w-auto -translate-x-1/2 translate-y-[3%] group-hover:-translate-y-[1%]`} />
        </span>
        )
      ) : scene.poses ? (
        <span className="absolute inset-y-0 right-[13%] w-[40%]">
          <Pose line={line} pose={scene.poses[0]} uid={`${pid}-l`} className={`${fig} left-[2%] h-auto w-[34%] -rotate-[8deg] brightness-[0.82] group-hover:-translate-y-1`} />
          <Pose line={line} pose={scene.poses[2]} uid={`${pid}-r`} className={`${fig} right-[0%] h-auto w-[32%] rotate-[9deg] brightness-[0.82] group-hover:-translate-y-1`} />
          <Pose line={line} pose={scene.poses[1]} uid={`${pid}-m`} className={`${fig} left-1/2 h-auto w-[42%] -translate-x-1/2 translate-y-[6%] group-hover:-translate-y-[1%]`} />
        </span>
      ) : null}
    </span>
  );
}
