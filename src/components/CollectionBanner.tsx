import type { LineId } from "@/lib/lines";
import type { Palette, PatternKind } from "@/lib/types";
import { BearbrickArt } from "./BearbrickArt";
import { Figure } from "./BoxPrint";
import { CollectionArt } from "./CollectionArt";

/**
 * The picture filling a collection's bar on the front page.
 *
 * A cover photo when one has been uploaded (Inventory management → Change
 * cover). Until then, a drawn scene: the collection's colours, a faint print
 * of its figures across the ground, and three of its figures posed on the
 * right, out of the way of the name on the left.
 */

const DETAIL = "hsl(210 20% 96%)";
const WASH = "hsl(220 24% 11%)";

type Pose = { palette: Pick<Palette, "base" | "accent">; pattern?: PatternKind };

const SCENES: Record<LineId, { ground: string; glow: string; ink: string; poses: [Pose, Pose, Pose] }> = {
  bearbrick: {
    ground: "linear-gradient(115deg, #14070c 0%, #4f0d1e 42%, #b8213c 100%)",
    glow: "#ff6b81",
    ink: "#ffffff",
    poses: [
      { palette: { base: "#5eb3ff", accent: "#2f6fd6" }, pattern: "jelly" },
      { palette: { base: "#f5c542", accent: "#b8860b" }, pattern: "chrome" },
      { palette: { base: "#f8fafc", accent: "#e0465b" }, pattern: "split" },
    ],
  },
  popmart: {
    ground: "linear-gradient(115deg, #160a1d 0%, #5e2457 44%, #ee86b9 100%)",
    glow: "#ffc2df",
    ink: "#ffffff",
    poses: [
      { palette: { base: "#cdb4ff", accent: "#8f6bd9" } },
      { palette: { base: "#f6b8d1", accent: "#d9739f" } },
      { palette: { base: "#ffc9a3", accent: "#e58a5a" } },
    ],
  },
  tapcap: {
    ground: "linear-gradient(115deg, #140b03 0%, #5a3208 44%, #f0a12a 100%)",
    glow: "#ffe2a6",
    ink: "#ffffff",
    poses: [
      { palette: { base: "#8fd3ff", accent: "#3b8fd0" } },
      { palette: { base: "#ffc65c", accent: "#d9820f" } },
      { palette: { base: "#ff9db0", accent: "#e0566f" } },
    ],
  },
  squishy: {
    ground: "linear-gradient(115deg, #061716 0%, #124d48 44%, #56c9b6 100%)",
    glow: "#b9fff1",
    ink: "#ffffff",
    poses: [
      { palette: { base: "#d8c8ff", accent: "#9b84e0" } },
      { palette: { base: "#9fe3d6", accent: "#4fb8a6" } },
      { palette: { base: "#ffd1b0", accent: "#f09a6a" } },
    ],
  },
};

function Pose({ line, pose, uid, className }: { line: LineId; pose: Pose; uid: string; className: string }) {
  if (line === "bearbrick") {
    return (
      <BearbrickArt
        uid={uid}
        palette={{ ...pose.palette, detail: DETAIL, wash: WASH }}
        pattern={pose.pattern ?? "solid"}
        className={className}
      />
    );
  }
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
  const [left, middle, right] = scene.poses;
  const fig = "absolute bottom-0 h-auto drop-shadow-[0_12px_18px_rgba(0,0,0,0.55)] transition-transform duration-500";

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
            <g fill={scene.ink} transform="translate(8 6) scale(0.16)">
              <Figure line={line} />
            </g>
            <g fill={scene.ink} transform="translate(35 38) scale(0.11) rotate(24 100 160)">
              <Figure line={line} />
            </g>
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
      <span className="absolute inset-y-0 right-[13%] w-[40%]">
        <Pose line={line} pose={left} uid={`${pid}-l`} className={`${fig} left-[2%] w-[34%] -rotate-[8deg] brightness-[0.82] group-hover:-translate-y-1`} />
        <Pose line={line} pose={right} uid={`${pid}-r`} className={`${fig} right-[0%] w-[32%] rotate-[9deg] brightness-[0.82] group-hover:-translate-y-1`} />
        <Pose line={line} pose={middle} uid={`${pid}-m`} className={`${fig} left-1/2 w-[42%] -translate-x-1/2 translate-y-[6%] group-hover:-translate-y-[1%]`} />
      </span>
    </span>
  );
}
