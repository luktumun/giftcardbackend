import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import Payment from "./models/Payment.js";
import { sendGiftCardEmail } from "./utils/sendEmail.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// ✅ Serve static images
const __dirname = path.resolve();
app.use("/images", express.static(path.join(__dirname, "public/images")));

// ✅ MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// 🎁 Gift card data (use images from backend)
const giftCards = [
  {
    id: 1,
    brand: "EasyMyTrip Hotels Gift Card",
    value: "₹500",
    expiry: "22 Oct 2026",
    payable: "₹470",
    image: "/images/easymytrip.png",
  },
  {
    id: 2,
    brand: "Resonate Gift Card",
    value: "₹1000",
    expiry: "22 Oct 2026",
    payable: "₹830",
    image: "/images/resonategiftcard.png",
  },
];

// 🟢 Get all cards (for frontend)
app.get("/api/cards", (req, res) => res.json(giftCards));

// 🟢 Step 1: Create order
app.post("/api/create-order", async (req, res) => {
  const { email, cardId } = req.body;
  const card = giftCards.find((c) => c.id === cardId);
  if (!card)
    return res.status(404).json({ success: false, message: "Card not found" });

  const orderId = `ORDER_${Date.now()}`;

  // ✅ Include all required fields for Payment schema
  await Payment.create({
    email,
    orderId,
    cardId,
    brand: card.brand,
    value: card.value,
    amount: card.payable,
    image: card.image,
    expiry: card.expiry,
    upi: process.env.PAYTM_UPI_ID,
    status: "pending",
  });

  return res.json({
    success: true,
    qrImage: process.env.PAYTM_QR, // static QR code image
    upi: process.env.PAYTM_UPI_ID,
    orderId,
    amount: card.payable,
  });
});

// 🟢 Step 2: Verify payment (manual txnId)
app.post("/api/verify-payment", async (req, res) => {
  const { email, txnId, orderId, cardId } = req.body;
  if (!email || !txnId)
    return res.status(400).json({ success: false, message: "Missing details" });

  try {
    const payment = await Payment.findOne({ orderId });
    if (!payment)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    const existingTxn = await Payment.findOne({ txnId });
    if (existingTxn)
      return res.json({ success: false, message: "Transaction already used" });

    payment.status = "verified";
    payment.txnId = txnId;
    await payment.save();

    const card = giftCards.find((c) => c.id === cardId);
    if (card) await sendGiftCardEmail(email, card);

    res.json({
      success: true,
      message: "✅ Payment verified! Gift card sent via email.",
    });
  } catch (err) {
    console.error("Error verifying:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// 🟢 View all payments
app.get("/api/payments", async (req, res) => {
  const payments = await Payment.find().sort({ createdAt: -1 });
  res.json(payments);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
