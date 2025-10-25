import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Payment from "./models/Payment.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// ✅ Verify payment endpoint
app.post("/api/verify-payment", async (req, res) => {
  const { email, txnId, cardId } = req.body;

  if (!email || !txnId || !cardId) {
    return res
      .status(400)
      .json({ success: false, message: "Missing required fields" });
  }

  try {
    // Check if transaction ID already exists
    const existingTxn = await Payment.findOne({ txnId });
    if (existingTxn) {
      return res.json({
        success: true,
        message: "Transaction already verified earlier.",
      });
    }

    // Store the new payment in the database
    const newPayment = new Payment({
      email,
      txnId,
      cardId,
      status: "pending", // default state
    });
    await newPayment.save();

    // 🔹 Optional: integrate real payment verification logic
    // For example, check Razorpay / Cashfree / UPI API
    // Here we just simulate success if txnId starts with 'UPI'
    if (txnId.startsWith("UPI")) {
      newPayment.status = "verified";
      await newPayment.save();
      return res.json({ success: true, message: "Payment verified" });
    } else {
      return res.json({
        success: false,
        message: "Payment could not be verified automatically.",
      });
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Admin route to view all payments
app.get("/api/payments", async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching payments" });
  }
});

// ✅ Admin route to manually verify
app.post("/api/payments/verify", async (req, res) => {
  const { txnId } = req.body;
  try {
    const payment = await Payment.findOne({ txnId });
    if (!payment)
      return res.status(404).json({ success: false, message: "Txn not found" });
    payment.status = "verified";
    await payment.save();
    res.json({ success: true, message: "Payment marked as verified" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error updating payment" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
