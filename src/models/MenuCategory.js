import mongoose from "mongoose";

/**
 * A section of the public menu ("Çorbalar", "Desserts", ...).
 *
 * `position` drives both the sticky category bar and the section order on the
 * menu page. It is a plain integer maintained by the admin panel: reordering
 * rewrites the positions of every category in one bulk write, so gaps and
 * duplicates cannot accumulate.
 *
 * `slug` is the DOM id / scroll anchor of the section. It is derived from the
 * name once, on creation, and then left alone - renaming a category must not
 * silently change a URL fragment that guests may have bookmarked.
 */
const menuCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    slug: { type: String, required: true, unique: true, maxlength: 80 },
    // Short note under the heading, e.g. "werden mit Pirinç serviert".
    subtitle: { type: String, default: "", maxlength: 200 },
    position: { type: Number, required: true, default: 0 },
    // Lets the kitchen park a section (e.g. seasonal breakfast) without
    // deleting its items.
    isVisible: { type: Boolean, default: true },
  },
  { timestamps: true }
);

menuCategorySchema.index({ position: 1 });

export default mongoose.models.MenuCategory ||
  mongoose.model("MenuCategory", menuCategorySchema);
