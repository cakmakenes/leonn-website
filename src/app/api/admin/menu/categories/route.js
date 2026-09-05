import connectToDatabase from "@/lib/db";
import MenuCategory from "@/models/MenuCategory";
import { guardAdminRequest, jsonError, jsonOk, readJsonBody } from "@/lib/adminApi";
import { applyOrder, findAvailableSlug, nextPosition, serializeCategory } from "@/lib/menu";
import { validateCategoryInput, validateIdOrder } from "@/lib/validation";

/** Creates a category. It lands at the end of the list. */
export async function POST(req) {
  const refusal = await guardAdminRequest(req, "write");
  if (refusal) return refusal;

  const body = await readJsonBody(req);
  const { errors, data } = validateCategoryInput(body);
  if (errors.length > 0) return jsonError(errors[0], 400);

  try {
    await connectToDatabase();

    const category = await MenuCategory.create({
      name: data.name,
      slug: await findAvailableSlug(data.name),
      position: await nextPosition(MenuCategory),
      isVisible: data.isVisible,
    });

    return jsonOk({ category: { ...serializeCategory(category), items: [] } }, 201);
  } catch (error) {
    console.error("Category create failed:", error);
    return jsonError("Die Kategorie konnte nicht erstellt werden.", 500);
  }
}

/** Reorders categories. Body: `{ order: [categoryId, ...] }`. */
export async function PATCH(req) {
  const refusal = await guardAdminRequest(req, "write");
  if (refusal) return refusal;

  const body = await readJsonBody(req);
  const order = validateIdOrder(body?.order);
  if (!order) return jsonError("Ungültige Sortierung.", 400);

  try {
    await connectToDatabase();
    const moved = await applyOrder(MenuCategory, order);
    return jsonOk({ success: true, moved });
  } catch (error) {
    console.error("Category reorder failed:", error);
    return jsonError("Die Sortierung konnte nicht gespeichert werden.", 500);
  }
}
