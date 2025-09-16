// sepayClient.js
const axios = require("axios");

const SEPAY_API_BASE = process.env.SEPAY_API_BASE; // e.g. https://my.sepay.vn/userapi/bidv/{bank_account_id}
const SEPAY_TOKEN = process.env.SEPAY_TOKEN;

async function createOrder(amount, orderCode, durationSeconds = 600) {
  // Tạo order mới
  const url = `${SEPAY_API_BASE}/orders`;
  const headers = {
    Authorization: `Bearer ${SEPAY_TOKEN}`,
    "Content-Type": "application/json",
  };

  const body = {
    amount: amount,
    order_code: orderCode,
    duration: durationSeconds,
    with_qrcode: true,
  };

  const resp = await axios.post(url, body, { headers });
  return resp.data; // bao gồm data.orders hoặc thông tin order mới
}

async function getOrder(orderId) {
  const url = `${SEPAY_API_BASE}/orders/${orderId}`;
  const headers = {
    Authorization: `Bearer ${SEPAY_TOKEN}`,
  };
  const resp = await axios.get(url, { headers });
  return resp.data;
}

module.exports = {
  createOrder,
  getOrder,
};
