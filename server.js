import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Payment from "./models/Payment.js";
import { sendGiftCardEmail } from "./utils/sendEmail.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// ✅ Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// 🎁 Static gift cards
const giftCards = [
  {
    id: 1,
    brand: "EasyMyTrip Hotels Gift Card",
    value: "₹500",
    expiry: "22 Oct 2026",
    payable: "₹470",
    image:
      "https://www.dropbox.com/scl/fi/x8ohhl0z5g88eew3rb4ab/easymytrip.png?rlkey=0v2i8vfj30f8ltjexpb56lo0m&st=xkpwjqkn&raw=1",
  },
  {
    id: 2,
    brand: "Resonate Gift Card",
    value: "₹1000",
    expiry: "22 Oct 2026",
    payable: "₹830",
    image:
      "https://www.dropbox.com/scl/fi/pxcih0ejv03yc0jf2b5or/resonategiftcard.png?rlkey=igue5elo0p7bll2axuvsy81ys&st=oenogrg3&raw=1",
  },
];

// 🟢 Step 1: Send QR + UPI ID for manual payment
app.post("/api/create-order", async (req, res) => {
  const { email, cardId } = req.body;
  const card = giftCards.find((c) => c.id === cardId);
  if (!card) return res.status(404).json({ message: "Card not found" });

  const orderId = `ORDER_${Date.now()}`;

  // Save pending record
  await Payment.create({
    email,
    orderId,
    cardId,
    brand: card.brand,
    value: card.value,
    status: "pending",
  });

  return res.json({
    success: true,
    qrImage: process.env.PAYTM_QR, // use static QR image
    upi: process.env.PAYTM_UPI_ID,
    orderId,
    amount: card.payable,
  });
});

// 🟢 Step 2: Verify payment manually via txnId
app.post("/api/verify-payment", async (req, res) => {
  const { email, txnId, orderId, cardId } = req.body;
  if (!email || !txnId)
    return res.status(400).json({ message: "Missing details" });

  try {
    // ⚙️ Simple simulated verification
    const payment = await Payment.findOne({ orderId });
    if (!payment)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    // Avoid duplicate txnId
    const existingTxn = await Payment.findOne({ txnId });
    if (existingTxn)
      return res.json({
        success: false,
        message: "This transaction already used",
      });

    // Mark as verified directly (manual model)
    payment.status = "verified";
    payment.txnId = txnId;
    await payment.save();

    // Send gift card via email
    const card = giftCards.find((c) => c.id === cardId);
    if (card) await sendGiftCardEmail(email, card);

    return res.json({
      success: true,
      message: "✅ Payment marked verified and gift card emailed!",
    });
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// 🟢 Admin: view all payments
app.get("/api/payments", async (req, res) => {
  const payments = await Payment.find().sort({ createdAt: -1 });
  res.json(payments);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
