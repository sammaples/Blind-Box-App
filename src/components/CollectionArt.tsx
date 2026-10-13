import type { CSSProperties } from "react";
import type { LineId } from "@/lib/lines";
import type { Palette } from "@/lib/types";
import { BearbrickArt } from "./BearbrickArt";

/**
 * A drawing of a collection's kind of figure.
 *
 * Bearbrick has its own generated art, coloured per piece. The others are
 * drawn here, in the same 200 × 310 frame so they sit in every slot a bear
 * does: a big-headed vinyl figure for Pop Mart, a plump soft one for
 * Squishy, and a tall flocked block with a torn cap for TapCap. They stand in for a piece with no photograph yet, and on the front
 * page's collection cards until a real photo is uploaded.
 *
 * Generic on purpose — the shop sells the real thing; the drawing is only a
 * placeholder that looks deliberate.
 */
export function CollectionArt({
  line,
  palette,
  uid,
  className,
  style,
  title,
}: {
  line: LineId;
  /** Colours to draw in. Defaults to the collection's own. */
  palette?: Pick<Palette, "base" | "accent">;
  uid: string;
  className?: string;
  style?: CSSProperties;
  title?: string;
}) {
  const id = `ca-${uid}`.replace(/[^a-zA-Z0-9_-]/g, "");

  if (line === "bearbrick") {
    return (
      <BearbrickArt
        uid={uid}
        palette={{
          base: palette?.base ?? "#e0465b",
          accent: palette?.accent ?? "#a8233a",
          detail: "hsl(210 20% 96%)",
          wash: "hsl(220 24% 11%)",
        }}
        pattern="solid"
        className={className}
        style={style}
        title={title}
      />
    );
  }

  const svgProps = {
    viewBox: "0 0 200 310",
    className,
    style,
    role: title ? "img" : "presentation",
    "aria-label": title,
    "aria-hidden": title ? undefined : true,
  } as const;

  if (line === "popmart") {
    const base = palette?.base ?? "#f6b8d1";
    const accent = palette?.accent ?? "#d9739f";
    return (
      <svg {...svgProps}>
        <defs>
          <radialGradient id={`${id}-head`} cx="38%" cy="30%" r="75%">
            <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
            <stop offset="0.35" stopColor={base} />
            <stop offset="1" stopColor={accent} />
          </radialGradient>
          <linearGradient id={`${id}-body`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={base} />
            <stop offset="1" stopColor={accent} />
          </linearGradient>
        </defs>
        {/* floor shadow */}
        <ellipse cx="100" cy="296" rx="52" ry="8" fill="#000" opacity="0.35" />
        {/* feet and body */}
        <rect x="70" y="262" width="26" height="30" rx="12" fill={accent} />
        <rect x="104" y="262" width="26" height="30" rx="12" fill={accent} />
        <path d="M62 214c0-16 17-26 38-26s38 10 38 26v38c0 12-10 20-22 20H84c-12 0-22-8-22-20z" fill={`url(#${id}-body)`} />
        {/* arms */}
        <rect x="44" y="208" width="22" height="46" rx="11" fill={accent} transform="rotate(14 55 231)" />
        <rect x="134" y="208" width="22" height="46" rx="11" fill={accent} transform="rotate(-14 145 231)" />
        {/* ears */}
        <ellipse cx="58" cy="52" rx="20" ry="40" fill={`url(#${id}-head)`} transform="rotate(-14 58 52)" />
        <ellipse cx="142" cy="52" rx="20" ry="40" fill={`url(#${id}-head)`} transform="rotate(14 142 52)" />
        <ellipse cx="58" cy="58" rx="9" ry="24" fill="#fff" opacity="0.35" transform="rotate(-14 58 58)" />
        <ellipse cx="142" cy="58" rx="9" ry="24" fill="#fff" opacity="0.35" transform="rotate(14 142 58)" />
        {/* head */}
        <ellipse cx="100" cy="132" rx="82" ry="72" fill={`url(#${id}-head)`} />
        {/* face */}
        <ellipse cx="70" cy="138" rx="15" ry="19" fill="#1d1430" />
        <ellipse cx="130" cy="138" rx="15" ry="19" fill="#1d1430" />
        <circle cx="75" cy="131" r="5.5" fill="#fff" />
        <circle cx="135" cy="131" r="5.5" fill="#fff" />
        <circle cx="66" cy="146" r="2.4" fill="#fff" opacity="0.8" />
        <circle cx="126" cy="146" r="2.4" fill="#fff" opacity="0.8" />
        <ellipse cx="52" cy="166" rx="12" ry="7" fill="#ff7aa8" opacity="0.55" />
        <ellipse cx="148" cy="166" rx="12" ry="7" fill="#ff7aa8" opacity="0.55" />
        <path d="M90 168q10 9 20 0" stroke="#1d1430" strokeWidth="4" strokeLinecap="round" fill="none" />
        {/* gloss */}
        <ellipse cx="66" cy="92" rx="26" ry="12" fill="#fff" opacity="0.28" transform="rotate(-20 66 92)" />
      </svg>
    );
  }

  if (line === "tapcap") {
    // A tall flocked block: a cap with slit eyes and a little smile, torn
    // along its bottom edge, sitting over a dark gap, on a body with an
    // arched notch at its foot.
    const base = palette?.base ?? "#8fd44e";
    const accent = palette?.accent ?? "#4c9a1c";
    return (
      <svg {...svgProps}>
        <defs>
          <linearGradient id={`${id}-fur`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
            <stop offset="0.25" stopColor={base} />
            <stop offset="1" stopColor={accent} />
          </linearGradient>
          {/* the flocking: a fine scatter of light specks over the colour */}
          <pattern id={`${id}-flock`} width="7" height="7" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="0.9" fill="#fff" opacity="0.22" />
            <circle cx="5" cy="4.5" r="0.8" fill="#000" opacity="0.12" />
          </pattern>
        </defs>
        <ellipse cx="100" cy="294" rx="64" ry="9" fill="#000" opacity="0.35" />
        {/* the gap between cap and body, with the works showing */}
        <rect x="50" y="146" width="100" height="40" rx="4" fill="#2f3a3e" />
        <rect x="68" y="162" width="64" height="11" rx="3" fill="#c9b8a2" opacity="0.9" />
        <rect x="76" y="164" width="10" height="7" rx="1.5" fill="#6f625a" />
        <rect x="114" y="164" width="10" height="7" rx="1.5" fill="#6f625a" />
        {/* body */}
        <path d="M54 180H146Q156 180 156 190V286H44V190Q44 180 54 180Z" fill={`url(#${id}-fur)`} />
        <path d="M54 180H146Q156 180 156 190V286H44V190Q44 180 54 180Z" fill={`url(#${id}-flock)`} />
        <path d="M89 286V266A11 11 0 0 1 111 266V286Z" fill="#16220d" />
        {/* cap */}
        <path d="M56 22H144Q160 22 160 38V150L148 163 136 149 124 161 112 150 100 165 88 150 76 161 64 149 52 163 40 150V38Q40 22 56 22Z" fill={`url(#${id}-fur)`} />
        <path d="M56 22H144Q160 22 160 38V150L148 163 136 149 124 161 112 150 100 165 88 150 76 161 64 149 52 163 40 150V38Q40 22 56 22Z" fill={`url(#${id}-flock)`} />
        <path d="M44 132 56 140 68 129 80 141 92 130 104 142 116 130 128 141 140 129 152 139" stroke={accent} strokeWidth="3" strokeLinejoin="round" fill="none" opacity="0.7" />
        {/* face */}
        <rect x="68" y="50" width="9" height="34" rx="4.5" fill="#16220d" />
        <rect x="123" y="50" width="9" height="34" rx="4.5" fill="#16220d" />
        <path d="M91 72q9 -9 18 0" stroke="#16220d" strokeWidth="4" strokeLinecap="round" fill="none" />
        {/* soft light on the top edge */}
        <rect x="50" y="28" width="56" height="10" rx="5" fill="#fff" opacity="0.22" />
      </svg>
    );
  }

  // Squishy: a plump, soft cat-bun.
  const base = palette?.base ?? "#9fe3d6";
  const accent = palette?.accent ?? "#4fb8a6";
  return (
    <svg {...svgProps}>
      <defs>
        <radialGradient id={`${id}-bun`} cx="40%" cy="30%" r="78%">
          <stop offset="0" stopColor="#fff" stopOpacity="0.7" />
          <stop offset="0.3" stopColor={base} />
          <stop offset="1" stopColor={accent} />
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="292" rx="78" ry="11" fill="#000" opacity="0.35" />
      {/* ears */}
      <path d="M38 132 48 78 86 112z" fill={`url(#${id}-bun)`} />
      <path d="M162 132 152 78 114 112z" fill={`url(#${id}-bun)`} />
      <path d="M50 120 54 94 72 110z" fill="#ff9fc0" opacity="0.6" />
      <path d="M150 120 146 94 128 110z" fill="#ff9fc0" opacity="0.6" />
      {/* body: wider than tall, sagging a little at the bottom like it's soft */}
      <path d="M100 96c56 0 90 40 90 104 0 56-30 86-90 86S10 256 10 200c0-64 34-104 90-104z" fill={`url(#${id}-bun)`} />
      {/* little paws */}
      <ellipse cx="70" cy="270" rx="16" ry="10" fill={accent} opacity="0.7" />
      <ellipse cx="130" cy="270" rx="16" ry="10" fill={accent} opacity="0.7" />
      {/* face */}
      <path d="M64 188q8-10 16 0" stroke="#173b36" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M120 188q8-10 16 0" stroke="#173b36" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M90 208q5 6 10 0q5 6 10 0" stroke="#173b36" strokeWidth="4" strokeLinecap="round" fill="none" />
      <ellipse cx="54" cy="210" rx="13" ry="8" fill="#ff8fb4" opacity="0.5" />
      <ellipse cx="146" cy="210" rx="13" ry="8" fill="#ff8fb4" opacity="0.5" />
      {/* gloss */}
      <ellipse cx="70" cy="140" rx="30" ry="14" fill="#fff" opacity="0.35" transform="rotate(-18 70 140)" />
      <circle cx="152" cy="150" r="5" fill="#fff" opacity="0.4" />
    </svg>
  );
}
