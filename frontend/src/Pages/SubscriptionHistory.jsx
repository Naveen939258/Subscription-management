import React, { useEffect, useState } from "react";
import axios from "axios";
import "./CSS/SubscriptionHistory.css";

const SubscriptionHistory = () => {
  const [history, setHistory] = useState([]);
  const token = localStorage.getItem("token") || "";

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get("https://subscription-management-bn9p.onrender.com/subscription/my", {
          headers: { "auth-token": token },
        });
        setHistory(res.data || []);
      } catch (err) {
        console.error(err);
        alert("Failed to fetch subscription history");
      }
    };

    fetchHistory();
  }, [token]);

  return (
    <div className="history-page">
      <h1 className="history-title">📜 My Subscription History</h1>
      {history.length === 0 ? (
        <p>No subscriptions found</p>
      ) : (
        <table className="history-table">
          <thead>
            <tr>
              <th>Connection</th>
              <th>Plan</th>
              <th>Order ID</th>
              <th>Payment ID</th>
              <th>Plan Price</th>
              <th>Final Paid</th>
              <th>Status</th>
              <th>Start</th>
              <th>End</th>
              <th>Promo</th>
              <th>Credit Used</th>
            </tr>
          </thead>
          <tbody>
            {history.map((sub) => (
              <tr key={sub._id}>
                <td>{sub.connectionId?.name || "—"}</td>
                <td>{sub.plan}</td>
                <td>{sub.razorpayOrderId}</td>
                <td>{sub.razorpayPaymentId}</td>
                <td>₹{sub.planPrice}</td>
                <td>₹{sub.finalAmountPaid}</td>
                <td>
                  {sub.status === "Active" ? "✅ Active" : `❌ ${sub.status}`}
                </td>
                <td>
                  {sub.startDate
                    ? new Date(sub.startDate).toLocaleDateString()
                    : "—"}
                </td>
                <td>
                  {sub.endDate
                    ? new Date(sub.endDate).toLocaleDateString()
                    : "—"}
                </td>
                <td>{sub.promoCode || "-"}</td>
                <td>{sub.creditApplied > 0 ? `₹${sub.creditApplied}` : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default SubscriptionHistory;
