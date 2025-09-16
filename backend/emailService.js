// emailService.js
require("dotenv").config();
const nodemailer = require("nodemailer");

// Tạo transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendEmail({ to, subject, html }) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email đã gửi:", info.response);
    return { success: true, info };
  } catch (error) {
    console.error("❌ Lỗi khi gửi email:", error);
    return { success: false, error };
  }
}

module.exports = sendEmail;
