// src/components/CreatePayment.jsx
import { useState } from "react";
import axios from "axios";

export default function CreatePayment({ onCreated }) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      setError("Invalid amount");
      return;
    }
    setLoading(true);
    try {
      const resp = await axios.post(
        import.meta.env.VITE_BACKEND_URL + "/api/create-order",
        { amount: num }
      );
      onCreated(resp.data);
    } catch (err) {
      console.error(err);
      setError("Error creating order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Số tiền:</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          step="0.01"
        />
      </div>
      <button type="submit" disabled={loading}>
        Tạo thanh toán
      </button>
      {error && <div style={{ color: "red" }}>{error}</div>}
    </form>
  );
}
