import type { CSSProperties } from "react";

/**
 * The shape of a blind box.
 *
 * Boxes have a square cross-section and stand 11 units tall for every 7 wide.
 * Keeping the proportion here means the box on a product card and the one you
 * open are the same object at different sizes.
 *
 * 11/7 does not divide evenly, so callers pass a width that is a multiple of
 * seven and get whole pixels back.
 */
export const BOX_HEIGHT_RATIO = 11 / 7;

export type BoxFace = "front" | "back" | "left" | "right" | "top" | "bottom";

export interface BoxGeometry {
  width: number;
  depth: number;
  height: number;
  /** Inline styles positioning and sizing one face of the box. */
  face(name: BoxFace): CSSProperties;
}

/**
 * Face styles for a box of the given width.
 *
 * A cube can get away with six identical squares; this cannot. The four sides
 * are width × height and push out by half the width, while the top and bottom
 * are width × depth and push out by half the *height* — and have to be centred
 * first, because a face rotates about its own middle, not the box's.
 */
export function boxGeometry(width: number): BoxGeometry {
  const depth = width;
  const height = width * BOX_HEIGHT_RATIO;
  const halfW = width / 2;
  const halfH = height / 2;

  return {
    width,
    depth,
    height,
    face(name) {
      const base: CSSProperties = {
        position: "absolute",
        left: 0,
        backfaceVisibility: "hidden",
      };

      switch (name) {
        case "front":
          return { ...base, top: 0, width, height, transform: `translateZ(${halfW}px)` };
        case "back":
          return {
            ...base,
            top: 0,
            width,
            height,
            transform: `rotateY(180deg) translateZ(${halfW}px)`,
          };
        case "left":
          return {
            ...base,
            top: 0,
            width: depth,
            height,
            transform: `rotateY(-90deg) translateZ(${halfW}px)`,
          };
        case "right":
          return {
            ...base,
            top: 0,
            width: depth,
            height,
            transform: `rotateY(90deg) translateZ(${halfW}px)`,
          };
        case "top":
          return {
            ...base,
            top: "50%",
            marginTop: -depth / 2,
            width,
            height: depth,
            transform: `rotateX(90deg) translateZ(${halfH}px)`,
          };
        case "bottom":
          return {
            ...base,
            top: "50%",
            marginTop: -depth / 2,
            width,
            height: depth,
            transform: `rotateX(-90deg) translateZ(${halfH}px)`,
          };
      }
    },
  };
}
