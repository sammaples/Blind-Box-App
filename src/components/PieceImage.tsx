"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { thumbUrlFor } from "@/lib/imageUrls";
import type { Piece } from "@/lib/types";
import { BearbrickArt } from "./BearbrickArt";

/**
 * How a piece is shown.
 *
 * A piece uploaded with a photograph shows the photograph; one without falls
 * back to generated vector art. A photo that fails to load falls back too —
 * catalogues are typed by hand and URLs rot, and a broken image icon in the
 * middle of a reveal is worse than a placeholder that looks deliberate.
 *
 * `thumb` asks for the small rendition. Worth setting anywhere a photo is drawn
 * at list size: the catalogue shows up to 120 of them at once, and downloading
 * 120 display-size images to draw 48-pixel squares is the kind of waste nobody
 * notices until the shop has a real catalogue in it.
 */
export function PieceImage({
  piece,
  className,
  style,
  simple,
  thumb,
}: {
  piece: Pick<Piece, "id" | "name" | "palette" | "pattern" | "imageUrl">;
  className?: string;
  style?: CSSProperties;
  simple?: boolean;
  thumb?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  // A new piece deserves a fresh attempt, even if the last one failed.
  useEffect(() => setFailed(false), [piece.imageUrl]);

  // Externally hosted photos have no thumbnail to ask for, so this hands back
  // the same URL and the size request quietly does nothing.
  const src = thumb ? thumbUrlFor(piece.imageUrl) : piece.imageUrl;

  if (src && !failed) {
    return (
      // A plain <img>: these are arbitrary URLs the shop's owner supplied, and
      // the image optimiser would need every host allow-listed in advance.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
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
