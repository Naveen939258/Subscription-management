import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom"; // ⬅ added useLocation
import "./CSS/Plans.css";

const UserPlans = () => {
  const [plans, setPlans] = useState([]);
  const [connections, setConnections] = useState([]);
  const [compareList, setCompareList] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectingConnection, setSelectingConnection] = useState(null);

  const navigate = useNavigate();
  const location = useLocation(); // ⬅ capture query params
  const token = localStorage.getItem("token");

  // --- detect upgrade mode ---
  const queryParams = new URLSearchParams(location.search);
  const upgradeMode = queryParams.get("upgrade") === "true";
  const preSelectedConnectionId = queryParams.get("connectionId");

  // --- Fetch Plans ---
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await axios.get("http://localhost:5000/plans");
        setPlans(res.data);
      } catch (err) {
        console.error("❌ Error fetching plans:", err.message);
        alert("❌ Unable to load plans");
      }
    };
    fetchPlans();
  }, []);

  // --- Fetch User Connections ---
  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const res = await axios.get("http://localhost:5000/connection/my", {
          headers: { "auth-token": token },
        });
        setConnections(res.data || []);
      } catch (err) {
        console.error("❌ Error fetching connections:", err.message);
      }
    };
    fetchConnections();
  }, [token]);

  const toggleCompare = (plan) => {
    if (compareList.find((p) => p._id === plan._id)) {
      setCompareList(compareList.filter((p) => p._id !== plan._id));
    } else {
      setCompareList([...compareList, plan]);
    }
  };

  // --- Handle Subscribe / Upgrade ---
  const handleSubscribe = (planId) => {
    if (connections.length === 0) {
      alert("Please add a connection first!");
      navigate("/connections");
      return;
    }

    // If coming from Upgrade, skip modal and use preselected connection
    if (upgradeMode && preSelectedConnectionId) {
      navigate(
        `/subscribe/${planId}?connectionId=${preSelectedConnectionId}&upgrade=true`
      );
      return;
    }

    // otherwise show connection selection modal
    setSelectingConnection(planId);
  };

  const confirmConnection = (connectionId) => {
    navigate(`/subscribe/${selectingConnection}?connectionId=${connectionId}`);
  };

  return (
    <div className="plans-page">
      {/* Header */}
      <div className="plans-header">
        <h2>{upgradeMode ? "Upgrade Your Plan" : "Our Broadband Plans"}</h2>
        <div className="top-tabs">
          <button
            className={activeTab === "all" ? "active" : ""}
            onClick={() => setActiveTab("all")}
          >
            All Plans
          </button>
          <button
            className={`${activeTab === "compare" ? "active" : ""} ${
              compareList.length > 0 ? "highlight" : ""
            }`}
            onClick={() => setActiveTab("compare")}
          >
            Compare Plans ({compareList.length})
          </button>
        </div>
      </div>

      {/* Plans */}
      {activeTab === "all" && (
        <div className="plans-grid">
          {plans.map((plan) => (
            <div key={plan._id} className="plan-card">
              <div className="plan-card-top">
                <h3>{plan.name}</h3>
                <p className="plan-type">{plan.type}</p>
                <h2 className="plan-price">
                  ₹{plan.price}/{plan.duration}
                </h2>
              </div>
              <div className="plan-card-bottom">
                <p>
                  <b>Download:</b> {plan.speed} Mbps
                </p>
                <p>
                  <b>Upload:</b> {plan.upload || "50 Mbps"}
                </p>
                <p>
                  <b>Data:</b> {plan.dataQuota}
                </p>
                <p>
                  <b>Validity:</b> {plan.duration}
                </p>
                <p className="plan-desc">{plan.description}</p>

                {plan.features?.length > 0 && (
                  <ul className="plan-features">
                    {plan.features.map((f, i) => (
                      <li key={i}>✔ {f}</li>
                    ))}
                  </ul>
                )}

                <div className="plan-actions">
                  <button
                    className="subscribe-btn"
                    onClick={() => handleSubscribe(plan._id)}
                  >
                    {upgradeMode ? "Upgrade" : "Subscribe"}
                  </button>
                  <button
                    className="compare-btn"
                    onClick={() => toggleCompare(plan)}
                  >
                    {compareList.find((p) => p._id === plan._id)
                      ? "Remove"
                      : "Add to Compare"}
                  </button>
                  <button
                    className="details-btn"
                    onClick={() => setSelectedPlan(plan)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Compare */}
      {activeTab === "compare" && compareList.length >= 2 ? (
        <div className="plans-grid">
          {compareList.map((plan) => (
            <div key={plan._id} className="plan-card">
              <div className="plan-card-top">
                <h3>{plan.name}</h3>
                <h2 className="plan-price">
                  ₹{plan.price}/{plan.duration}
                </h2>
              </div>
              <div className="plan-card-bottom">
                <p>
                  <b>Download:</b> {plan.speed} Mbps
                </p>
                <p>
                  <b>Upload:</b> {plan.upload || "50 Mbps"}
                </p>
                <p>
                  <b>Data:</b> {plan.dataQuota}
                </p>
                <p>
                  <b>Validity:</b> {plan.duration}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        activeTab === "compare" && (
          <p style={{ textAlign: "center", marginTop: "20px" }}>
            ⚠️ Please select at least 2 plans to compare.
          </p>
        )
      )}

      {/* Details Modal */}
      {selectedPlan && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{selectedPlan.name}</h3>
              <button onClick={() => setSelectedPlan(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <h2 className="plan-price">
                ₹{selectedPlan.price}/{selectedPlan.duration}
              </h2>
              <p>
                <b>Download:</b> {selectedPlan.speed} Mbps
              </p>
              <p>
                <b>Upload:</b> {selectedPlan.upload || "50 Mbps"}
              </p>
              <p>
                <b>Data:</b> {selectedPlan.dataQuota}
              </p>
              <p>
                <b>Validity:</b> {selectedPlan.duration}
              </p>
              <p className="plan-desc">{selectedPlan.description}</p>

              {selectedPlan.features?.length > 0 && (
                <ul className="plan-features">
                  {selectedPlan.features.map((f, i) => (
                    <li key={i}>✔ {f}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="modal-actions">
              <button
                className="subscribe-btn"
                onClick={() => handleSubscribe(selectedPlan._id)}
              >
                {upgradeMode ? "Upgrade" : "Subscribe"}
              </button>
              <button
                className="cancel-btn"
                onClick={() => setSelectedPlan(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connection Selection Modal */}
      {selectingConnection && !upgradeMode && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Select Connection</h3>
              <button onClick={() => setSelectingConnection(null)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              {connections.map((c) => (
                <div
                  key={c._id}
                  className="connection-option"
                  onClick={() => confirmConnection(c._id)}
                  style={{
                    border: "1px solid #ccc",
                    padding: "10px",
                    margin: "5px 0",
                    cursor: "pointer",
                  }}
                >
                  <strong>{c.name}</strong> - {c.type} (
                  {c.currentSubscription
                    ? `${c.currentSubscription.plan} (${c.currentSubscription.status})`
                    : "No active plan"}
                  )
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setSelectingConnection(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserPlans;
