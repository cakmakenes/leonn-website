"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  ImagePlus,
  LoaderCircle,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { formatEuroFromCents } from "@/lib/format";
import CategoryDialog from "./CategoryDialog";
import ItemDialog from "./ItemDialog";
import styles from "./page.module.css";

/**
 * Menu administration: categories and their products, including order.
 *
 * Reordering and visibility toggles apply optimistically and are reconciled
 * with a reload if the request fails, so a tap on a phone with a flaky
 * connection can never leave the list showing an order the server rejected.
 */
export default function AdminMenuPage() {
  const router = useRouter();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  const [categoryDialog, setCategoryDialog] = useState(null); // { category | null }
  const [itemDialog, setItemDialog] = useState(null); // { item | null }

  /**
   * Single place where an expired session is handled: the middleware answers
   * with 401 once the cookie is gone, and every caller funnels through here.
   */
  const request = useCallback(
    async (url, options = {}) => {
      const response = await fetch(url, { ...options, cache: "no-store" });

      if (response.status === 401) {
        router.replace("/admin/login?next=/admin/menu");
        return { ok: false, error: "Sitzung abgelaufen." };
      }

      let payload = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (!response.ok) {
        return { ok: false, error: payload?.error || "Die Anfrage ist fehlgeschlagen." };
      }
      return { ok: true, data: payload };
    },
    [router]
  );

  /**
   * Reloads the whole tree. Used both on mount and after every mutation: the
   * lists are small, and re-reading is what keeps positions and counts honest
   * after a cascade delete or a category move.
   */
  const load = useCallback(async () => {
    const result = await request("/api/admin/menu");
    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setError("");
    setCategories(result.data.categories ?? []);
  }, [request]);

  useEffect(() => {
    // Fetch on mount. The lint rule guards against cascading renders from
    // synchronous setState in an effect; here every setState happens after the
    // request resolves, which is the intended "subscribe to an external
    // system" shape.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  /**
   * The selection is derived rather than synchronised: if the selected category
   * was deleted (or nothing has been picked yet) the first one takes over. That
   * keeps deletions from leaving the products pane pointing at a ghost.
   */
  const activeCategory = useMemo(() => {
    if (categories.length === 0) return null;
    return (
      categories.find((category) => category.id === selectedCategoryId) ?? categories[0]
    );
  }, [categories, selectedCategoryId]);

  const activeCategoryId = activeCategory?.id ?? null;

  const flash = (message) => {
    setNotice(message);
    setError("");
    window.setTimeout(() => setNotice(""), 3500);
  };

  const fail = (message) => {
    setError(message);
    setNotice("");
  };

  /* ----------------------------------------------------------------------- */
  /* Categories                                                              */
  /* ----------------------------------------------------------------------- */

  const submitCategory = async ({ name, isVisible }) => {
    const editing = categoryDialog?.category ?? null;

    const result = editing
      ? await request(`/api/admin/menu/categories/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, isVisible }),
        })
      : await request("/api/admin/menu/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, isVisible }),
        });

    if (!result.ok) return result;

    await load();
    setCategoryDialog(null);
    if (!editing) setSelectedCategoryId(result.data?.category?.id ?? null);
    flash(editing ? "Kategorie gespeichert." : "Kategorie erstellt.");
    return { ok: true };
  };

  const toggleCategoryVisibility = async (category) => {
    setBusy(true);
    const result = await request(`/api/admin/menu/categories/${category.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isVisible: !category.isVisible }),
    });
    setBusy(false);

    if (!result.ok) return fail(result.error);
    await load();
  };

  const deleteCategory = async (category) => {
    const itemCount = category.items.length;
    const confirmed = window.confirm(
      itemCount > 0
        ? `"${category.name}" und ${itemCount} Produkt(e) endgültig löschen?`
        : `"${category.name}" endgültig löschen?`
    );
    if (!confirmed) return;

    setBusy(true);
    const result = await request(`/api/admin/menu/categories/${category.id}`, {
      method: "DELETE",
    });
    setBusy(false);

    if (!result.ok) return fail(result.error);
    await load();
    flash("Kategorie gelöscht.");
  };

  const moveCategory = async (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= categories.length) return;

    const reordered = [...categories];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setCategories(reordered);

    const result = await request("/api/admin/menu/categories", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: reordered.map((category) => category.id) }),
    });

    if (!result.ok) {
      fail(result.error);
      await load();
    }
  };

  /* ----------------------------------------------------------------------- */
  /* Products                                                                */
  /* ----------------------------------------------------------------------- */

  const submitItem = async (formData) => {
    const editing = itemDialog?.item ?? null;

    const result = editing
      ? await request(`/api/admin/menu/items/${editing.id}`, { method: "PATCH", body: formData })
      : await request("/api/admin/menu/items", { method: "POST", body: formData });

    if (!result.ok) return result;

    await load();
    setItemDialog(null);

    // Follow the product if it was moved into another category.
    const movedTo = result.data?.item?.categoryId;
    if (movedTo) setSelectedCategoryId(movedTo);

    flash(editing ? "Produkt gespeichert." : "Produkt erstellt.");
    return { ok: true };
  };

  const toggleItemVisibility = async (item) => {
    const formData = new FormData();
    formData.set("isVisible", String(!item.isVisible));

    setBusy(true);
    const result = await request(`/api/admin/menu/items/${item.id}`, {
      method: "PATCH",
      body: formData,
    });
    setBusy(false);

    if (!result.ok) return fail(result.error);
    await load();
  };

  const deleteItem = async (item) => {
    if (!window.confirm(`"${item.name}" endgültig löschen?`)) return;

    setBusy(true);
    const result = await request(`/api/admin/menu/items/${item.id}`, { method: "DELETE" });
    setBusy(false);

    if (!result.ok) return fail(result.error);
    await load();
    flash("Produkt gelöscht.");
  };

  const moveItem = async (index, direction) => {
    if (!activeCategory) return;

    const items = activeCategory.items;
    const target = index + direction;
    if (target < 0 || target >= items.length) return;

    const reordered = [...items];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];

    setCategories((current) =>
      current.map((category) =>
        category.id === activeCategory.id ? { ...category, items: reordered } : category
      )
    );

    const result = await request("/api/admin/menu/items", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoryId: activeCategory.id,
        order: reordered.map((item) => item.id),
      }),
    });

    if (!result.ok) {
      fail(result.error);
      await load();
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      router.replace("/admin/login");
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.topBar}>
          <h1 className={styles.title}>Speisekarte verwalten</h1>
          <nav className={styles.topActions}>
            <Link href="/admin/redeem" className={styles.ghostBtn}>
              Gutscheine
            </Link>
            <button type="button" className={styles.ghostBtn} onClick={handleLogout}>
              Abmelden
            </button>
          </nav>
        </header>

        {error && <div className={`${styles.banner} ${styles.bannerError}`} role="alert">{error}</div>}
        {notice && <div className={`${styles.banner} ${styles.bannerSuccess}`} role="status">{notice}</div>}

        {loading ? (
          <div className={styles.loadingState}>
            <LoaderCircle size={18} className={styles.spinner} />
            Speisekarte wird geladen...
          </div>
        ) : (
          <div className={styles.layout}>
            {/* Categories */}
            <section className={styles.pane} aria-label="Kategorien">
              <div className={styles.paneHead}>
                <div>
                  <h2 className={styles.paneTitle}>Kategorien</h2>
                  <p className={styles.paneSubtitle}>{categories.length} Kategorie(n)</p>
                </div>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={() => setCategoryDialog({ category: null })}
                >
                  <Plus size={16} /> Neu
                </button>
              </div>

              {categories.length === 0 ? (
                <p className={styles.empty}>
                  Noch keine Kategorien. Legen Sie die erste an, um Produkte hinzufügen zu können.
                </p>
              ) : (
                <ul className={styles.list}>
                  {categories.map((category, index) => (
                    <li
                      key={category.id}
                      className={`${styles.row} ${styles.categoryRow} ${
                        category.id === activeCategoryId ? styles.categoryRowActive : ""
                      } ${category.isVisible ? "" : styles.rowHidden}`}
                    >
                      <button
                        type="button"
                        className={styles.categorySelect}
                        onClick={() => setSelectedCategoryId(category.id)}
                        aria-current={category.id === activeCategoryId}
                      >
                        <span className={styles.categoryName}>{category.name}</span>
                        <span className={styles.countBadge}>{category.items.length}</span>
                      </button>

                      <div className={styles.rowActions}>
                        <button
                          type="button"
                          className={styles.iconBtn}
                          onClick={() => moveCategory(index, -1)}
                          disabled={index === 0 || busy}
                          aria-label={`${category.name} nach oben`}
                        >
                          <ChevronUp size={18} />
                        </button>
                        <button
                          type="button"
                          className={styles.iconBtn}
                          onClick={() => moveCategory(index, 1)}
                          disabled={index === categories.length - 1 || busy}
                          aria-label={`${category.name} nach unten`}
                        >
                          <ChevronDown size={18} />
                        </button>
                        <button
                          type="button"
                          className={styles.iconBtn}
                          onClick={() => toggleCategoryVisibility(category)}
                          disabled={busy}
                          aria-label={
                            category.isVisible
                              ? `${category.name} ausblenden`
                              : `${category.name} einblenden`
                          }
                        >
                          {category.isVisible ? <Eye size={18} /> : <EyeOff size={18} />}
                        </button>
                        <button
                          type="button"
                          className={styles.iconBtn}
                          onClick={() => setCategoryDialog({ category })}
                          aria-label={`${category.name} bearbeiten`}
                        >
                          <Pencil size={17} />
                        </button>
                        <button
                          type="button"
                          className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                          onClick={() => deleteCategory(category)}
                          disabled={busy}
                          aria-label={`${category.name} löschen`}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Products of the selected category */}
            <section className={styles.pane} aria-label="Produkte">
              <div className={styles.paneHead}>
                <div>
                  <h2 className={styles.paneTitle}>
                    {activeCategory ? activeCategory.name : "Produkte"}
                  </h2>
                  <p className={styles.paneSubtitle}>
                    {activeCategory
                      ? `${activeCategory.items.length} Produkt(e)`
                      : "Keine Kategorie ausgewählt"}
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={() => setItemDialog({ item: null })}
                  disabled={!activeCategory}
                >
                  <Plus size={16} /> Produkt
                </button>
              </div>

              {!activeCategory ? (
                <p className={styles.empty}>Wählen Sie eine Kategorie aus.</p>
              ) : activeCategory.items.length === 0 ? (
                <p className={styles.empty}>
                  In dieser Kategorie gibt es noch keine Produkte.
                </p>
              ) : (
                <ul className={styles.list}>
                  {activeCategory.items.map((item, index) => (
                    <li
                      key={item.id}
                      className={`${styles.row} ${styles.itemRow} ${
                        item.isVisible ? "" : styles.rowHidden
                      }`}
                    >
                      <div className={styles.thumb}>
                        {item.imageId ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={`/api/menu/image/${item.imageId}`}
                            alt=""
                            className={styles.thumbImage}
                            width={64}
                            height={64}
                          />
                        ) : (
                          <ImagePlus size={20} />
                        )}
                      </div>

                      <div className={styles.itemInfo}>
                        <div className={styles.itemTopLine}>
                          <span className={styles.itemName}>{item.name}</span>
                          <span className={styles.itemPrice}>
                            {formatEuroFromCents(item.priceCents)} €
                          </span>
                        </div>
                        {item.description && <p className={styles.itemDesc}>{item.description}</p>}
                        {!item.isVisible && <span className={styles.hiddenTag}>Ausgeblendet</span>}
                      </div>

                      <div className={styles.rowActions}>
                        <button
                          type="button"
                          className={styles.iconBtn}
                          onClick={() => moveItem(index, -1)}
                          disabled={index === 0 || busy}
                          aria-label={`${item.name} nach oben`}
                        >
                          <ChevronUp size={18} />
                        </button>
                        <button
                          type="button"
                          className={styles.iconBtn}
                          onClick={() => moveItem(index, 1)}
                          disabled={index === activeCategory.items.length - 1 || busy}
                          aria-label={`${item.name} nach unten`}
                        >
                          <ChevronDown size={18} />
                        </button>
                        <button
                          type="button"
                          className={styles.iconBtn}
                          onClick={() => toggleItemVisibility(item)}
                          disabled={busy}
                          aria-label={
                            item.isVisible ? `${item.name} ausblenden` : `${item.name} einblenden`
                          }
                        >
                          {item.isVisible ? <Eye size={18} /> : <EyeOff size={18} />}
                        </button>
                        <button
                          type="button"
                          className={styles.iconBtn}
                          onClick={() => setItemDialog({ item })}
                          aria-label={`${item.name} bearbeiten`}
                        >
                          <Pencil size={17} />
                        </button>
                        <button
                          type="button"
                          className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                          onClick={() => deleteItem(item)}
                          disabled={busy}
                          aria-label={`${item.name} löschen`}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>

      {categoryDialog && (
        <CategoryDialog
          category={categoryDialog.category}
          onSubmit={submitCategory}
          onClose={() => setCategoryDialog(null)}
        />
      )}

      {itemDialog && (
        <ItemDialog
          item={itemDialog.item}
          categories={categories}
          defaultCategoryId={activeCategoryId}
          onSubmit={submitItem}
          onClose={() => setItemDialog(null)}
        />
      )}
    </main>
  );
}
