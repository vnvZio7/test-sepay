// src/components/PaymentStatus.jsx
import { useState, useEffect } from "react";
import axios from "axios";

export default function PaymentStatus({ orderCode, va_number, qr_code }) {
  const [status, setStatus] = useState("Unpaid");

  useEffect(() => {
    let poll = null;
    const fetchStatus = async () => {
      try {
        const resp = await axios.get(
          import.meta.env.VITE_BACKEND_URL + `/api/order-status/${orderCode}`
        );
        setStatus(resp.data.status);
      } catch (err) {
        console.error("Error checking status", err);
      }
    };
    fetchStatus();
    poll = setInterval(fetchStatus, 3000);

    return () => clearInterval(poll);
  }, [orderCode]);

  if (status === "Paid") {
    return <div>Thanh toán thành công!</div>;
  }

  return (
    <div>
      <h3>Thanh toán chưa hoàn tất</h3>
      <div>Số tài khoản ảo (VA): {va_number}</div>
      {qr_code && <img src={qr_code} alt="QR Code" />}
      <div>Trạng thái: {status}</div>
    </div>
  );
}
