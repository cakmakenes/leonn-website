import connectToDatabase from "@/lib/db";
import { guardAdminRequest, jsonError, jsonOk } from "@/lib/adminApi";
import { getMenuTree } from "@/lib/menu";

/**
 * The complete menu for the admin panel, hidden entries included.
 * The public page uses its own server-side read in `src/app/menu/page.js`.
 */
export async function GET(req) {
  const refusal = await guardAdminRequest(req, "read");
  if (refusal) return refusal;

  try {
    await connectToDatabase();
    const categories = await getMenuTree({ includeHidden: true });
    return jsonOk({ categories });
  } catch (error) {
    console.error("Admin menu fetch failed:", error);
    return jsonError("Die Speisekarte konnte nicht geladen werden.", 500);
  }
}
