// src/App.jsx
import { useState } from "react";
function App() {
  const [amount, setAmount] = useState(50000);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  async function handlePay(e) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/sepay/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Thanh toán thất bại");
      setResult(data);
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={handlePay}
        className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-sm"
      >
        <h1 className="text-lg font-semibold mb-4">Thanh toán qua Sepay</h1>
        <label className="block mb-2 text-sm font-medium">Số tiền (VND)</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full p-2 border rounded-md mb-4"
          min={1000}
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 rounded-md bg-blue-600 text-white font-medium hover:opacity-90"
        >
          {loading ? "Đang xử lý..." : "Thanh toán"}
        </button>

        {result && (
          <div className="mt-4 text-sm text-gray-700 break-words">
            {result.error ? (
              <p className="text-red-600">❌ {result.error}</p>
            ) : (
              <pre className="bg-gray-100 p-2 rounded">
                {JSON.stringify(result, null, 2)}
              </pre>
            )}
          </div>
        )}
      </form>
    </div>
  );
}

export default App;
