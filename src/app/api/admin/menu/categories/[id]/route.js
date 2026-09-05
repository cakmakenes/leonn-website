import connectToDatabase from "@/lib/db";
import MenuCategory from "@/models/MenuCategory";
import MenuItem from "@/models/MenuItem";
import { guardAdminRequest, jsonError, jsonOk, readJsonBody } from "@/lib/adminApi";
import { deleteImageIfUnused, serializeCategory } from "@/lib/menu";
import { isValidObjectId, validateCategoryInput } from "@/lib/validation";

/** Renames a category or toggles its visibility. The slug stays fixed. */
export async function PATCH(req, { params }) {
  const refusal = await guardAdminRequest(req, "write");
  if (refusal) return refusal;

  const { id } = await params;
  if (!isValidObjectId(id)) return jsonError("Ungültige Kategorie.", 400);

  const body = await readJsonBody(req);
  const { errors, data } = validateCategoryInput(body, { partial: true });
  if (errors.length > 0) return jsonError(errors[0], 400);
  if (Object.keys(data).length === 0) return jsonError("Keine Änderungen übermittelt.", 400);

  try {
    await connectToDatabase();

    const category = await MenuCategory.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );
    if (!category) return jsonError("Kategorie nicht gefunden.", 404);

    return jsonOk({ category: serializeCategory(category) });
  } catch (error) {
    console.error("Category update failed:", error);
    return jsonError("Die Kategorie konnte nicht gespeichert werden.", 500);
  }
}

/**
 * Deletes a category together with all of its products.
 *
 * The cascade is deliberate and irreversible, which is why the admin UI asks
 * for confirmation and names the number of products that will go with it.
 */
export async function DELETE(req, { params }) {
  const refusal = await guardAdminRequest(req, "write");
  if (refusal) return refusal;

  const { id } = await params;
  if (!isValidObjectId(id)) return jsonError("Ungültige Kategorie.", 400);

  try {
    await connectToDatabase();

    const category = await MenuCategory.findById(id);
    if (!category) return jsonError("Kategorie nicht gefunden.", 404);

    const items = await MenuItem.find({ category: id }).select("image").lean();

    await MenuItem.deleteMany({ category: id });
    await MenuCategory.deleteOne({ _id: id });

    // Only after the items are gone, so "still referenced" is accurate.
    for (const item of items) {
      await deleteImageIfUnused(item.image);
    }

    return jsonOk({ success: true, deletedItems: items.length });
  } catch (error) {
    console.error("Category delete failed:", error);
    return jsonError("Die Kategorie konnte nicht gelöscht werden.", 500);
  }
}
