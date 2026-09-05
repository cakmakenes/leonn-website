import mongoose from "mongoose";

/**
 * Product photo, stored as binary in MongoDB.
 *
 * Why in the database instead of on disk: the app is expected to run on a
 * serverless/read-only filesystem, and adding an object store (S3, Cloudinary)
 * would mean new credentials plus a wider `img-src` in the CSP. Images are
 * downscaled in the browser before upload and capped server-side, so documents
 * stay far below MongoDB's 16 MB limit.
 *
 * Images are immutable: editing a product's photo inserts a new document and
 * repoints the item, which is what makes the long browser cache on
 * /api/menu/image/[id] safe.
 */
const menuImageSchema = new mongoose.Schema(
  {
    data: { type: Buffer, required: true },
    contentType: { type: String, required: true },
    byteSize: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.MenuImage || mongoose.model("MenuImage", menuImageSchema);
