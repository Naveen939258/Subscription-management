// src/components/Dashboard.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import "./CSS/Dashboard.css";

const API_BASE = process.env.REACT_APP_API_URL || "https://subscription-management-bn9p.onrender.com";

const Dashboard = () => {
  const [user, setUser] = useState({ name: "Guest", email: "" });
  const [connections, setConnections] = useState([]);
  const [plans, setPlans] = useState([]); // ✅ all plans for fallback
  const [stats, setStats] = useState({
    totalConnections: 0,
    activeSubs: 0,
    usage: 0,
    offers: 0,
  });
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    // Fetch user
    const fetchUser = async () => {
      try {
        const res = await axios.get(`${API_BASE}/auth/me`, {
          headers: { "auth-token": token },
        });
        setUser({ name: res.data.username, email: res.data.email });
      } catch {
        setUser({ name: "Demo User", email: "demo@example.com" });
      }
    };

    // Fetch connections
    const fetchConnections = async () => {
      try {
        const res = await axios.get(`${API_BASE}/connection/my`, {
          headers: { "auth-token": token },
        });
        setConnections(res.data || []);
        const activeSubs = res.data.filter((c) => c.currentSubscription).length;
        setStats((prev) => ({
          ...prev,
          totalConnections: res.data.length,
          activeSubs,
        }));
      } catch {
        // fallback demo
        setConnections([
          {
            _id: "demo1",
            name: "Home WiFi",
            type: "fiber",
            status: "Active",
            currentSubscription: {
              plan: "Standard",
              price: 1599,
              startDate: "2025-09-17",
              endDate: "2026-09-17",
              status: "Active",
              download: "100 Mbps",
              upload: "50 Mbps",
              data: "Unlimited",
              features: ["Free Router", "24/7 Support"],
            },
          },
        ]);
        setStats((prev) => ({
          ...prev,
          totalConnections: 1,
          activeSubs: 1,
        }));
      }
    };

    // Fetch all plans (for fallback info)
    const fetchPlans = async () => {
      try {
        const res = await axios.get(`${API_BASE}/plans`);
        setPlans(res.data || []);
      } catch {
        setPlans([]);
      }
    };

    // Fetch offers
    const fetchOffersCount = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/discounts`, {
          headers: { "auth-token": token },
        });
        const activeOffers = res.data.filter((o) => o.isActive).length;
        setStats((prev) => ({ ...prev, offers: activeOffers }));
      } catch {
        setStats((prev) => ({ ...prev, offers: 0 }));
      }
    };

    // Fetch usage
    const fetchUsage = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/usage`, {
          headers: { "auth-token": token },
        });
        setStats((prev) => ({ ...prev, usage: res.data.usage }));
      } catch {
        setStats((prev) => ({ ...prev, usage: 85.4 }));
      }
    };

    // Fetch AI Recommendations
    const fetchRecs = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/recommendations`, {
          headers: { "auth-token": token },
        });
        setRecommendations(res.data || []);
      } catch {
        setRecommendations([]);
      }
    };

    fetchUser();
    fetchConnections();
    fetchPlans();
    fetchOffersCount();
    fetchUsage();
    fetchRecs();
  }, []);

  // Days left & billing
  const getDaysLeft = (endDate) => {
    if (!endDate) return 0;
    const end = new Date(endDate);
    const today = new Date();
    return Math.max(0, Math.ceil((end - today) / (1000 * 60 * 60 * 24)));
  };

  const getNextBilling = (endDate) => {
    if (!endDate) return "N/A";
    return new Date(endDate).toLocaleDateString();
  };

  const getCircleColor = (days) => {
    if (days > 15) return "green";
    if (days > 7) return "orange";
    return "red";
  };

  // Get plan details from plan list if subscription lacks info
  const getPlanDetails = (planName) => plans.find((p) => p.name === planName);

  return (
    <div className="dashboard-page">
      {/* Top Section */}
      <div className="dashboard-top">
        <div className="welcome-text">
          <h1>Welcome back, {user.name}!</h1>
          <p>Manage all your broadband & mobile connections in one place</p>
        </div>
        <div className="user-info">
          <h3>{user.name}</h3>
          <p>{user.email}</p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <h2>{stats.totalConnections}</h2>
          <p>Total Connections</p>
        </div>
        <div className="stat-card green">
          <h2>{stats.activeSubs}</h2>
          <p>Active Plans</p>
        </div>
        <div className="stat-card yellow">
          <h2>{stats.usage} GB</h2>
          <p>This Month’s Usage</p>
        </div>
        <div className="stat-card cyan">
          <h2>{stats.offers}</h2>
          <p>Available Offers</p>
        </div>
      </div>

      {/* Connections & Plans Section */}
      <div className="connections-section">
        <h2>Your Connections & Plans</h2>
        {connections.length === 0 ? (
          <p style={{ color: "#94a3b8" }}>No active connections</p>
        ) : (
          connections.map((conn) => {
            const sub = conn.currentSubscription;
            const daysLeft = sub ? getDaysLeft(sub.endDate) : 0;
            const subPlan = sub ? getPlanDetails(sub.plan) : null;

            return (
              <div key={conn._id} className="plan-box">
                {/* Progress Circle */}
                <div
                  className={`circle-progress ${getCircleColor(daysLeft)}`}
                  style={{ "--target-progress": (daysLeft / 30) * 100 }}
                >
                  <span>{daysLeft} days</span>
                </div>

                {/* Plan Details */}
                <div className="plan-details">
                  <h3>
                    {conn.name} – {sub ? sub.plan : "No Active Plan"}
                  </h3>
                  {sub ? (
                    <>
                      <p className="plan-price">₹{sub.planPrice}</p>
                      <p>
                        {new Date(sub.startDate).toLocaleDateString()} –{" "}
                        {new Date(sub.endDate).toLocaleDateString()}
                      </p>
                      <p><b>Status:</b> {sub.status}</p>
                      <p>
                        <b>Download:</b>{" "}
                        {sub.download || subPlan?.speed || "—"} Mbps
                      </p>
                      <p>
                        <b>Upload:</b>{" "}
                        {sub.upload || subPlan?.upload || "50"} Mbps
                      </p>
                      <p>
                        <b>Data:</b> {sub.data || subPlan?.dataQuota || "—"}
                      </p>
                      {(sub.features?.length > 0 || subPlan?.features?.length > 0) && (
                        <ul className="plan-features">
                          {(sub.features || subPlan.features).map((f, i) => (
                            <li key={i}>✔ {f}</li>
                          ))}
                        </ul>
                      )}
                      <p className="billing-date">
                        <b>Next Billing Date:</b> {getNextBilling(sub.endDate)}
                      </p>
                    </>
                  ) : (
                    <p>No active subscription</p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* AI Recommendations */}
      <div className="recommendations">
        <h2>
          AI Personalized Recommendations <span className="badge">SMART</span>
        </h2>
        <div className="recs-grid">
          {recommendations.length === 0 ? (
            <p style={{ color: "#94a3b8" }}>No recommendations available</p>
          ) : (
            recommendations.map((rec, i) => (
              <div key={i} className="rec-card">
                <div className="rec-header">
                  <span className="match">{rec.match}% match</span>
                </div>
                <h3>{rec.name}</h3>
                <p>
                  {rec.speed} | {rec.data}
                </p>
                <button className="upgrade-btn">Upgrade</button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
