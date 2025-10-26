import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    cardId: { type: Number, required: true },
    orderId: { type: String, required: true },
    txnId: { type: String },
    brand: { type: String, required: true },
    value: { type: String, required: true },
    amount: { type: Number, required: true },
    upi: { type: String, required: true },
    image: { type: String, required: true },
    expiry: { type: String, required: true },
    status: { type: String, enum: ["pending", "verified"], default: "pending" },
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
