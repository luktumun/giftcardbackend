import nodemailer from "nodemailer";

export async function sendGiftCardEmail(to, card) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Gift Cards" <${process.env.EMAIL_USER}>`,
      to,
      subject: `🎁 Your ${card.brand} Gift Card`,
      html: `
        <h2>Hi ${to.split("@")[0]},</h2>
        <p>Thank you for your payment! Here’s your verified gift card.</p>
        <p><strong>Brand:</strong> ${card.brand}</p>
        <p><strong>Value:</strong> ${card.value}</p>
        <p><strong>Expiry:</strong> ${card.expiry}</p>
        <img src="${card.image}" alt="${card.brand}" width="300"/>
        <p>Enjoy your gift!</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Gift card email sent to:", to);
  } catch (error) {
    console.error("❌ Email sending failed:", error);
  }
}
