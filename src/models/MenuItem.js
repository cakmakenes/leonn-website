import mongoose from "mongoose";

/**
 * A single dish or drink inside a category.
 *
 * The price is stored in cents as an integer. Euro floats would accumulate
 * rounding errors (0.1 + 0.2) and the menu is the one place where a wrong digit
 * is visible to every guest.
 *
 * `image` points at a MenuImage document rather than embedding the binary, so
 * listing a category never drags photo bytes through the query.
 */
const menuItemSchema = new mongoose.Schema(
  {
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MenuCategory",
      required: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: "", maxlength: 500 },
    priceCents: { type: Number, required: true, min: 0, max: 10000000 },
    image: { type: mongoose.Schema.Types.ObjectId, ref: "MenuImage", default: null },
    position: { type: Number, required: true, default: 0 },
    isVisible: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Every read is "the items of one category, in order".
menuItemSchema.index({ category: 1, position: 1 });

export default mongoose.models.MenuItem || mongoose.model("MenuItem", menuItemSchema);
