import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "../CSS/Connections.css";

const AdminConnections = () => {
  const [connections, setConnections] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [editConn, setEditConn] = useState(null);

  const token = localStorage.getItem("token");

  // Fetch all connections
  const fetchConnections = useCallback(async () => {
  try {
    const res = await axios.get("https://subscription-management-bn9p.onrender.com/admin/connections", {
      headers: { "auth-token": token },
    });
    setConnections(res.data);
    setFiltered(res.data);
  } catch (err) {
    console.error("❌ Error fetching connections:", err);
  }
}, [token]);


  useEffect(() => {
  fetchConnections();
}, [fetchConnections]);

  // Search filter
  useEffect(() => {
    const result = connections.filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.user?.username.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(result);
  }, [search, connections]);

  // Sort by connection name
  const handleSort = () => {
    const sorted = [...filtered].sort((a, b) => {
      if (sortOrder === "asc") {
        return a.name.localeCompare(b.name);
      } else {
        return b.name.localeCompare(a.name);
      }
    });
    setFiltered(sorted);
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  // Delete connection
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this connection?")) return;
    try {
      await axios.delete(`https://subscription-management-bn9p.onrender.com/admin/connections/${id}`, {
        headers: { "auth-token": token },
      });
      fetchConnections();
    } catch (err) {
      console.error("❌ Delete failed:", err);
    }
  };

  // Update connection
  const handleUpdate = async () => {
    try {
      await axios.put(
        `https://subscription-management-bn9p.onrender.com/admin/connections/${editConn._id}`,
        editConn,
        { headers: { "auth-token": token } }
      );
      setEditConn(null);
      fetchConnections();
    } catch (err) {
      console.error("❌ Update failed:", err);
    }
  };

  // ✅ Stats
  const totalConnections = connections.length;
  const activeConnections = connections.filter((c) => c.status === "Active").length;
  const inactiveConnections = connections.filter((c) => c.status !== "Active").length;
  const withPlans = connections.filter((c) => c.currentSubscription).length;

  // ✅ Chart Data (Distribution by type)
  const typeCounts = connections.reduce((acc, c) => {
    const type = c.type || "Unknown";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(typeCounts).map(([type, count]) => ({
    name: type,
    value: count,
  }));

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AA66CC"];

  return (
    <div className="connections-page">
      {/* ✅ Summary Stats */}
      <div className="summary-cards">
        <div className="card">Total Connections <span>{totalConnections}</span></div>
        <div className="card">Active <span>{activeConnections}</span></div>
        <div className="card">Inactive <span>{inactiveConnections}</span></div>
        <div className="card">With Plan <span>{withPlans}</span></div>
      </div>

      {/* ✅ Chart */}
      <div className="chart-container">
        <h3>📊 Connection Types Distribution</h3>
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
          placeholder="Search by connection or user..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={handleSort}>
          Sort {sortOrder === "asc" ? "A-Z" : "Z-A"}
        </button>
        <button onClick={fetchConnections}>🔄 Refresh</button>
      </div>

      {/* Table */}
      <div className="connections-table-container">
        {filtered.length > 0 ? (
          <table className="connections-table">
            <thead>
              <tr>
                <th>Connection</th>
                <th>Type</th>
                <th>User</th>
                <th>Address</th>
                <th>Current Plan</th>
                <th>Status</th>
                <th>⚙ Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c._id}>
                  <td>{c.name}</td>
                  <td>{c.type}</td>
                  <td>{c.user?.username || "-"}</td>
                  <td>
                    {c.address
                      ? `${c.address.street}, ${c.address.city}`
                      : "-"}
                  </td>
                  <td>{c.currentSubscription?.plan || "-"}</td>
                  <td>{c.status || "Active"}</td>
                  <td>
                    <button onClick={() => setEditConn(c)}>✏ Edit</button>
                    <button onClick={() => handleDelete(c._id)}>🗑 Delete</button>
                    <button
                      onClick={() =>
                        window.open(`/admin/subscriptions?connection=${c._id}`)
                      }
                    >
                      📜 History
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="no-connections">No connections found</p>
        )}
      </div>

      {/* Edit Modal */}
      {editConn && (
        <div className="modal">
          <div className="modal-content">
            <h3>Edit Connection</h3>
            <input
              type="text"
              placeholder="Connection Name"
              value={editConn.name}
              onChange={(e) =>
                setEditConn({ ...editConn, name: e.target.value })
              }
            />
            <select
              value={editConn.type}
              onChange={(e) =>
                setEditConn({ ...editConn, type: e.target.value })
              }
            >
              <option value="fiber">Fiber</option>
              <option value="broadband">Broadband</option>
              <option value="mobile">Mobile</option>
            </select>
            <div className="modal-actions">
              <button onClick={() => setEditConn(null)}>Cancel</button>
              <button onClick={handleUpdate} className="save-btn">
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminConnections;
