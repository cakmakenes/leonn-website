/**
 * Server-side menu data access.
 *
 * Server-only: it imports the database connection and the Mongoose models.
 * Client components must go through the API routes or receive already
 * serialized props.
 */

import connectToDatabase from "@/lib/db";
import MenuCategory from "@/models/MenuCategory";
import MenuImage from "@/models/MenuImage";
import MenuItem from "@/models/MenuItem";

// Turkish and German characters have to survive slugification, otherwise
// "Çorbalar" and "Corbalar" would collapse into unrelated anchors.
const TRANSLITERATION = {
  ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u",
  ä: "a", ë: "e", ï: "i", ô: "o", û: "u", ß: "ss",
  â: "a", î: "i", é: "e", è: "e", à: "a",
};

/** URL/DOM-safe section anchor derived from a category name. */
export function slugifyCategoryName(name) {
  const base = String(name ?? "")
    .toLowerCase()
    .replace(/[çğıöşüäëïôûßâîéèà]/g, (char) => TRANSLITERATION[char] ?? char)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  // A name made purely of characters we strip (e.g. "***") must still yield a
  // usable anchor.
  return base || "kategorie";
}

/**
 * Finds a free slug by appending -2, -3, ... The loop is bounded; the unique
 * index on `slug` remains the real guarantee.
 */
export async function findAvailableSlug(name, { excludeId = null } = {}) {
  const base = slugifyCategoryName(name);

  for (let suffix = 0; suffix < 50; suffix += 1) {
    const candidate = suffix === 0 ? base : `${base}-${suffix + 1}`;
    const query = { slug: candidate };
    if (excludeId) query._id = { $ne: excludeId };

    const clash = await MenuCategory.exists(query);
    if (!clash) return candidate;
  }

  return `${base}-${Date.now().toString(36)}`;
}

export function serializeCategory(doc) {
  return {
    id: String(doc._id),
    name: doc.name,
    slug: doc.slug,
    subtitle: doc.subtitle ?? "",
    position: doc.position,
    isVisible: doc.isVisible,
  };
}

export function serializeItem(doc) {
  return {
    id: String(doc._id),
    categoryId: String(doc.category),
    name: doc.name,
    description: doc.description ?? "",
    priceCents: doc.priceCents,
    imageId: doc.image ? String(doc.image) : null,
    position: doc.position,
    isVisible: doc.isVisible,
  };
}

/**
 * The whole menu as `[{ ...category, items: [...] }]`, ordered by position.
 *
 * `includeHidden` is the difference between the admin panel (sees everything)
 * and the public page (sees only what is switched on). Two queries and an
 * in-memory group keeps it to a single round trip per collection.
 */
export async function getMenuTree({ includeHidden = false } = {}) {
  await connectToDatabase();

  const categoryFilter = includeHidden ? {} : { isVisible: true };
  const itemFilter = includeHidden ? {} : { isVisible: true };

  const [categories, items] = await Promise.all([
    MenuCategory.find(categoryFilter).sort({ position: 1, createdAt: 1 }).lean(),
    MenuItem.find(itemFilter).sort({ position: 1, createdAt: 1 }).lean(),
  ]);

  const itemsByCategory = new Map();
  for (const item of items) {
    const key = String(item.category);
    if (!itemsByCategory.has(key)) itemsByCategory.set(key, []);
    itemsByCategory.get(key).push(serializeItem(item));
  }

  return categories.map((category) => ({
    ...serializeCategory(category),
    items: itemsByCategory.get(String(category._id)) ?? [],
  }));
}

/**
 * Position for a freshly created row: one past the current maximum, so new
 * entries land at the end of the list.
 */
export async function nextPosition(model, filter = {}) {
  const last = await model.findOne(filter).sort({ position: -1 }).select("position").lean();
  return last ? last.position + 1 : 0;
}

/**
 * Rewrites `position` to match the given id order.
 *
 * Ids that do not belong to `filter` are ignored, so a stale or tampered
 * client payload can only reorder rows it was allowed to see. Returns the
 * number of rows actually moved.
 */
export async function applyOrder(model, ids, filter = {}) {
  const allowed = await model.find(filter).select("_id").lean();
  const allowedIds = new Set(allowed.map((doc) => String(doc._id)));

  const ordered = ids.map(String).filter((id) => allowedIds.has(id));
  if (ordered.length === 0) return 0;

  // Anything the client did not mention keeps its relative order after the
  // explicitly ordered rows.
  const remaining = [...allowedIds].filter((id) => !ordered.includes(id));
  const finalOrder = [...ordered, ...remaining];

  await model.bulkWrite(
    finalOrder.map((id, index) => ({
      updateOne: { filter: { _id: id }, update: { $set: { position: index } } },
    }))
  );

  return ordered.length;
}

/* ------------------------------------------------------------------------- */
/* Product photos                                                            */
/* ------------------------------------------------------------------------- */

// The browser downscales before uploading, so this ceiling is only a backstop
// against a hand-crafted request.
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * Identifies the format from the file's magic bytes.
 *
 * The uploaded content type is attacker-controlled, and whatever we store is
 * echoed back as the `Content-Type` of /api/menu/image/[id]. Sniffing the
 * actual bytes keeps a mislabeled file (say, an HTML document announced as
 * image/png) from ever being served as something a browser would execute.
 */
function detectImageType(bytes) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

/**
 * Persists an uploaded photo and returns `{ imageId }`, or `{ error }` with a
 * message meant for the admin UI. Never throws on bad input.
 */
export async function storeUploadedImage(file) {
  if (!file || typeof file.arrayBuffer !== "function") {
    return { error: "Ungültige Bilddatei." };
  }
  if (typeof file.size === "number" && file.size > MAX_IMAGE_BYTES) {
    return { error: "Das Bild darf maximal 2 MB groß sein." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (buffer.byteLength === 0) return { error: "Die Bilddatei ist leer." };
  if (buffer.byteLength > MAX_IMAGE_BYTES) {
    return { error: "Das Bild darf maximal 2 MB groß sein." };
  }

  const detected = detectImageType(buffer);
  if (!detected || !ALLOWED_IMAGE_TYPES.has(detected)) {
    return { error: "Nur JPG-, PNG- oder WebP-Bilder werden unterstützt." };
  }

  const created = await MenuImage.create({
    data: buffer,
    contentType: detected,
    byteSize: buffer.byteLength,
  });

  return { imageId: created._id };
}

/**
 * Best-effort cleanup of photos no longer referenced by any item.
 *
 * Called after an item is deleted or its photo replaced. A failure here is
 * logged and swallowed: an orphaned image wastes a little space, but must never
 * turn a successful menu edit into an error for the admin.
 */
export async function deleteImageIfUnused(imageId) {
  if (!imageId) return;

  try {
    const stillUsed = await MenuItem.exists({ image: imageId });
    if (!stillUsed) await MenuImage.deleteOne({ _id: imageId });
  } catch (error) {
    console.error("Menu image cleanup failed:", error);
  }
}
