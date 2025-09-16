const express = require("express");
const axios = require("axios");
const router = express.Router();

const { SEPAY_API_BASE } = process.env;

// Endpoint tạo payment
router.post("/create-payment", async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Số tiền không hợp lệ" });
    }

    // Ví dụ gọi API Sepay (thay URL theo tài liệu Sepay)
    const response = await axios.post(
      "https://api.sepay.vn/v1/transactions/create",
      {
        amount,
        description: `Thanh toán đơn hàng - ${Date.now()}`,
      },
      {
        headers: {
          Authorization: `Bearer ${SEPAY_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return res.json(response.data);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({
      message: "Lỗi tạo payment",
      error: error.response?.data || error.message,
    });
  }
});

module.exports = router;
