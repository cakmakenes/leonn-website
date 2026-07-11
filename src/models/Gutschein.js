import mongoose from "mongoose";

const gutscheinSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, index: true },
  initialAmount: { type: Number, required: true },
  currentAmount: { type: Number, required: true },
  buyerName: { type: String, required: true },
  buyerEmail: { type: String, required: true },
  recipientName: { type: String, required: true },
  recipientEmail: { type: String, required: true },
  message: { type: String },
  billingAddress: {
    street: { type: String },
    city: { type: String },
    postalCode: { type: String },
    country: { type: String }
  },
  status: { type: String, enum: ["PENDING", "PAID", "CANCELLED"], default: "PENDING" },
  stripeSessionId: { type: String, unique: true, sparse: true }
}, { timestamps: true });

export default mongoose.models.Gutschein || mongoose.model("Gutschein", gutscheinSchema);
