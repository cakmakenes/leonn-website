import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    guests: { type: Number, required: true },
    specialRequests: { type: String },
    status: { type: String, enum: ["PENDING", "CONFIRMED", "CANCELLED"], default: "PENDING" },
    // Separate high-entropy tokens per action: holding the approval link must
    // not also grant the ability to reject, and vice versa.
    approveToken: { type: String, index: true },
    rejectToken: { type: String, index: true },
    tokenExpiresAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.Reservation || mongoose.model("Reservation", reservationSchema);
