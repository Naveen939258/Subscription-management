import React, { useEffect, useState } from "react";
import axios from "axios";
import "./CSS/Billing.css";

const Billing = () => {
  const [latestSub, setLatestSub] = useState(null);
  const token = localStorage.getItem("token") || "";

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const res = await axios.get("http://localhost:5000/subscription/my", {
          headers: { "auth-token": token },
        });
        const data = res.data || [];

        if (data.length > 0) {
          const sorted = data.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
          setLatestSub(sorted[0]);
        }
      } catch (err) {
        console.error(err);
        alert("Failed to load billing details");
      }
    };

    fetchSubscriptions();
  }, [token]);

  return (
    <div className="billing-page">
      <h1 className="billing-title">✅ Payment Confirmed!</h1>

      {!latestSub ? (
        <p>No subscription found</p>
      ) : (
        <div className="order-card">
          <h3>📦 Order ID: {latestSub.razorpayOrderId}</h3>
          <p><b>Connection:</b> {latestSub.connectionId?.name}</p>
          <p><b>Plan:</b> {latestSub.plan} ({latestSub.duration})</p>

          {/* Show original vs final amount */}
          <p><b>Plan Price:</b> ₹{latestSub.planPrice}</p>
          <p><b>Final Paid:</b> ₹{latestSub.finalAmountPaid}</p>

          <p><b>Payment ID:</b> {latestSub.razorpayPaymentId}</p>
          <p><b>Status:</b> {latestSub.status === "Active" ? "✅ Active" : `❌ ${latestSub.status}`}</p>

          <p>
            <b>Start:</b>{" "}
            {latestSub.startDate
              ? new Date(latestSub.startDate).toLocaleDateString()
              : "— (Pending activation)"}
          </p>
          <p>
            <b>End:</b>{" "}
            {latestSub.endDate
              ? new Date(latestSub.endDate).toLocaleDateString()
              : "—"}
          </p>

          {latestSub.promoCode && <p><b>Promo Applied:</b> {latestSub.promoCode}</p>}
          {latestSub.creditApplied > 0 && (
            <p><b>Credit Used:</b> ₹{latestSub.creditApplied}</p>
          )}

          <a href="/" className="btn-home">🏠 Go to Home</a>
        </div>
      )}
    </div>
  );
};

export default Billing;
