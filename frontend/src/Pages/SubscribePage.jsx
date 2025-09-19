// src/pages/SubscribePage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./CSS/SubscribePage.css";

const API_BASE = process.env.REACT_APP_API_URL || "https://subscription-management-bn9p.onrender.com";

const SubscribePage = () => {
  const { planId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  const [plan, setPlan] = useState(null);
  const [connectionId, setConnectionId] = useState(null);
  const [connectionName, setConnectionName] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUpgrade, setIsUpgrade] = useState(false);
  const [credit, setCredit] = useState(0); // For upgrades

  // Extract query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const connId = params.get("connectionId");
    setConnectionId(connId);
    setIsUpgrade(params.get("upgrade") === "true");
  }, [location.search]);

  // Fetch plan details
  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const res = await axios.get(`${API_BASE}/plans`);
        const found = res.data.find((p) => p._id === planId);
        setPlan(found);
      } catch (err) {
        console.error(err);
        alert("Failed to load plan");
      }
    };
    if (planId) fetchPlan();
  }, [planId]);

  // Fetch connection details
  useEffect(() => {
    if (!connectionId) return;

    const fetchConnection = async () => {
      try {
        const res = await axios.get(`${API_BASE}/connection/my`, {
          headers: { "auth-token": token },
        });
        const conn = res.data.find((c) => c._id === connectionId);
        if (conn) setConnectionName(conn.name);
      } catch (err) {
        console.error(err);
        alert("Failed to load connection");
      }
    };
    fetchConnection();
  }, [connectionId, token]);

  // Apply promo code
  const applyPromo = async () => {
    if (!plan) return;
    try {
      const res = await axios.post(
        `${API_BASE}/api/discounts/apply`,
        { code: promoCode, orderAmount: plan.price },
        { headers: { "auth-token": token } }
      );
      if (res.data.success) {
        setPromoDiscount(res.data.discountAmount);
        alert(`✅ Promo applied! Discount ₹${res.data.discountAmount}`);
      } else {
        setPromoDiscount(0);
        alert("❌ Invalid promo code");
      }
    } catch (err) {
      console.error(err);
      alert("❌ Promo code error");
    }
  };

  // Handle Razorpay Payment
  const handlePayment = async () => {
    if (!connectionId) {
      alert("❌ Please select a connection first");
      return;
    }
    if (!window.Razorpay) {
      alert(
        "Razorpay SDK not loaded. Add <script src='https://checkout.razorpay.com/v1/checkout.js'></script> in index.html"
      );
      return;
    }

    setIsProcessing(true);
    try {
      const orderUrl = isUpgrade
        ? `${API_BASE}/subscription/upgrade/create-order`
        : `${API_BASE}/subscription/create-order`;

      // Include promoCode for both create-order endpoints
      const payload = isUpgrade
        ? { connectionId, newPlanId: planId, promoCode }
        : { connectionId, planId, promoCode };

      const orderRes = await axios.post(orderUrl, payload, {
        headers: { "auth-token": token },
      });

      const { order, key, finalAmount, credit: orderCredit } = orderRes.data;
      if (!order?.id) throw new Error("Order not created");

      // Save credit from backend (only for upgrades)
      if (isUpgrade) setCredit(orderCredit || 0);

      const options = {
        key,
        amount: order.amount,
        currency: "INR",
        name: "Subscription Service",
        description: isUpgrade ? "Upgrade Plan" : "New Subscription",
        order_id: order.id,
        prefill: {
          name: "Customer Name",
          email: "customer@example.com",
          contact: "9999999999",
        },
        theme: { color: "#0f52ba" },
        handler: async function (response) {
          try {
            const verifyUrl = isUpgrade
              ? `${API_BASE}/subscription/upgrade/verify`
              : `${API_BASE}/subscription/verify`;

            const verifyPayload = isUpgrade
              ? {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  connectionId,
                  newPlanId: planId,
                  promoCode,
                }
              : {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  connectionId,
                  planId,
                  promoCode,
                  finalAmount,
                };

            const verifyRes = await axios.post(verifyUrl, verifyPayload, {
              headers: { "auth-token": token },
            });

            if (verifyRes.data.success) {
              alert(
                isUpgrade
                  ? "✅ Plan upgraded successfully!"
                  : "✅ Subscription successful!"
              );
              navigate("/billing");
            } else {
              alert("❌ Payment verification failed");
            }
          } catch (err) {
            console.error("Verify API error:", err);
            alert("❌ Verification failed");
          } finally {
            setIsProcessing(false);
          }
        },
        modal: { ondismiss: () => setIsProcessing(false) },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (err) => {
        console.error("Payment failed:", err);
        alert(err?.error?.description || "Payment failed");
        setIsProcessing(false);
      });

      rzp.open();
    } catch (err) {
      console.error(err);
      alert(err.message || "Payment failed");
      setIsProcessing(false);
    }
  };

  if (!plan) return <p>Loading plan...</p>;

  const finalAmount = Math.max(0, plan.price - promoDiscount - (isUpgrade ? credit : 0));

  return (
    <div className="subscribe-container">
      {/* Left Section */}
      <div className="plan-card1">
        <h2 className="plan-title">
          {isUpgrade ? "Upgrade Details" : "Subscription Details"}
        </h2>
        <h4>
          <b>Connection:</b> {connectionName || "Loading..."}
        </h4>
        <p><b>Plan:</b> {plan.name}</p>
        <p><b>Speed:</b> {plan.speed} Mbps</p>
        <p><b>Data:</b> {plan.dataQuota}</p>
        <p><b>Duration:</b> {plan.duration}</p>
      </div>

      {/* Right Section */}
      <div className="order-summary">
        <h2>Order Summary</h2>
        <div className="summary-row">
          <span>Base Price</span>
          <span>₹{plan.price}</span>
        </div>
        {isUpgrade && credit > 0 && (
          <div className="summary-row">
            <span>Credit</span>
            <span className="credit">- ₹{credit}</span>
          </div>
        )}
        {promoDiscount > 0 && (
          <div className="summary-row">
            <span>Discount</span>
            <span className="discount">- ₹{promoDiscount}</span>
          </div>
        )}
        <hr />
        <div className="summary-row total">
          <span>To Pay</span>
          <span>₹{finalAmount}</span>
        </div>

        <div className="promo-box">
          <input
            type="text"
            placeholder="Enter Promo Code"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
          />
          <button onClick={applyPromo}>Apply</button>
        </div>

        <button
          className="pay-btn"
          onClick={handlePayment}
          disabled={isProcessing}
        >
          {isProcessing
            ? "Processing..."
            : isUpgrade
            ? `Pay & Upgrade ₹${finalAmount}`
            : `Proceed to Pay ₹${finalAmount}`}
        </button>
      </div>
    </div>
  );
};

export default SubscribePage;
