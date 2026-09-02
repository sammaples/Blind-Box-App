import "server-only";
import { randomUUID } from "node:crypto";
import { IMAGE_TYPES } from "./imageUrls";

/**
 * Uploaded product photos: the server half.
 *
 * Photos are stored as bytes the shop owns, not as links to somewhere else. A
 * catalogue whose images live on an image host is a catalogue that goes blank
 * the day that host changes its rules, and a product listing without a photo
 * is not a product listing.
 *
 * Serving bytes a stranger uploaded, from your own origin, is the part worth
 * being careful about. Two rules do most of the work:
 *
 *   1. The type comes from the file's own leading bytes, never from the
 *      `Content-Type` the browser sent — that field is set by the client, and
 *      a file announced as a PNG is not necessarily a PNG.
 *   2. SVG is refused. It is XML, it can carry script, and a browser will run
 *      that script on this origin. There is no safe way to serve an arbitrary
 *      SVG inline from a domain that also holds a session cookie.
 *
 * The naming rules live in ./imageUrls, which the browser needs too.
 */

export * from "./imageUrls";

/** The largest file the uploader accepts, before any resizing. */
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export interface ImageKind {
  contentType: string;
  ext: string;
}

interface Signature extends ImageKind {
  /** Leading bytes every file of this type starts with. */
  magic: readonly number[];
  /** WebP and friends carry a second marker further in. */
  at12?: readonly number[];
}

const ascii = (text: string) => [...text].map((c) => c.charCodeAt(0));

const SIGNATURES: readonly Signature[] = [
  { contentType: IMAGE_TYPES.jpg, ext: "jpg", magic: [0xff, 0xd8, 0xff] },
  {
    contentType: IMAGE_TYPES.png,
    ext: "png",
    magic: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  },
  { contentType: IMAGE_TYPES.gif, ext: "gif", magic: ascii("GIF8") },
  // RIFF....WEBP — the four bytes between are the file length, so they are
  // skipped and the format marker is checked at offset 8.
  { contentType: IMAGE_TYPES.webp, ext: "webp", magic: ascii("RIFF"), at12: ascii("WEBP") },
];

export const ACCEPTED_TYPES = SIGNATURES.map((s) => s.contentType);
/** For the file picker's `accept`, so the dialog filters before the upload. */
export const ACCEPT_ATTRIBUTE = ACCEPTED_TYPES.join(",");

function startsWith(bytes: Uint8Array, magic: readonly number[], offset = 0): boolean {
  if (bytes.length < offset + magic.length) return false;
  return magic.every((byte, i) => bytes[offset + i] === byte);
}

/**
 * Identifies an image by its content. Returns null for anything not on the
 * list, which includes an HTML file renamed to .png — the case that turns an
 * image host into a way to run script on your own domain.
 */
export function sniffImage(bytes: Uint8Array): ImageKind | null {
  for (const sig of SIGNATURES) {
    if (!startsWith(bytes, sig.magic)) continue;
    if (sig.at12 && !startsWith(bytes, sig.at12, 8)) continue;
    return { contentType: sig.contentType, ext: sig.ext };
  }
  return null;
}

/**
 * An image id carries its own extension, so a lookup never has to guess and
 * the browser gets a sensible filename if someone saves the picture.
 */
export function newImageId(ext: string): string {
  return `${randomUUID()}.${ext}`;
}
