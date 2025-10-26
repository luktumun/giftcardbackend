import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
    },
    orderId: {
      type: String,
      required: [true, "Order ID is required"],
      unique: true,
    },
    cardId: {
      type: Number,
      required: [true, "Gift card ID is required"],
    },
    brand: {
      type: String,
      required: [true, "Gift card brand is required"],
    },
    value: {
      type: String,
      required: [true, "Gift card value is required"],
    },
    amount: {
      type: String,
      required: [true, "Amount is required"],
    },
    image: {
      type: String,
      required: [true, "Gift card image is required"],
    },
    expiry: {
      type: String,
      required: [true, "Expiry date is required"],
    },
    upi: {
      type: String,
      required: [true, "UPI ID is required"],
    },
    txnId: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "verified", "soldout"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
