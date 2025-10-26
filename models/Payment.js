import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    orderId: { type: String, required: true, unique: true },
    cardId: { type: Number, required: true },
    brand: { type: String, required: true },
    value: { type: String, required: true },
    amount: { type: Number, required: true },
    image: { type: String, required: true },
    expiry: { type: String, required: true },
    upi: { type: String, required: true },
    txnId: { type: String },
    status: {
      type: String,
      enum: ["pending", "verified", "failed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
