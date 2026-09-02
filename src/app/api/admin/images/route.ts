import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { backend } from "@/lib/db";
import {
  ACCEPTED_TYPES,
  MAX_IMAGE_BYTES,
  imageUrlFor,
  newImageId,
  sniffImage,
} from "@/lib/images";

/**
 * Uploads one product photo and returns the URL to put on a listing.
 *
 * Kept apart from saving the piece itself so the console can show the picture
 * before anything is committed — nobody should have to save a listing to find
 * out whether they picked the right file.
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
  const kind = sniffImage(bytes);
  if (!kind) {
    return NextResponse.json(
      {
        error:
          "That file is not a photo this shop can serve. " +
          `Use ${ACCEPTED_TYPES.map((t) => t.replace("image/", "").toUpperCase()).join(", ")}.`,
      },
      { status: 415 },
    );
  }

  const id = newImageId(kind);
  await backend().putImage({ id, contentType: kind.contentType, bytes });

  return NextResponse.json({ id, url: imageUrlFor(id), contentType: kind.contentType });
}

function mb(bytes: number): string {
  return (bytes / 1024 / 1024).toFixed(1);
}
