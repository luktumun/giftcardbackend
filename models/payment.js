import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    txnId: { type: String, unique: true, sparse: true },
    orderId: { type: String },
    cardId: { type: Number, required: true },
    status: { type: String, default: "pending" },
    brand: String,
    value: String,
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
