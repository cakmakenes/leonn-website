import connectToDatabase from "@/lib/db";
import MenuCategory from "@/models/MenuCategory";
import MenuItem from "@/models/MenuItem";
import { guardAdminRequest, jsonError, jsonOk, readFormBody } from "@/lib/adminApi";
import {
  deleteImageIfUnused,
  nextPosition,
  serializeItem,
  storeUploadedImage,
} from "@/lib/menu";
import { isValidObjectId, validateMenuItemInput } from "@/lib/validation";

/**
 * Updates a product.
 *
 * Accepts a partial multipart payload: only the submitted fields change. A new
 * `image` file replaces the photo, `removeImage=true` clears it, and sending
 * neither leaves the existing photo untouched.
 */
export async function PATCH(req, { params }) {
  const refusal = await guardAdminRequest(req, "write");
  if (refusal) return refusal;

  const { id } = await params;
  if (!isValidObjectId(id)) return jsonError("Ungültiges Produkt.", 400);

  const body = await readFormBody(req);
  if (!body) return jsonError("Ungültige Anfrage.", 400);

  const { errors, data } = validateMenuItemInput(body.fields, { partial: true });
  if (errors.length > 0) return jsonError(errors[0], 400);

  const hasNewImage = Boolean(body.image && body.image.size > 0);
  const removeImage = body.fields.removeImage === "true";

  if (Object.keys(data).length === 0 && !hasNewImage && !removeImage) {
    return jsonError("Keine Änderungen übermittelt.", 400);
  }

  try {
    await connectToDatabase();

    const item = await MenuItem.findById(id);
    if (!item) return jsonError("Produkt nicht gefunden.", 404);

    const update = {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.priceCents !== undefined && { priceCents: data.priceCents }),
      ...(data.isVisible !== undefined && { isVisible: data.isVisible }),
    };

    // Moving to another category appends the item there; keeping the old
    // position would interleave it arbitrarily with the target list.
    if (data.categoryId && data.categoryId !== String(item.category)) {
      const categoryExists = await MenuCategory.exists({ _id: data.categoryId });
      if (!categoryExists) return jsonError("Kategorie nicht gefunden.", 404);

      update.category = data.categoryId;
      update.position = await nextPosition(MenuItem, { category: data.categoryId });
    }

    const previousImage = item.image;

    if (hasNewImage) {
      const stored = await storeUploadedImage(body.image);
      if (stored.error) return jsonError(stored.error, 400);
      update.image = stored.imageId;
    } else if (removeImage) {
      update.image = null;
    }

    const updated = await MenuItem.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, runValidators: true }
    );

    if (previousImage && (hasNewImage || removeImage)) {
      await deleteImageIfUnused(previousImage);
    }

    return jsonOk({ item: serializeItem(updated) });
  } catch (error) {
    console.error("Menu item update failed:", error);
    return jsonError("Das Produkt konnte nicht gespeichert werden.", 500);
  }
}

export async function DELETE(req, { params }) {
  const refusal = await guardAdminRequest(req, "write");
  if (refusal) return refusal;

  const { id } = await params;
  if (!isValidObjectId(id)) return jsonError("Ungültiges Produkt.", 400);

  try {
    await connectToDatabase();

    const item = await MenuItem.findByIdAndDelete(id);
    if (!item) return jsonError("Produkt nicht gefunden.", 404);

    await deleteImageIfUnused(item.image);

    return jsonOk({ success: true });
  } catch (error) {
    console.error("Menu item delete failed:", error);
    return jsonError("Das Produkt konnte nicht gelöscht werden.", 500);
  }
}
