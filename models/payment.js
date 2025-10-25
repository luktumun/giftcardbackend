import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    txnId: { type: String, required: true, unique: true },
    cardId: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "verified", "failed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
