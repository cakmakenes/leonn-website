"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, X } from "lucide-react";
import { MENU_LIMITS } from "@/lib/validation";
import styles from "./page.module.css";

/**
 * Create/rename form for a category. `onSubmit` resolves to `{ ok, error }`.
 */
export default function CategoryDialog({ category, onSubmit, onClose }) {
  const isEdit = Boolean(category);

  const [name, setName] = useState(category?.name ?? "");
  const [isVisible, setIsVisible] = useState(category?.isVisible ?? true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSaving(true);

    const result = await onSubmit({ name, isVisible });

    setSaving(false);
    if (!result?.ok) setError(result?.error || "Speichern fehlgeschlagen.");
  };

  return (
    <div
      className={styles.backdrop}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-dialog-title"
      >
        <div className={styles.dialogHead}>
          <h2 className={styles.dialogTitle} id="category-dialog-title">
            {isEdit ? "Kategorie bearbeiten" : "Neue Kategorie"}
          </h2>
          <button type="button" className={styles.iconBtn} onClick={onClose} aria-label="Schließen">
            <X size={20} />
          </button>
        </div>

        {error && <div className={`${styles.banner} ${styles.bannerError}`}>{error}</div>}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="category-name">
              Name
            </label>
            <input
              id="category-name"
              className={styles.input}
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={MENU_LIMITS.categoryName}
              required
              autoComplete="off"
              autoFocus
            />
          </div>

          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={isVisible}
              onChange={(event) => setIsVisible(event.target.checked)}
            />
            Auf der Speisekarte anzeigen
          </label>

          <div className={styles.dialogActions}>
            <button type="button" className={styles.ghostBtn} onClick={onClose} disabled={saving}>
              Abbrechen
            </button>
            <button type="submit" className={styles.primaryBtn} disabled={saving}>
              {saving ? (
                <>
                  <LoaderCircle size={16} className={styles.spinner} /> Speichern...
                </>
              ) : (
                "Speichern"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
