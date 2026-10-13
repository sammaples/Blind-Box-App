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
 * Squishy, and a crimped cap with a face for TapCap. They stand in for a piece with no photograph yet, and on the front
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
    const base = palette?.base ?? "#ffc65c";
    const accent = palette?.accent ?? "#d9820f";
    return (
      <svg {...svgProps}>
        <defs>
          <radialGradient id={`${id}-top`} cx="36%" cy="30%" r="80%">
            <stop offset="0" stopColor="#fff" stopOpacity="0.75" />
            <stop offset="0.3" stopColor={base} />
            <stop offset="1" stopColor={accent} />
          </radialGradient>
        </defs>
        <ellipse cx="100" cy="292" rx="70" ry="10" fill="#000" opacity="0.35" />
        {/* the crimped rim, then its side seen below it */}
        <path d="M100.0 90.0 L111.6 98.9 L125.3 93.8 L133.8 105.7 L148.4 104.9 L153.1 118.8 L167.2 122.4 L167.5 137.0 L180.1 144.6 L176.0 158.6 L185.8 169.6 L177.8 181.8 L183.8 195.1 L172.6 204.5 L174.5 219.0 L161.0 224.6 L158.5 239.0 L143.9 240.4 L137.3 253.5 L123.0 250.5 L112.8 261.0 L100.0 254.0 L87.2 261.0 L77.0 250.5 L62.7 253.5 L56.1 240.4 L41.5 239.0 L39.0 224.6 L25.5 219.0 L27.4 204.5 L16.2 195.1 L22.2 181.8 L14.2 169.6 L24.0 158.6 L19.9 144.6 L32.5 137.0 L32.8 122.4 L46.9 118.8 L51.6 104.9 L66.2 105.7 L74.7 93.8 L88.4 98.9Z" fill={accent} transform="translate(0 12)" />
        <path d="M100.0 90.0 L111.6 98.9 L125.3 93.8 L133.8 105.7 L148.4 104.9 L153.1 118.8 L167.2 122.4 L167.5 137.0 L180.1 144.6 L176.0 158.6 L185.8 169.6 L177.8 181.8 L183.8 195.1 L172.6 204.5 L174.5 219.0 L161.0 224.6 L158.5 239.0 L143.9 240.4 L137.3 253.5 L123.0 250.5 L112.8 261.0 L100.0 254.0 L87.2 261.0 L77.0 250.5 L62.7 253.5 L56.1 240.4 L41.5 239.0 L39.0 224.6 L25.5 219.0 L27.4 204.5 L16.2 195.1 L22.2 181.8 L14.2 169.6 L24.0 158.6 L19.9 144.6 L32.5 137.0 L32.8 122.4 L46.9 118.8 L51.6 104.9 L66.2 105.7 L74.7 93.8 L88.4 98.9Z" fill={`url(#${id}-top)`} />
        <circle cx="100" cy="176" r="62" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="3" />
        {/* face */}
        <ellipse cx="78" cy="174" rx="10" ry="13" fill="#2a1606" />
        <ellipse cx="122" cy="174" rx="10" ry="13" fill="#2a1606" />
        <circle cx="81" cy="169" r="3.6" fill="#fff" />
        <circle cx="125" cy="169" r="3.6" fill="#fff" />
        <ellipse cx="64" cy="194" rx="10" ry="6" fill="#ff7a59" opacity="0.5" />
        <ellipse cx="136" cy="194" rx="10" ry="6" fill="#ff7a59" opacity="0.5" />
        <path d="M90 196q10 9 20 0" stroke="#2a1606" strokeWidth="4" strokeLinecap="round" fill="none" />
        {/* gloss */}
        <ellipse cx="72" cy="128" rx="26" ry="11" fill="#fff" opacity="0.4" transform="rotate(-24 72 128)" />
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
