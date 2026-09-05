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
 *
 * Caching has two layers on the response:
 *   - `max-age`  keeps the file in the visitor's browser for a year.
 *   - `s-maxage` lets Vercel's edge cache hold the function response too, so
 *     only the first request per edge location hits the serverless function
 *     and MongoDB. Because a photo is immutable (replacing it mints a new id),
 *     there is no invalidation problem to worry about.
 * `stale-while-revalidate` lets the edge keep serving the cached bytes while it
 * refreshes in the background, so a visitor never waits on the origin.
 */
const IMAGE_CACHE_CONTROL =
  "public, max-age=31536000, s-maxage=31536000, stale-while-revalidate=86400, immutable";

export async function GET(_req, { params }) {
  // Misses are deliberately not cached: an id can 404 because its photo was
  // just deleted, and a cached negative response would outlive the deletion.
  const notFound = () =>
    NextResponse.json(
      { error: "Nicht gefunden." },
      { status: 404, headers: { "cache-control": "no-store" } }
    );

  const { id } = await params;
  if (!isValidObjectId(id)) return notFound();

  try {
    await connectToDatabase();

    const image = await MenuImage.findById(id).lean();
    if (!image?.data) return notFound();

    return new NextResponse(Buffer.from(image.data.buffer ?? image.data), {
      status: 200,
      headers: {
        "content-type": image.contentType,
        "content-length": String(image.byteSize ?? image.data.length),
        "cache-control": IMAGE_CACHE_CONTROL,
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Menu image fetch failed:", error);
    return NextResponse.json({ error: "Systemfehler." }, { status: 500 });
  }
}
