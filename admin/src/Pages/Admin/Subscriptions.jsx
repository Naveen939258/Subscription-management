import React, { useEffect, useState,useCallback} from "react";
import axios from "axios";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import "../CSS/Subscriptions.css";

const AdminSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedSub, setSelectedSub] = useState(null);
  const [editData, setEditData] = useState({});
  const token = localStorage.getItem("token") || "";

  // Fetch all subscriptions
  // Fetch all subscriptions
const fetchSubscriptions = useCallback(async () => {
  try {
    const res = await axios.get("https://subscription-management-bn9p.onrender.com/admin/subscriptions", {
      headers: { "auth-token": token },
    });
    setSubscriptions(res.data);
    setFiltered(res.data);
  } catch (err) {
    console.error("❌ Error fetching subscriptions:", err);
  }
}, [token]);   // <-- dependencies go here

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  // Filter & search
  useEffect(() => {
    let result = subscriptions.filter(
      (s) =>
        s.userName.toLowerCase().includes(search.toLowerCase()) ||
        s.userEmail.toLowerCase().includes(search.toLowerCase()) ||
        (s.connectionName || "").toLowerCase().includes(search.toLowerCase()) ||
        s.planName.toLowerCase().includes(search.toLowerCase())
    );

    if (statusFilter !== "All") {
      result = result.filter((s) => s.status === statusFilter);
    }

    setFiltered(result);
  }, [search, subscriptions, statusFilter]);

  // Sort by plan
  const handleSort = () => {
    const sorted = [...filtered].sort((a, b) => {
      if (sortOrder === "asc") {
        return a.planName.localeCompare(b.planName);
      } else {
        return b.planName.localeCompare(a.planName);
      }
    });
    setFiltered(sorted);
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  // Cancel subscription
  const handleCancel = async (id) => {
    try {
      await axios.delete(`https://subscription-management-bn9p.onrender.com/admin/subscription/${id}`, {
        headers: { "auth-token": token },
      });
      fetchSubscriptions();
      setSelectedSub(null);
    } catch (err) {
      console.error("❌ Failed to cancel subscription:", err);
    }
  };

  // Save edited subscription
  const handleEditSave = async () => {
    try {
      const { _id, ...data } = editData;
      await axios.put(`https://subscription-management-bn9p.onrender.com/admin/subscription/${_id}`, data, {
        headers: { "auth-token": token },
      });
      fetchSubscriptions();
      setSelectedSub(null);
      setEditData({});
    } catch (err) {
      console.error("❌ Failed to save subscription:", err);
    }
  };

  // Stats
  const totalSubs = subscriptions.length;
  const activeSubs = subscriptions.filter((s) => s.status === "Active").length;
  const cancelledSubs = subscriptions.filter((s) => s.status === "Cancelled").length;
  const expiredSubs = subscriptions.filter((s) => s.status === "Expired").length;

  // Chart Data (Plan Distribution)
  const planCounts = subscriptions.reduce((acc, s) => {
    acc[s.planName] = (acc[s.planName] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(planCounts).map(([plan, count]) => ({
    name: plan,
    value: count,
  }));

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AA66CC"];

  return (
    <div className="admin-subscriptions-page">
      <h2>All Subscriptions</h2>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="card" onClick={() => setStatusFilter("All")}>
          Total <span>{totalSubs}</span>
        </div>
        <div className="card" onClick={() => setStatusFilter("Active")}>
          Active <span>{activeSubs}</span>
        </div>
        <div className="card" onClick={() => setStatusFilter("Cancelled")}>
          Cancelled <span>{cancelledSubs}</span>
        </div>
        <div className="card" onClick={() => setStatusFilter("Expired")}>
          Expired <span>{expiredSubs}</span>
        </div>
      </div>

      {/* Chart */}
      <div className="chart-container">
        <h3>📊 Plan Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              label
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Search + Sort */}
      <div className="search-sort-container">
        <input
          type="text"
          placeholder="Search by user, email, connection or plan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={handleSort}>
          Sort {sortOrder === "asc" ? "A-Z" : "Z-A"}
        </button>
        <button onClick={fetchSubscriptions}>🔄 Refresh</button>
      </div>

      {/* Status Filter Buttons */}
      <div className="status-filter-buttons">
        {["All", "Active", "Cancelled", "Expired"].map((status) => (
          <button
            key={status}
            className={statusFilter === status ? "active" : ""}
            onClick={() => setStatusFilter(status)}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="subscription-table-container">
      <table className="subscription-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Email</th>
            <th>Connection</th>
            <th>Plan</th>
            <th>Price</th>
            <th>Paid</th>
            <th>Credit Used</th>
            <th>Status</th>
            <th>Start</th>
            <th>End</th>
            <th>Promo</th>
            <th>Payment ID</th>
            <th>⚙ Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length > 0 ? (
            filtered.map((sub) => (
              <tr key={sub._id}>
                <td>{sub.userName}</td>
                <td>{sub.userEmail}</td>
                <td>{sub.connectionName || "-"}</td>
                <td>{sub.planName}</td>
                <td>₹{sub.price}</td>
                <td>₹{sub.finalAmountPaid || "-"}</td>
                <td>{sub.creditApplied > 0 ? `₹${sub.creditApplied}` : "-"}</td>
                <td>{sub.status}</td>
                <td>{sub.startDate ? new Date(sub.startDate).toLocaleDateString() : "-"}</td>
                <td>{sub.endDate ? new Date(sub.endDate).toLocaleDateString() : "-"}</td>
                <td>{sub.promoCode || "-"}</td>
                <td>{sub.razorpayPaymentId || "-"}</td>
                <td>
                  <button
                    className="view-btn"
                    onClick={() => {
                      if (sub.status !== "Cancelled") {
                        setSelectedSub(sub);
                        setEditData(sub);
                      }
                    }}
                    disabled={sub.status === "Cancelled"}
                    style={{
                      opacity: sub.status === "Cancelled" ? 0.5 : 1,
                      cursor: sub.status === "Cancelled" ? "not-allowed" : "pointer",
                    }}
                  >
                    View / Edit
                  </button>
                  <button className="cancel-btn" onClick={() => handleCancel(sub._id)}>
                    Cancel
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="13">No subscriptions found</td>
            </tr>
          )}
        </tbody>
      </table>
      </div>

      {/* Modal */}
      {selectedSub && (
        <div className="modal-overlay" onClick={() => setSelectedSub(null)}>
          <div className="subscription-details-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Subscription</h3>
            <label>
              Plan:
              <input
                type="text"
                value={editData.planName}
                onChange={(e) => setEditData({ ...editData, planName: e.target.value })}
              />
            </label>
            <label>
              Status:
              <select
                value={editData.status}
                onChange={(e) => setEditData({ ...editData, status: e.target.value })}
              >
                <option value="Active">Active</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Expired">Expired</option>
              </select>
            </label>
            <label>
              Start Date:
              <input
                type="date"
                value={editData.startDate ? new Date(editData.startDate).toISOString().split("T")[0] : ""}
                onChange={(e) => setEditData({ ...editData, startDate: e.target.value })}
              />
            </label>
            <label>
              End Date:
              <input
                type="date"
                value={editData.endDate ? new Date(editData.endDate).toISOString().split("T")[0] : ""}
                onChange={(e) => setEditData({ ...editData, endDate: e.target.value })}
              />
            </label>
            <label>
              Promo Code:
              <input
                type="text"
                value={editData.promoCode || ""}
                onChange={(e) => setEditData({ ...editData, promoCode: e.target.value })}
              />
            </label>
            <div className="modal-actions">
              <button onClick={handleEditSave}>Save Changes</button>
              <button onClick={() => setSelectedSub(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSubscriptions;
