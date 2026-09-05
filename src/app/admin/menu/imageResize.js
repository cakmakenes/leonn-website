"use client";

/**
 * Downscales a chosen photo in the browser before it is uploaded.
 *
 * A phone camera file is 3-6 MB, which would be rejected by the API and is far
 * more resolution than a menu card ever shows. Re-encoding here keeps uploads
 * quick on mobile data and keeps the stored documents small.
 */

const MAX_DIMENSION = 1400;
const OUTPUT_TYPE = "image/webp";
const QUALITY = 0.82;
const HARD_LIMIT_BYTES = 2 * 1024 * 1024;

/** Returns `{ file }` with the upload-ready file, or `{ error }`. */
export async function prepareImageForUpload(file) {
  if (!file) return { error: "Keine Datei ausgewählt." };

  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    // Covers HEIC and anything that is not really an image.
    return { error: "Dieses Bildformat wird nicht unterstützt. Bitte JPG, PNG oder WebP." };
  }

  try {
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) throw new Error("canvas context unavailable");
    context.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, OUTPUT_TYPE, QUALITY)
    );

    if (!blob) throw new Error("encoding failed");
    if (blob.size > HARD_LIMIT_BYTES) {
      return { error: "Das Bild ist zu groß. Bitte wählen Sie ein kleineres Foto." };
    }

    return { file: new File([blob], "photo.webp", { type: OUTPUT_TYPE }) };
  } catch {
    // Encoding failed: fall back to the original bytes if they are small
    // enough for the server to accept.
    if (file.size <= HARD_LIMIT_BYTES) return { file };
    return { error: "Das Bild konnte nicht verarbeitet werden. Bitte wählen Sie ein kleineres Foto." };
  } finally {
    bitmap.close?.();
  }
}
