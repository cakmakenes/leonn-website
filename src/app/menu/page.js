import { getMenuTree } from "@/lib/menu";
import MenuView from "./MenuView";
import styles from "./page.module.css";

/**
 * The menu is maintained in the admin panel, so it is rendered per request.
 *
 * Rendering dynamically also keeps the database out of the build: a deploy must
 * not fail because the cluster happened to be unreachable at build time.
 */
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Speisekarte | Leonn Restaurant",
  description: "Entdecken Sie die Speisekarte des Leonn Restaurants.",
};

async function loadMenu() {
  try {
    const categories = await getMenuTree();
    // A category with no visible products would render as an empty section in
    // the bar and the scroll-spy, so it is dropped from the public view.
    return { categories: categories.filter((category) => category.items.length > 0) };
  } catch (error) {
    console.error("Menu could not be loaded:", error);
    return { categories: [], failed: true };
  }
}

export default async function MenuPage() {
  const { categories, failed } = await loadMenu();

  return (
    <main className={styles.menuContainer}>
      <div className={styles.header}>
        <h1 className="font-tertiary">Unsere Speisekarte</h1>
        <p className={styles.subtitle}>Entdecken Sie unsere kulinarischen Highlights</p>
      </div>

      {categories.length > 0 ? (
        <MenuView categories={categories} />
      ) : (
        <div className={styles.menuContent}>
          <p className={styles.emptyState}>
            {failed
              ? "Die Speisekarte ist momentan nicht verfügbar. Bitte versuchen Sie es später erneut."
              : "Unsere Speisekarte wird gerade aktualisiert. Bitte schauen Sie in Kürze wieder vorbei."}
          </p>
        </div>
      )}
    </main>
  );
}
