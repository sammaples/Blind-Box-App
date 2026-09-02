import "server-only";
import sharp from "sharp";
import type { Metadata, Sharp } from "sharp";
import { IMAGE_TYPES } from "./imageUrls";

/**
 * What happens to a photo between the file picker and the database.
 *
 * A phone camera produces a 4000-pixel-wide, six-megabyte JPEG. The shop shows
 * that image at about 200 pixels on a product card. Serving the original to
 * every visitor is the difference between a page that loads and one that
 * doesn't, so every upload is resized once, on the way in, and the original is
 * not kept — there is no editing workflow here that would need it back.
 *
 * "Resized" has to mean "still looks right", which is four separate promises:
 *
 *   - Never enlarge. A 300px photo stays 300px; upscaling invents detail and
 *     makes a small picture look worse, not bigger.
 *   - Resample properly. Lanczos 3, sharp's default, rather than the nearest
 *     -neighbour that makes downscaled photos look gritty.
 *   - Re-encode generously. WebP at quality 90 is visually indistinguishable
 *     from the source at a fraction of the bytes; this is not the place to
 *     save the last kilobyte.
 *   - Never hand back something worse than what arrived. If a file needed no
 *     resizing and our encode came out larger, the original is kept.
 *
 * Two renditions come out: a display image, and a thumbnail for the catalogue
 * list, which draws up to 120 photos at 48 pixels each and has no business
 * downloading full-size ones to do it.
 */

/** Longest side of the image the shop displays. Generous for a 3x screen. */
const DISPLAY_MAX = 1400;
/** Longest side of the list thumbnail. */
const THUMB_MAX = 320;

const DISPLAY_QUALITY = 90;
const THUMB_QUALITY = 80;

/**
 * A ceiling on decoded pixels, not on file size. A carefully built PNG can be
 * a few kilobytes on disk and 40,000 by 40,000 once decoded; without a limit,
 * one upload takes the server's memory with it.
 */
const MAX_PIXELS = 60_000_000;

export interface Rendition {
  ext: string;
  contentType: string;
  bytes: Buffer;
  width: number;
  height: number;
}

export interface ProcessedImage {
  display: Rendition;
  /**
   * Null when a separate thumbnail would be pointless — the photo was already
   * small enough that both renditions came out the same size. The serving route
   * falls back to the display image for a thumbnail that isn't there, so
   * storing a second identical copy would buy nothing.
   */
  thumb: Rendition | null;
  /** Dimensions of the file as uploaded, for reporting what changed. */
  source: { width: number; height: number; bytes: number };
}

export class UnreadableImageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnreadableImageError";
  }
}

/**
 * Resizes an upload into the renditions the shop serves.
 *
 * Throws UnreadableImageError for a file that passed the signature check but
 * turns out to be truncated or corrupt — a valid PNG header on a half-finished
 * download is a real thing, and it should fail as "that photo is damaged",
 * not as a 500.
 */
export async function processImage(input: Uint8Array): Promise<ProcessedImage> {
  const source = Buffer.from(input);

  // `animated` keeps every frame of an animated GIF or WebP. Resizing only the
  // first would silently turn an animation into a still.
  const pipeline = () =>
    sharp(source, { animated: true, limitInputPixels: MAX_PIXELS });

  let meta: Metadata;
  try {
    meta = await pipeline().metadata();
  } catch (err) {
    throw new UnreadableImageError(readableMessage(err));
  }

  // With `animated`, height is the whole filmstrip; pageHeight is one frame.
  const width = meta.width ?? 0;
  const height = meta.pageHeight ?? meta.height ?? 0;
  if (width === 0 || height === 0) {
    throw new UnreadableImageError("That photo has no readable dimensions.");
  }

  const encoded = await render(pipeline, DISPLAY_MAX, DISPLAY_QUALITY);
  const rendered = await render(pipeline, THUMB_MAX, THUMB_QUALITY);

  // Re-encoding a small, already well-compressed file can make it bigger. When
  // nothing needed resizing and our version is no smaller, the upload was
  // already the better artefact — keep it.
  const untouched = width <= DISPLAY_MAX && height <= DISPLAY_MAX;
  const original =
    untouched && encoded.bytes.byteLength >= source.byteLength ? kindOf(meta.format) : null;
  const display: Rendition = original
    ? { ...original, bytes: source, width, height }
    : encoded;

  // A photo that was already thumbnail-sized yields two copies of one picture.
  // Keep the one; the serving route falls back for the id that is missing.
  const worthKeeping = rendered.bytes.byteLength < display.bytes.byteLength * 0.9;

  return {
    display,
    thumb: worthKeeping ? rendered : null,
    source: { width, height, bytes: source.byteLength },
  };
}

async function render(
  pipeline: () => Sharp,
  max: number,
  quality: number,
): Promise<Rendition> {
  try {
    const { data, info } = await pipeline()
      // Applies the EXIF orientation flag and then drops it. Without this every
      // portrait photo taken on a phone arrives on its side, because the pixels
      // are landscape and only the tag says otherwise.
      .rotate()
      .resize({
        width: max,
        height: max,
        fit: "inside",
        // Never enlarge: a photo smaller than the target is left alone.
        withoutEnlargement: true,
      })
      // Metadata is not carried over, which drops the GPS coordinates a phone
      // writes into a photo. A product picture taken at home should not publish
      // the address it was taken at.
      .webp({ quality, effort: 4 })
      .toBuffer({ resolveWithObject: true });

    return {
      ext: "webp",
      contentType: IMAGE_TYPES.webp,
      bytes: data,
      width: info.width,
      height: info.pageHeight ?? info.height,
    };
  } catch (err) {
    throw new UnreadableImageError(readableMessage(err));
  }
}

function kindOf(format: string | undefined): { ext: string; contentType: string } | null {
  const ext = format === "jpeg" ? "jpg" : format;
  if (!ext || !(ext in IMAGE_TYPES)) return null;
  return { ext, contentType: IMAGE_TYPES[ext] };
}

function readableMessage(err: unknown): string {
  const detail = err instanceof Error ? err.message : "";
  if (detail.includes("pixel limit") || detail.includes("limitInputPixels")) {
    return "That photo is too large to process. Scale it down and try again.";
  }
  return "That photo could not be read — it may be damaged or incomplete.";
}
