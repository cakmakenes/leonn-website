import connectToDatabase from "@/lib/db";
import MenuCategory from "@/models/MenuCategory";
import MenuItem from "@/models/MenuItem";
import {
  guardAdminRequest,
  jsonError,
  jsonOk,
  readFormBody,
  readJsonBody,
} from "@/lib/adminApi";
import { applyOrder, nextPosition, serializeItem, storeUploadedImage } from "@/lib/menu";
import { isValidObjectId, validateIdOrder, validateMenuItemInput } from "@/lib/validation";

/**
 * Creates a product. Sent as multipart/form-data because the photo travels
 * with the other fields in a single request.
 */
export async function POST(req) {
  const refusal = await guardAdminRequest(req, "write");
  if (refusal) return refusal;

  const body = await readFormBody(req);
  if (!body) return jsonError("Ungültige Anfrage.", 400);

  const { errors, data } = validateMenuItemInput(body.fields);
  if (errors.length > 0) return jsonError(errors[0], 400);

  try {
    await connectToDatabase();

    const categoryExists = await MenuCategory.exists({ _id: data.categoryId });
    if (!categoryExists) return jsonError("Kategorie nicht gefunden.", 404);

    let imageId = null;
    if (body.image && body.image.size > 0) {
      const stored = await storeUploadedImage(body.image);
      if (stored.error) return jsonError(stored.error, 400);
      imageId = stored.imageId;
    }

    const item = await MenuItem.create({
      category: data.categoryId,
      name: data.name,
      description: data.description,
      priceCents: data.priceCents,
      image: imageId,
      position: await nextPosition(MenuItem, { category: data.categoryId }),
      isVisible: data.isVisible,
    });

    return jsonOk({ item: serializeItem(item) }, 201);
  } catch (error) {
    console.error("Menu item create failed:", error);
    return jsonError("Das Produkt konnte nicht erstellt werden.", 500);
  }
}

/**
 * Reorders the products of one category.
 * Body: `{ categoryId, order: [itemId, ...] }`.
 *
 * Scoping the reorder to a category means a payload cannot drag an item out of
 * its section by side effect.
 */
export async function PATCH(req) {
  const refusal = await guardAdminRequest(req, "write");
  if (refusal) return refusal;

  const body = await readJsonBody(req);
  const order = validateIdOrder(body?.order);

  if (!isValidObjectId(body?.categoryId)) return jsonError("Ungültige Kategorie.", 400);
  if (!order) return jsonError("Ungültige Sortierung.", 400);

  try {
    await connectToDatabase();
    const moved = await applyOrder(MenuItem, order, { category: body.categoryId });
    return jsonOk({ success: true, moved });
  } catch (error) {
    console.error("Menu item reorder failed:", error);
    return jsonError("Die Sortierung konnte nicht gespeichert werden.", 500);
  }
}
