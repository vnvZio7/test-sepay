// src/App.jsx
import { useState } from "react";
import CreatePayment from "./components/CreatePayment";
import PaymentStatus from "./components/PaymentStatus";

function App() {
  const [order, setOrder] = useState(null);

  return (
    <div style={{ padding: "2rem" }}>
      {!order && <CreatePayment onCreated={setOrder} />}
      {order && (
        <PaymentStatus
          orderCode={order.orderCode}
          va_number={order.va_number}
          qr_code={order.qr_code}
        />
      )}
    </div>
  );
}

export default App;
