import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
    },
    cardId: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
      required: true,
    },
    value: {
      type: String,
      required: true,
    },
    expiry: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    upi: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    txnId: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "paid", "verified", "failed"],
      default: "pending",
    },
    verifiedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Optional helper method to mark payment verified
paymentSchema.methods.markAsVerified = async function (txnId) {
  this.txnId = txnId;
  this.status = "verified";
  this.verifiedAt = new Date();
  await this.save();
  return this;
};

export default mongoose.model("Payment", paymentSchema);
