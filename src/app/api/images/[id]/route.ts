import { backend } from "@/lib/db";
import { isImageId } from "@/lib/images";

/**
 * Serves an uploaded product photo.
 *
 * Public, because these are the pictures on the shop's own product pages. The
 * headers are the careful part: the content type comes from the id this app
 * issued rather than anything a request carries, `nosniff` stops a browser
 * from second-guessing it, and the sandbox CSP means that even if a file did
 * somehow get through as something scriptable, there is nothing here for it to
 * run with.
 *
 * Ids are random and never reused, so the bytes behind one can never change —
 * which is what makes an immutable, year-long cache honest rather than a
 * promise this app would have to break on the next edit.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!isImageId(id)) return new Response("Not found", { status: 404 });

  const image = await backend().getImage(id);
  if (!image) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(image.bytes), {
    headers: {
      "content-type": image.contentType,
      "content-length": String(image.bytes.byteLength),
      "cache-control": "public, max-age=31536000, immutable",
      "content-disposition": `inline; filename="${id}"`,
      "x-content-type-options": "nosniff",
      "content-security-policy": "default-src 'none'; sandbox",
    },
  });
}
