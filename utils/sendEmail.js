import nodemailer from "nodemailer";

export const sendGiftCardEmail = async (email, card) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Gift Card Store" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🎁 Your ${card.brand} Gift Card`,
      html: `
        <h2>Hi!</h2>
        <p>Thank you for your payment. Here’s your gift card:</p>
        <p><strong>${card.brand}</strong> worth <strong>${card.value}</strong></p>
        <p>Expiry: ${card.expiry}</p>
        <br/>
        <img src="${process.env.FRONTEND_URL}${card.image}" alt="Gift Card" style="max-width:400px;border-radius:10px;">
        <br/>
        <a href="${process.env.FRONTEND_URL}${card.image}" download>⬇️ Download Gift Card</a>
        <br/><br/>
        <p>Best,<br/>Gift Card Store Team</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Gift card sent to ${email}`);
  } catch (err) {
    console.error("❌ Email send error:", err);
  }
};
