"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { Piece } from "@/lib/types";
import { BearbrickArt } from "./BearbrickArt";

/**
 * How a piece is shown.
 *
 * A piece uploaded with a photograph shows the photograph; one without falls
 * back to generated vector art. A photo that fails to load falls back too —
 * catalogues are typed by hand and URLs rot, and a broken image icon in the
 * middle of a reveal is worse than a placeholder that looks deliberate.
 */
export function PieceImage({
  piece,
  className,
  style,
  simple,
}: {
  piece: Pick<Piece, "id" | "name" | "palette" | "pattern" | "imageUrl">;
  className?: string;
  style?: CSSProperties;
  simple?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  // A new piece deserves a fresh attempt, even if the last one failed.
  useEffect(() => setFailed(false), [piece.imageUrl]);

  if (piece.imageUrl && !failed) {
    return (
      // A plain <img>: these are arbitrary URLs the shop's owner supplied, and
      // the image optimiser would need every host allow-listed in advance.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={piece.imageUrl}
        alt={piece.name}
        loading="lazy"
        onError={() => setFailed(true)}
        className={className}
        style={{ objectFit: "contain", ...style }}
      />
    );
  }

  return (
    <BearbrickArt
      uid={piece.id}
      palette={piece.palette}
      pattern={piece.pattern}
      className={className}
      style={style}
      simple={simple}
      title={piece.name}
    />
  );
}
