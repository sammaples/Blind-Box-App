/**
 * Image ids and the URLs they live at.
 *
 * Deliberately free of `server-only` and of any Node import: the components
 * that render a photo run in the browser and have to work out which rendition
 * to ask for. The naming rules are the same on both sides, which is the point
 * of keeping them in one file rather than two.
 */

/** Formats this app stores, and what it serves each as. */
export const IMAGE_TYPES: Readonly<Record<string, string>> = {
  jpg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
};

/**
 * Every stored photo has two renditions, and their ids differ only by this
 * marker. Deriving the thumbnail's id from the display one means a piece still
 * carries a single `imageUrl` — no schema change, and nothing to keep in sync
 * when a photo is replaced.
 */
export const THUMB_MARKER = "@thumb";

const ID_SHAPE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(@thumb)?\.([a-z0-9]{2,4})$/;

/**
 * Whether a string is an id this app issued.
 *
 * Checked before every read: the file-backed store turns an id into a path, so
 * an unchecked one is a request for `../../db.json`.
 */
export function isImageId(value: string): boolean {
  const match = ID_SHAPE.exec(value);
  return match !== null && match[2] in IMAGE_TYPES;
}

/** What to serve an id as, from the extension baked into it. */
export function contentTypeFor(id: string): string | null {
  return IMAGE_TYPES[id.slice(id.lastIndexOf(".") + 1)] ?? null;
}

/** The thumbnail that belongs to a display image. */
export function thumbIdFor(id: string): string {
  if (id.includes(THUMB_MARKER)) return id;
  const dot = id.lastIndexOf(".");
  return `${id.slice(0, dot)}${THUMB_MARKER}${id.slice(dot)}`;
}

/**
 * The display image a thumbnail id belongs to, or the id unchanged when it is
 * already one. Lets a missing thumbnail fall back to the full photo instead of
 * a broken image — photos uploaded before thumbnails existed have no second
 * rendition, and those listings should still show something.
 */
export function baseIdFor(id: string): string {
  return id.replace(THUMB_MARKER, "");
}

/** Where a stored image is served from. Site-relative, so it survives a move. */
export function imageUrlFor(id: string): string {
  return `/api/images/${id}`;
}

/** The id inside one of this app's own image URLs, if that is what it is. */
export function imageIdFrom(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = /^\/api\/images\/([^/?#]+)$/.exec(url);
  if (!match) return null;
  return isImageId(match[1]) ? match[1] : null;
}

/**
 * The small rendition of one of this app's own photos.
 *
 * Anything else — an externally hosted image, or no image at all — comes back
 * untouched, so a caller can use this unconditionally rather than checking
 * first.
 */
export function thumbUrlFor(url: string | null | undefined): string | null {
  const id = imageIdFrom(url);
  return id ? imageUrlFor(thumbIdFor(id)) : (url ?? null);
}
