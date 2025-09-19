import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import AddressForm from "./AddressForm.jsx";
import "./CSS/Connections.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

// --- Individual Connection Card ---
function ConnectionCard({ connection, refresh, onToggleHistory, isHistoryVisible, onEdit, onDelete }) {
  const token = localStorage.getItem("token");

  const cancelPlan = async () => {
    if (!connection.currentSubscription) return;
    try {
      await axios.put(
        `${API_BASE}/subscription/cancel/${connection.currentSubscription._id}`,
        {},
        { headers: { "auth-token": token } }
      );
      alert("✅ Plan cancelled");
      refresh();
    } catch (err) {
      alert("❌ Cancel failed");
    }
  };

  return (
    <div className="connection-card">
      <div className="card-header">
        <h3>{connection.name}</h3>
        <span className="status">{connection.status || "Active"}</span>
      </div>

      <p className="meta">Type: {connection.type}</p>
      <p className="meta">
        Address: {connection.address?.name} ({connection.address?.phone}) <br />
        {connection.address?.street}, {connection.address?.city},{" "}
        {connection.address?.state} - {connection.address?.pincode},{" "}
        {connection.address?.country}
      </p>

      <div className="sub-info">
        <div>
          <strong>Current:</strong>{" "}
          {connection.currentSubscription
            ? `${connection.currentSubscription.plan} (${connection.currentSubscription.status})`
            : "—"}
        </div>
        <div>
          <strong>Queued:</strong>{" "}
          {connection.queuedSubscription
            ? `${connection.queuedSubscription.plan} (${connection.queuedSubscription.status})`
            : "—"}
        </div>
      </div>

      <div className="card-actions">
        {/* 🔹 Upgrade / Add Plan */}
        {connection.currentSubscription?.status === "Active" ? (
          <Link
            to={`/plans?connectionId=${connection._id}&upgrade=true`}
            className="btn-primary"
          >
            Upgrade Plan
          </Link>
        ) : (
          <Link
            to={`/plans?connectionId=${connection._id}`}
            className="btn-primary"
          >
            Add / Change Plan
          </Link>
        )}

        <button className="btn-outline" onClick={() => onToggleHistory(connection)}>
          {isHistoryVisible ? "Hide History" : "View History"}
        </button>

        {connection.currentSubscription?.status === "Active" && (
          <button className="btn-danger" onClick={cancelPlan}>
            Cancel Active Plan
          </button>
        )}

        {/* 🔹 New: Edit & Delete */}
        <button className="btn-outline" onClick={() => onEdit(connection)}>
          Edit
        </button>
        <button
          className="btn-danger"
          onClick={() => {
            if (window.confirm("Are you sure you want to delete this connection?")) {
              onDelete(connection._id);
            }
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

// --- Add / Edit Connection Form ---
function AddConnectionForm({ onClose, onAdded, editingConn, onUpdated }) {
  const [form, setForm] = useState({
    name: editingConn?.name || "",
    type: editingConn?.type || "fiber",
    selectedAddress: editingConn?.address || null,
  });
  const [addresses, setAddresses] = useState([]);
  const [editingAddress, setEditingAddress] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const token = localStorage.getItem("token");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // In AddConnectionForm
const fetchAddresses = useCallback(async () => {
  try {
    const res = await axios.get(`${API_BASE}/address/list`, { headers: { "auth-token": token } });
    const addrs = res.data.addresses || [];
    setAddresses(addrs);
    if (!editingConn) {
      const defaultAddr = addrs.find((a) => a.isDefault);
      setForm((prev) => ({ ...prev, selectedAddress: defaultAddr || addrs[0] || null }));
    }
  } catch {
    alert("❌ Failed to fetch addresses");
    setAddresses([]);
    setForm((prev) => ({ ...prev, selectedAddress: null }));
  }
}, [token, editingConn]);   // ✅ dependencies

useEffect(() => {
  fetchAddresses();
}, [fetchAddresses]);        // ✅ safe now


  const handleSaveAddress = async (addr) => {
    try {
      const url = editingAddress ? `${API_BASE}/address/update/${editingAddress._id}` : `${API_BASE}/address/add`;
      const method = editingAddress ? "PUT" : "POST";
      const res = await axios({ url, method, data: addr, headers: { "auth-token": token } });
      if (res.data.success) {
        alert(editingAddress ? "Address updated" : "Address added");
        setEditingAddress(null);
        setShowAddressForm(false);
        fetchAddresses();
      }
    } catch {
      alert("❌ Failed to save address");
    }
  };

  const handleDeleteAddress = async (id) => {
    try {
      await axios.delete(`${API_BASE}/address/delete/${id}`, { headers: { "auth-token": token } });
      alert("Address deleted!");
      fetchAddresses();
    } catch {
      alert("❌ Failed to delete address");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.selectedAddress) return alert("Select or add an address first");

    try {
      if (editingConn) {
        // Update existing connection
        const res = await axios.put(
          `${API_BASE}/connection/update/${editingConn._id}`,
          { name: form.name, type: form.type, address: form.selectedAddress },
          { headers: { "auth-token": token } }
        );
        onUpdated(res.data.updated);
      } else {
        // Add new connection
        const res = await axios.post(
          `${API_BASE}/connection/add`,
          { name: form.name, type: form.type, address: form.selectedAddress },
          { headers: { "auth-token": token } }
        );
        onAdded(res.data);
      }
      onClose();
    } catch {
      alert("❌ Failed to save connection");
    }
  };

  return (
    <>
      <form className="add-form" onSubmit={handleSubmit}>
        <input name="name" placeholder="Connection Name" value={form.name} onChange={handleChange} />
        <select name="type" value={form.type} onChange={handleChange}>
          <option value="fiber">Fiber</option>
          <option value="broadband">Broadband</option>
          <option value="mobile">Mobile</option>
        </select>

        <div className="connections-address-list">
          {addresses.map((addr) => (
            <div
              key={addr._id}
              className={`address-card ${form.selectedAddress?._id === addr._id ? "selected" : ""}`}
              onClick={() => setForm({ ...form, selectedAddress: addr })}
            >
              <p>
                {addr.name}, {addr.phone} <br />
                {addr.street}, {addr.city}, {addr.state} - {addr.pincode},{" "}
                {addr.country}{" "}
                {addr.isDefault && <span className="default-tag">Default</span>}
              </p>
              <div className="address-actions">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingAddress(addr);
                    setShowAddressForm(true);
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteAddress(addr._id);
                  }}
                  style={{ marginLeft: "8px", color: "red" }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            className="btn-outline"
            onClick={() => {
              setEditingAddress(null);
              setShowAddressForm(true);
            }}
          >
            + Add New Address
          </button>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            {editingConn ? "Update Connection" : "Add Connection"}
          </button>
        </div>
      </form>

      {showAddressForm && (
        <AddressForm
          editingAddress={editingAddress}
          onSave={handleSaveAddress}
          onCancel={() => {
            setEditingAddress(null);
            setShowAddressForm(false);
          }}
        />
      )}
    </>
  );
}

// --- Main Connections Page ---
export default function ConnectionsPage() {
  const [connections, setConnections] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [editingConn, setEditingConn] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const historyRef = useRef(null);

  const fetchConnections = useCallback(async () => {
  try {
    const res = await axios.get(`${API_BASE}/connection/my`, { headers: { "auth-token": token } });
    setConnections(res.data || []);
  } catch {
    alert("❌ Failed to load connections");
  }
}, [token]);

useEffect(() => {
  fetchConnections();
}, [fetchConnections]);      // ✅ dependency included


  const toggleHistory = async (connection) => {
    if (selectedHistory === connection._id) {
      setSelectedHistory(null);
      setHistoryData([]);
      return;
    }
    try {
      const res = await axios.get(`${API_BASE}/subscription/my/${connection._id}`, {
        headers: { "auth-token": token },
      });
      setHistoryData(res.data || []);
      setSelectedHistory(connection._id);
      setTimeout(() => {
        historyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);
    } catch {
      alert("❌ Failed to load history");
    }
  };

  const handleAdded = (conn) => setConnections((prev) => [conn, ...prev]);
  const handleUpdated = (conn) =>
    setConnections((prev) => prev.map((c) => (c._id === conn._id ? conn : c)));
  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE}/connection/delete/${id}`, {
        headers: { "auth-token": token },
      });
      setConnections((prev) => prev.filter((c) => c._id !== id));
      alert("Connection deleted");
    } catch {
      alert("❌ Failed to delete connection");
    }
  };

  return (
    <div className="connections-page">
      <div className="connections-top">
        <div>
          <h1>Your Connections</h1>
          <p>Manage all your active & queued broadband connections</p>
        </div>
        <div>
          <button className="btn-outline" onClick={() => navigate("/plans")}>
            Browse Plans
          </button>
          <button
            className="btn-primary"
            onClick={() => {
              setEditingConn(null);
              setShowAdd(true);
            }}
          >
            Add Connection
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="add-box">
          <AddConnectionForm
            editingConn={editingConn}
            onClose={() => setShowAdd(false)}
            onAdded={handleAdded}
            onUpdated={handleUpdated}
          />
        </div>
      )}

      <div className="connections-grid">
        {connections.length === 0 ? (
          <div className="empty-box">
            You have no connections yet.{" "}
            <button
              onClick={() => {
                setEditingConn(null);
                setShowAdd(true);
              }}
              className="btn-link"
            >
              Add one
            </button>{" "}
            or <Link to="/plans">buy a plan</Link>.
          </div>
        ) : (
          connections.map((c) => (
            <ConnectionCard
              key={c._id}
              connection={c}
              refresh={fetchConnections}
              onToggleHistory={toggleHistory}
              isHistoryVisible={selectedHistory === c._id}
              onEdit={(conn) => {
                setEditingConn(conn);
                setShowAdd(true);
              }}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {selectedHistory && (
        <div className="history-section" ref={historyRef}>
          <h2>Subscription History</h2>
          {historyData.length === 0 ? (
            <p>No history found</p>
          ) : (
            <table className="history-table">
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Order ID</th>
                  <th>Payment ID</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Promo</th>
                </tr>
              </thead>
              <tbody>
                {historyData.map((sub) => (
                  <tr key={sub._id}>
                    <td>{sub.plan}</td>
                    <td>{sub.razorpayOrderId}</td>
                    <td>{sub.razorpayPaymentId}</td>
                    <td>₹{sub.planPrice}</td>
                    <td>{sub.status === "Active" ? "✅ Active" : `❌ ${sub.status}`}</td>
                    <td>{sub.startDate ? new Date(sub.startDate).toLocaleDateString() : "—"}</td>
                    <td>{sub.endDate ? new Date(sub.endDate).toLocaleDateString() : "—"}</td>
                    <td>{sub.promoCode || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
