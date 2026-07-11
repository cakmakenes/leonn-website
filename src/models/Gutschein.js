import mongoose from "mongoose";

const gutscheinSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true }, // Hediye çeki kodu (Örn: LEONN-X1Y2)
  amount: { type: Number, required: true }, // Tutar (Örn: 50, 100 Euro)
  buyerName: { type: String, required: true }, // Satın alan kişi
  buyerEmail: { type: String, required: true }, // Gönderilecek e-posta
  recipientName: { type: String }, // Opsiyonel: Kime hediye ediliyor
  message: { type: String }, // Opsiyonel: Hediye notu
  stripeSessionId: { type: String, required: true, unique: true }, // Stripe ödeme ID'si
  status: { type: String, enum: ["PENDING", "PAID", "USED"], default: "PENDING" }, // Durumu
  paymentDate: { type: Date },
}, { timestamps: true });

export default mongoose.models.Gutschein || mongoose.model("Gutschein", gutscheinSchema);
