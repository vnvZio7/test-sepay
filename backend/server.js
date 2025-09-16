// index.js
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const { createOrder, getOrder } = require("./sepayClient");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3001;

// Lưu tạm trạng thái đơn hàng trong memory (vì ko dùng DB)
const orders = {};
// orders[orderCode] = { status: 'Unpaid', amount, va_number, qr_code_url?, etc. }

app.post("/api/create-order", async (req, res) => {
  const { amount } = req.body;
  if (!amount || typeof amount !== "number" || amount <= 0) {
    return res.status(400).json({ error: "Invalid amount" });
  }
  // tạo mã đơn hàng
  const orderCode = `ORD-${Date.now()}`;
  try {
    const resp = await createOrder(amount, orderCode);
    // resp.data.orders hoặc resp.data
    const order = resp.data;
    // order có các trường như: id, order_code, amount, status, va_number, status, expired_at, plus qr nếu with_qrcode=true
    // lưu tạm
    orders[orderCode] = {
      status: order.status || "Unpaid",
      amount: order.amount,
      orderId: order.id,
      va_number: order.va_number,
      qr_code: order.qrcode_url || order.va_qr_url || null, // tùy SePay API trả về
    };
    return res.json({ orderCode, ...orders[orderCode] });
  } catch (err) {
    console.error("Error createOrder", err.response?.data || err.message);
    return res.status(500).json({ error: "SePay create order failed" });
  }
});

app.get("/api/order-status/:orderCode", (req, res) => {
  const { orderCode } = req.params;
  const order = orders[orderCode];
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json({ status: order.status });
});

// Webhook endpoint
app.post("/api/webhook", (req, res) => {
  const data = req.body;
  console.log("Webhook received:", data);
  // SePay gửi thông tin giao dịch, bạn phải parse lấy mã đơn hàng từ nội dung thanh toán hoặc field nào đó
  // Theo docs, SePay hỗ trợ lọc theo content code thanh toán. :contentReference[oaicite:3]{index=3}
  // Giả sử trường `description` hoặc `transaction description` có chứa order_code
  const { gateway, transactionDate, amount, id: txId, content } = data;

  // Giả sử content chứa mã orderCode như ORD-123456
  let orderCodeFound = null;
  if (content && typeof content === "string") {
    // tìm chuỗi bắt đầu với "ORD-" ví dụ
    const match = content.match(/ORD-\d+/);
    if (match) orderCodeFound = match[0];
  }

  if (orderCodeFound && orders[orderCodeFound]) {
    orders[orderCodeFound].status = "Paid";
  }

  // Trả về 200 để SePay biết bạn đã nhận webhook
  res.status(200).json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
