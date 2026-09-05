"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, LoaderCircle, X } from "lucide-react";
import { centsToPriceInput } from "@/lib/format";
import { MENU_LIMITS } from "@/lib/validation";
import { prepareImageForUpload } from "./imageResize";
import styles from "./page.module.css";

/**
 * Create/edit form for a single product.
 *
 * The dialog owns the form state and hands a ready `FormData` to `onSubmit`,
 * which is where the request lives. `onSubmit` resolves to `{ ok, error }`, so a
 * failed save keeps the dialog open with the values intact.
 */
export default function ItemDialog({ item, categories, defaultCategoryId, onSubmit, onClose }) {
  const isEdit = Boolean(item);

  const [name, setName] = useState(item?.name ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [price, setPrice] = useState(item ? centsToPriceInput(item.priceCents) : "");
  const [categoryId, setCategoryId] = useState(item?.categoryId ?? defaultCategoryId ?? "");
  const [isVisible, setIsVisible] = useState(item?.isVisible ?? true);

  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [preparing, setPreparing] = useState(false);

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef(null);

  // Close on Escape, the expected way out of a modal on a desktop keyboard.
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  // Object URLs are only freed explicitly.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const existingImageUrl =
    item?.imageId && !removeImage && !imageFile ? `/api/menu/image/${item.imageId}` : null;

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // Allow re-picking the same file after a removal.
    if (!file) return;

    setError("");
    setPreparing(true);

    const result = await prepareImageForUpload(file);

    setPreparing(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setImageFile(result.file);
    setPreviewUrl(URL.createObjectURL(result.file));
    setRemoveImage(false);
  };

  const handleImageRemove = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setImageFile(null);
    // Only meaningful when editing an item that already has a stored photo.
    setRemoveImage(Boolean(item?.imageId));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const formData = new FormData();
    formData.set("categoryId", categoryId);
    formData.set("name", name);
    formData.set("description", description);
    formData.set("price", price);
    formData.set("isVisible", String(isVisible));
    if (imageFile) formData.set("image", imageFile);
    if (removeImage) formData.set("removeImage", "true");

    setSaving(true);
    const result = await onSubmit(formData);
    setSaving(false);

    if (!result?.ok) setError(result?.error || "Speichern fehlgeschlagen.");
  };

  const hasImage = Boolean(previewUrl || existingImageUrl);

  return (
    <div
      className={styles.backdrop}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="item-dialog-title">
        <div className={styles.dialogHead}>
          <h2 className={styles.dialogTitle} id="item-dialog-title">
            {isEdit ? "Produkt bearbeiten" : "Neues Produkt"}
          </h2>
          <button type="button" className={styles.iconBtn} onClick={onClose} aria-label="Schließen">
            <X size={20} />
          </button>
        </div>

        {error && <div className={`${styles.banner} ${styles.bannerError}`}>{error}</div>}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <span className={styles.label}>Foto</span>
            <div className={styles.imagePicker}>
              <div className={styles.imagePreview}>
                {hasImage ? (
                  // Plain <img>: the source is either a blob URL or an API route,
                  // neither of which benefits from the Next image optimizer.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl ?? existingImageUrl} alt="" />
                ) : (
                  <ImagePlus size={24} />
                )}
              </div>

              <div className={styles.imageActions}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className={styles.fileInput}
                  onChange={handleFileChange}
                  tabIndex={-1}
                  aria-hidden="true"
                />
                <button
                  type="button"
                  className={styles.ghostBtn}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={preparing}
                >
                  {preparing ? "Wird verarbeitet..." : hasImage ? "Foto ersetzen" : "Foto wählen"}
                </button>
                {hasImage && (
                  <button type="button" className={styles.ghostBtn} onClick={handleImageRemove}>
                    Foto entfernen
                  </button>
                )}
                <span className={styles.hint}>JPG, PNG oder WebP. Wird automatisch verkleinert.</span>
              </div>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="item-name">
              Name
            </label>
            <input
              id="item-name"
              className={styles.input}
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={MENU_LIMITS.itemName}
              required
              autoComplete="off"
            />
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="item-price">
                Preis (€)
              </label>
              <input
                id="item-price"
                className={styles.input}
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                inputMode="decimal"
                placeholder="12.50"
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="item-category">
                Kategorie
              </label>
              <select
                id="item-category"
                className={styles.select}
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                required
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="item-description">
              Beschreibung
            </label>
            <textarea
              id="item-description"
              className={styles.textarea}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={MENU_LIMITS.itemDescription}
            />
            <span className={styles.charCount}>
              {description.length}/{MENU_LIMITS.itemDescription}
            </span>
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
            <button type="submit" className={styles.primaryBtn} disabled={saving || preparing}>
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
