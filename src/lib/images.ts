import "server-only";
import { randomUUID } from "node:crypto";

/**
 * Uploaded product photos.
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
 */

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
  { contentType: "image/jpeg", ext: "jpg", magic: [0xff, 0xd8, 0xff] },
  {
    contentType: "image/png",
    ext: "png",
    magic: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  },
  { contentType: "image/gif", ext: "gif", magic: ascii("GIF8") },
  // RIFF....WEBP — the four bytes between are the file length, so they are
  // skipped and the format marker is checked at offset 12.
  { contentType: "image/webp", ext: "webp", magic: ascii("RIFF"), at12: ascii("WEBP") },
];

/** Extensions this app will serve, and what it serves them as. */
const BY_EXT = new Map(SIGNATURES.map((s) => [s.ext, s.contentType]));

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
export function newImageId(kind: ImageKind): string {
  return `${randomUUID()}.${kind.ext}`;
}

/**
 * Whether a string is an id this app issued.
 *
 * Checked before every read: the file-backed store turns an id into a path, so
 * an unchecked one is a request for `../../db.json`.
 */
export function isImageId(value: string): boolean {
  const shape = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.([a-z0-9]{2,4})$/;
  const match = shape.exec(value);
  return match !== null && BY_EXT.has(match[1]);
}

/** What to serve an id as, from the extension baked into it. */
export function contentTypeFor(id: string): string | null {
  return BY_EXT.get(id.slice(id.lastIndexOf(".") + 1)) ?? null;
}

/** Where a stored image is served from. Site-relative, so it survives a move. */
export function imageUrlFor(id: string): string {
  return `/api/images/${id}`;
}

/** The id inside one of this app's own image URLs, if that is what it is. */
export function imageIdFrom(url: string | null): string | null {
  if (!url) return null;
  const match = /^\/api\/images\/([^/?#]+)$/.exec(url);
  if (!match) return null;
  return isImageId(match[1]) ? match[1] : null;
}
