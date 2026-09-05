import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import MenuImage from "@/models/MenuImage";
import { isValidObjectId } from "@/lib/validation";

/**
 * Serves a product photo.
 *
 * Public on purpose - these images appear on the public menu. Photos are
 * immutable (replacing one creates a new document with a new id), so the
 * response can be cached indefinitely.
 *
 * The stored content type was verified against the file's magic bytes on
 * upload, and `nosniff` stops a browser from reinterpreting it anyway.
 */
export async function GET(_req, { params }) {
  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  }

  try {
    await connectToDatabase();

    const image = await MenuImage.findById(id).lean();
    if (!image?.data) {
      return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
    }

    return new NextResponse(Buffer.from(image.data.buffer ?? image.data), {
      status: 200,
      headers: {
        "content-type": image.contentType,
        "content-length": String(image.byteSize ?? image.data.length),
        "cache-control": "public, max-age=31536000, immutable",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Menu image fetch failed:", error);
    return NextResponse.json({ error: "Systemfehler." }, { status: 500 });
  }
}
