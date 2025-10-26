import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

/**
 * Sends the unlocked gift card via email after successful payment verification.
 * @param {string} email - The recipient's email address
 * @param {object} card - The gift card details (brand, value, image, expiry)
 */
export async function sendGiftCardEmail(email, card) {
  try {
    // ✅ Configure your email service
    const transporter = nodemailer.createTransport({
      service: "gmail", // You can use "gmail", "hotmail", or a custom SMTP server
      auth: {
        user: process.env.EMAIL_USER, // your email address
        pass: process.env.EMAIL_PASS, // app password (not your real password!)
      },
    });

    const mailOptions = {
      from: `"Gift Card Store" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🎁 Your ${card.brand} Gift Card (${card.value})`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Hi there!</h2>
          <p>Thank you for your purchase 🎉</p>
          <p>Here are your gift card details:</p>
          <ul>
            <li><strong>Brand:</strong> ${card.brand}</li>
            <li><strong>Value:</strong> ${card.value}</li>
            <li><strong>Expiry:</strong> ${card.expiry}</li>
          </ul>
          <p>You can now redeem your gift card directly.</p>
          <img src="${process.env.FRONTEND_URL || ""}${card.image}" 
               alt="${card.brand}" 
               style="max-width: 100%; height: auto; border-radius: 10px;" />
          <br/>
          <p>Thank you for shopping with us!</p>
          <p>— Gift Card Store</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Gift card email sent to ${email}`);
  } catch (error) {
    console.error("❌ Error sending email:", error);
  }
}
