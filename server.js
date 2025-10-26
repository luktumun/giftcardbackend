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

// Static image path
const __dirname = path.resolve();
app.use("/images", express.static(path.join(__dirname, "public/images")));

// ✅ MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// 🎁 Gift cards data
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

// 🟢 Fetch all cards
app.get("/api/cards", (req, res) => {
  res.json(giftCards);
});

// 🟢 Step 1: Create Order and Generate QR (with payable amount)
app.post("/api/create-order", async (req, res) => {
  try {
    const { email, cardId } = req.body;
    const card = giftCards.find((c) => c.id === cardId);
    if (!card)
      return res
        .status(404)
        .json({ success: false, message: "Card not found" });

    const orderId = `ORDER_${Date.now()}`;
    const upiId = process.env.PAYTM_UPI_ID;
    const payable = card.payable;

    // Generate dynamic UPI QR URL
    const upiLink = `upi://pay?pa=${upiId}&pn=GiftCardStore&am=${payable}&tn=GiftCard_${orderId}`;
    const qrImage = `${process.env.QR_API_URL}${encodeURIComponent(upiLink)}`; // use QR API to generate image

    // Save payment record
    await Payment.create({
      email,
      orderId,
      cardId,
      brand: card.brand,
      value: card.value,
      amount: payable,
      image: card.image,
      expiry: card.expiry,
      upi: upiId,
      status: "pending",
    });

    res.json({
      success: true,
      orderId,
      qrImage,
      upi: upiId,
      amount: payable,
    });
  } catch (err) {
    console.error("❌ Error creating order:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// 🟢 Step 2: Simulate automatic Paytm verification (for demo)
app.post("/api/verify-payment", async (req, res) => {
  try {
    const { orderId } = req.body;
    const payment = await Payment.findOne({ orderId });

    if (!payment)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    if (payment.status === "verified")
      return res.json({ success: false, message: "Already verified" });

    // Simulate verification (✅ Auto-success for demo)
    payment.status = "verified";
    payment.txnId = `TXN${Date.now()}`;
    await payment.save();

    const card = giftCards.find((c) => c.id === payment.cardId);
    if (card) await sendGiftCardEmail(payment.email, card);

    res.json({
      success: true,
      message: "✅ Payment verified & gift card sent!",
    });
  } catch (err) {
    console.error("❌ Verification Error:", err);
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
