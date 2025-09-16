const express = require("express");
const axios = require("axios");
const sendEmail = require("../emailService");
const router = express.Router();

// 2. Webhook từ Sepay
router.post("/webhook", async (req, res) => {
  const data = req.body;
  const to = "21012100@st.phenikaa-uni.edu.vn";
  const subject = "Xác nhận thanh toán thành công";
  const html = `
    <h2>Thanh toán thành công</h2>
    <p>Xin chào,</p>
    <p>Chúng tôi xác nhận bạn đã thanh toán thành công đơn hàng <strong>${
      data.code
    }</strong>.</p>
    <p><strong>Số tiền:</strong> ${data.transferAmount.toLocaleString()} VNĐ</p>
    <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
  `;
  if (data) {
    console.log(`✅ Thanh toán thành công: ${data.transferAmount} VND`);
    await sendEmail({ to, subject, html });
  } else {
    console.log(`✅ Thanh toán that bai!`);
  }

  res.status(200).json({ success: true, message: "OK" });
});

module.exports = router;
