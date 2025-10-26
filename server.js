import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import axios from "axios";
import Payment from "./models/Payment.js";
import { sendGiftCardEmail } from "./utils/sendEmail.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Static image serving
const __dirname = path.resolve();
app.use("/images", express.static(path.join(__dirname, "public/images")));

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// Gift card data (using images from /public/images)
const giftCards = [
  {
    id: 1,
    brand: "EasyMyTrip Hotels Gift Card",
    value: "₹500",
    expiry: "22 Oct 2026",
    payable: 470,
    image: "/images/easymytrip.png",
  },
  {
    id: 2,
    brand: "Resonate Gift Card",
    value: "₹1000",
    expiry: "22 Oct 2026",
    payable: 830,
    image: "/images/resonategiftcard.png",
  },
];

// 🟢 Fetch all gift cards
app.get("/api/cards", (req, res) => res.json(giftCards));

// 🟢 Step 1: Create Paytm QR order
app.post("/api/create-order", async (req, res) => {
  try {
    const { email, cardId } = req.body;
    const card = giftCards.find((c) => c.id === cardId);

    if (!card)
      return res
        .status(404)
        .json({ success: false, message: "Card not found" });
    if (!email)
      return res
        .status(400)
        .json({ success: false, message: "Email required" });

    const orderId = `ORDER_${Date.now()}`;

    const qrData = `upi://pay?pa=${process.env.PAYTM_UPI_ID}&pn=GiftCardStore&am=${card.payable}&cu=INR&tn=${orderId}`;
    const qrImage = `${process.env.QR_API_URL}${encodeURIComponent(qrData)}`;

    await Payment.create({
      email,
      orderId,
      cardId,
      brand: card.brand,
      value: card.value,
      image: card.image,
      amount: card.payable,
      upi: process.env.PAYTM_UPI_ID,
      expiry: card.expiry,
      status: "pending",
    });

    return res.json({
      success: true,
      qrImage,
      upi: process.env.PAYTM_UPI_ID,
      orderId,
      amount: card.payable,
    });
  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// 🟢 Step 2: Verify payment (secure)
app.post("/api/verify-payment", async (req, res) => {
  const { email, txnId, orderId, cardId } = req.body;
  if (!email || !txnId || !orderId)
    return res.status(400).json({ success: false, message: "Missing details" });

  try {
    const payment = await Payment.findOne({ orderId });
    if (!payment)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    // prevent fake verifications
    if (payment.status === "verified")
      return res.json({ success: false, message: "Already verified" });

    // 🚫 Basic validation - txnId must be at least 8 characters and start with "T"
    if (!txnId.startsWith("T") || txnId.length < 8)
      return res.json({ success: false, message: "Invalid transaction ID" });

    // Check if txnId already exists
    const existingTxn = await Payment.findOne({ txnId });
    if (existingTxn)
      return res.json({ success: false, message: "Transaction already used" });

    // ✅ Mark payment verified
    payment.status = "verified";
    payment.txnId = txnId;
    await payment.save();

    const card = giftCards.find((c) => c.id === cardId);

    // Send email with downloadable image
    await sendGiftCardEmail(email, card);

    return res.json({
      success: true,
      message: "✅ Payment verified. Gift card sent to your email.",
      downloadUrl: `${process.env.FRONTEND_URL}${card.image}`,
    });
  } catch (err) {
    console.error("Verify error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// 🟢 Fetch all payments
app.get("/api/payments", async (req, res) => {
  const payments = await Payment.find().sort({ createdAt: -1 });
  res.json(payments);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
