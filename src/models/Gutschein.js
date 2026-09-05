import mongoose from "mongoose";

const redemptionSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true },
    redeemedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const gutscheinSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    initialAmount: { type: Number, required: true },
    currentAmount: { type: Number, required: true },
    buyerName: { type: String, required: true },
    buyerEmail: { type: String, required: true },
    // Optional: the purchase form lets the buyer omit the recipient's name.
    recipientName: { type: String, default: "" },
    recipientEmail: { type: String, required: true },
    message: { type: String },
    billingAddress: {
      street: { type: String },
      city: { type: String },
      postalCode: { type: String },
      country: { type: String },
    },
    status: { type: String, enum: ["PENDING", "PAID", "CANCELLED"], default: "PENDING" },
    stripeSessionId: { type: String, unique: true, sparse: true },
    // Set once the PDF has been generated and both emails have been sent, so a
    // retried Stripe webhook does not deliver the voucher twice.
    deliveredAt: { type: Date },
    // Audit trail for every balance deduction.
    redemptions: { type: [redemptionSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.Gutschein || mongoose.model("Gutschein", gutscheinSchema);
