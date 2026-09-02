import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { backend } from "@/lib/db";
import { processImage, UnreadableImageError } from "@/lib/imageProcessing";
import {
  ACCEPTED_TYPES,
  imageUrlFor,
  MAX_IMAGE_BYTES,
  newImageId,
  sniffImage,
  thumbIdFor,
} from "@/lib/images";

/**
 * Uploads one product photo and returns the URL to put on a listing.
 *
 * Kept apart from saving the piece itself so the console can show the picture
 * before anything is committed — nobody should have to save a listing to find
 * out whether they picked the right file.
 *
 * The file is resized here rather than on the way out. Doing it once per upload
 * instead of once per visitor is the whole point, and it means what is stored
 * is what is served: no hidden original that a later bug could leak at full
 * size, and no per-request image processing on the hot path.
 */
export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "That was not a file upload" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "No file was attached" }, { status: 400 });
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      {
        error: `That photo is ${mb(file.size)} MB. The limit is ${mb(MAX_IMAGE_BYTES)} MB — resize it and try again.`,
      },
      { status: 413 },
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  // The type is read from the file's own bytes. `file.type` is whatever the
  // browser was told, and this app serves these bytes back from its own
  // origin — trusting a client-supplied content type there is how an upload
  // form becomes a way to run script on your domain.
  if (!sniffImage(bytes)) {
    return NextResponse.json(
      {
        error:
          "That file is not a photo this shop can serve. " +
          `Use ${ACCEPTED_TYPES.map((t) => t.replace("image/", "").toUpperCase()).join(", ")}.`,
      },
      { status: 415 },
    );
  }

  let processed;
  try {
    processed = await processImage(bytes);
  } catch (err) {
    if (err instanceof UnreadableImageError) {
      // A valid signature on a truncated file is a real case, and it is the
      // uploader's problem to fix, not a server fault.
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    throw err;
  }

  const { display, thumb, source } = processed;
  const id = newImageId(display.ext);
  const thumbId = thumbIdFor(id);

  await Promise.all([
    backend().putImage({ id, contentType: display.contentType, bytes: display.bytes }),
    // A photo already small enough needs no second rendition; the serving route
    // falls back to the display image for a thumbnail id that was never stored.
    ...(thumb
      ? [
          backend().putImage({
            id: thumbId,
            contentType: thumb.contentType,
            bytes: thumb.bytes,
          }),
        ]
      : []),
  ]);

  return NextResponse.json({
    id,
    url: imageUrlFor(id),
    thumbUrl: imageUrlFor(thumbId),
    contentType: display.contentType,
    width: display.width,
    height: display.height,
    bytes: display.bytes.byteLength,
    // What the resize actually achieved, so the console can say so rather than
    // silently changing someone's file.
    source,
  });
}

function mb(bytes: number): string {
  return (bytes / 1024 / 1024).toFixed(1);
}
