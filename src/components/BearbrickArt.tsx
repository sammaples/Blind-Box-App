import type { CSSProperties, ReactElement } from "react";
import type { Palette, PatternKind } from "@/lib/types";

/**
 * The figure itself, drawn as original vector art rather than photography.
 * Every colourway in the catalogue renders from its palette + pattern, so a
 * 780-piece set needs no image assets at all.
 */

interface Props {
  palette: Palette;
  pattern: PatternKind;
  /** Used to namespace the SVG defs so two figures never share gradients. */
  uid: string;
  className?: string;
  style?: CSSProperties;
  /** Drops the face and gloss for tiny thumbnails. */
  simple?: boolean;
  title?: string;
}

/* The silhouette, shared by the fill pass and the clip path. */
function bodyShapes(keyPrefix: string): ReactElement[] {
  return [
    // ears
    <circle key={`${keyPrefix}-ear-l`} cx={70} cy={46} r={17} />,
    <circle key={`${keyPrefix}-ear-r`} cx={130} cy={46} r={17} />,
    // head: domed top, flat chin
    <path key={`${keyPrefix}-head`} d="M56 118V70a44 44 0 0 1 88 0v48z" />,
    // neck
    <rect key={`${keyPrefix}-neck`} x={86} y={112} width={28} height={16} rx={4} />,
    // shoulders + torso
    <circle key={`${keyPrefix}-sh-l`} cx={48} cy={142} r={13} />,
    <circle key={`${keyPrefix}-sh-r`} cx={152} cy={142} r={13} />,
    <rect key={`${keyPrefix}-torso`} x={62} y={126} width={76} height={80} rx={9} />,
    // arms
    <rect key={`${keyPrefix}-arm-l`} x={35} y={134} width={26} height={74} rx={13} />,
    <rect key={`${keyPrefix}-arm-r`} x={139} y={134} width={26} height={74} rx={13} />,
    // hips
    <rect key={`${keyPrefix}-hips`} x={62} y={200} width={76} height={26} rx={7} />,
    // legs
    <rect key={`${keyPrefix}-leg-l`} x={65} y={220} width={33} height={72} rx={10} />,
    <rect key={`${keyPrefix}-leg-r`} x={102} y={220} width={33} height={72} rx={10} />,
  ];
}

export function BearbrickArt({
  palette,
  pattern,
  uid,
  className,
  style,
  simple = false,
  title,
}: Props) {
  const id = `bb-${uid}`;
  const fillId = `${id}-fill`;
  const clipId = `${id}-clip`;
  const glossId = `${id}-gloss`;
  const shadeId = `${id}-shade`;

  const fill =
    pattern === "solid" ? palette.base : `url(#${fillId})`;

  return (
    <svg
      viewBox="0 0 200 310"
      className={className}
      style={style}
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        {/* Pattern / gradient that fills the body */}
        {pattern === "gradient" && (
          <linearGradient id={fillId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={palette.base} />
            <stop offset="100%" stopColor={palette.accent} />
          </linearGradient>
        )}
        {pattern === "chrome" && (
          <linearGradient id={fillId} x1="0" y1="0" x2="1" y2="0.3">
            <stop offset="0%" stopColor={palette.accent} />
            <stop offset="22%" stopColor={palette.base} />
            <stop offset="42%" stopColor="#ffffff" />
            <stop offset="58%" stopColor={palette.base} />
            <stop offset="78%" stopColor={palette.accent} />
            <stop offset="100%" stopColor={palette.base} />
          </linearGradient>
        )}
        {pattern === "jelly" && (
          <radialGradient id={fillId} cx="0.36" cy="0.28" r="0.9">
            <stop offset="0%" stopColor={palette.accent} />
            <stop offset="55%" stopColor={palette.base} />
            <stop offset="100%" stopColor={palette.base} stopOpacity="0.72" />
          </radialGradient>
        )}
        {pattern === "split" && (
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={palette.base} />
            <stop offset="49.9%" stopColor={palette.base} />
            <stop offset="50%" stopColor={palette.accent} />
            <stop offset="100%" stopColor={palette.accent} />
          </linearGradient>
        )}
        {pattern === "stripes" && (
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={palette.base} />
            <stop offset="33.3%" stopColor={palette.base} />
            <stop offset="33.4%" stopColor={palette.detail} />
            <stop offset="66.6%" stopColor={palette.detail} />
            <stop offset="66.7%" stopColor={palette.accent} />
            <stop offset="100%" stopColor={palette.accent} />
          </linearGradient>
        )}
        {pattern === "drip" && (
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={palette.accent} />
            <stop offset="26%" stopColor={palette.base} />
            <stop offset="100%" stopColor={palette.base} />
          </linearGradient>
        )}
        {pattern === "checker" && (
          <pattern
            id={fillId}
            width={26}
            height={26}
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(12)"
          >
            <rect width={26} height={26} fill={palette.base} />
            <rect width={13} height={13} fill={palette.accent} />
            <rect x={13} y={13} width={13} height={13} fill={palette.accent} />
          </pattern>
        )}
        {pattern === "camo" && (
          <pattern id={fillId} width={64} height={64} patternUnits="userSpaceOnUse">
            <rect width={64} height={64} fill={palette.base} />
            <path
              d="M6 10c10-8 22-2 24 6s-6 16-16 14S-2 16 6 10Zm38 26c9-4 18 4 16 13s-14 12-19 5 -4-15 3-18Zm-30 18c7-2 12 5 9 11s-13 6-16 0 0-9 7-11Z"
              fill={palette.accent}
              opacity="0.92"
            />
            <path
              d="M40 4c6-3 12 2 10 8s-10 7-13 2 -2-8 3-10Zm-8 44c4 2 4 9-1 11s-10-3-8-8 5-5 9-3Z"
              fill={palette.detail}
              opacity="0.35"
            />
          </pattern>
        )}
        {pattern === "stars" && (
          <pattern
            id={fillId}
            width={40}
            height={40}
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-8)"
          >
            <rect width={40} height={40} fill={palette.base} />
            <path
              d="m12 6 2.6 5.6 6 .8-4.4 4.2 1.1 6-5.3-2.9L6.7 22.6l1.1-6L3.4 12.4l6-.8Z"
              fill={palette.accent}
            />
            <circle cx={30} cy={30} r={2.4} fill={palette.detail} opacity="0.8" />
            <circle cx={34} cy={11} r={1.4} fill={palette.detail} opacity="0.55" />
          </pattern>
        )}

        <clipPath id={clipId}>{bodyShapes(`${id}-c`)}</clipPath>

        {/* Light coming from the upper left, wrapping to a dark right edge. */}
        <linearGradient id={glossId} x1="0" y1="0" x2="1" y2="0.8">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.34" />
          <stop offset="38%" stopColor="#fff" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={shadeId} x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor="#000" stopOpacity="0.42" />
          <stop offset="34%" stopColor="#000" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* contact shadow */}
      <ellipse cx={100} cy={296} rx={62} ry={9} fill="#000" opacity="0.45" />

      <g fill={fill}>{bodyShapes(`${id}-b`)}</g>

      <g clipPath={`url(#${clipId})`}>
        {pattern === "drip" && (
          <path
            d="M56 26h88v34c-6 14-10 4-14 16s-9 6-13 20-11 5-14-6-8 4-12-8-9-2-13-14-11-6-14-18-6-8-8-24Z"
            fill={palette.accent}
            opacity="0.95"
          />
        )}
        {!simple && <rect width={200} height={310} fill={`url(#${shadeId})`} />}
        {!simple && <rect width={200} height={310} fill={`url(#${glossId})`} />}
        {/* moulded seam lines */}
        <g stroke="#000" strokeOpacity="0.14" strokeWidth="1.5" fill="none">
          <path d="M56 118h88" />
          <path d="M62 200h76" />
          <path d="M100 220v72" />
        </g>
      </g>

      {!simple && (
        <g>
          {/* eyes */}
          <ellipse cx={82} cy={84} rx={5.4} ry={6.6} fill={palette.detail} />
          <ellipse cx={118} cy={84} rx={5.4} ry={6.6} fill={palette.detail} />
          <circle cx={80.2} cy={81.4} r={1.9} fill="#fff" opacity="0.9" />
          <circle cx={116.2} cy={81.4} r={1.9} fill="#fff" opacity="0.9" />
          {/* snout */}
          <ellipse cx={100} cy={99} rx={11} ry={7.5} fill={palette.detail} opacity="0.16" />
          <ellipse cx={100} cy={95.5} rx={3.4} ry={2.6} fill={palette.detail} />
          {/* chest mark */}
          <circle
            cx={100}
            cy={160}
            r={13}
            fill="none"
            stroke={palette.detail}
            strokeOpacity="0.28"
            strokeWidth="2"
          />
          <circle cx={100} cy={160} r={4} fill={palette.detail} fillOpacity="0.28" />
          {/* highlight on the crown */}
          <ellipse
            cx={82}
            cy={54}
            rx={16}
            ry={10}
            fill="#fff"
            opacity="0.16"
            transform="rotate(-24 82 54)"
          />
        </g>
      )}
    </svg>
  );
}
