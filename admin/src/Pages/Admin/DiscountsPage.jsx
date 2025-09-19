import React, { useEffect, useState } from "react";
import axios from "axios";
import { Plus, Tag } from "lucide-react";
import "../CSS/DiscountsPage.css";

const DiscountsPage = () => {
  const [discounts, setDiscounts] = useState([]);
  const [stats, setStats] = useState({ active: 0, totalUsage: 0, totalRevenue: 0, avgConversion: 0 });
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: "",
    code: "",
    type: "percentage",
    value: "",
    description: "",
    isActive: true,
  });

  useEffect(() => {
    fetchDiscounts();
    fetchStats();
  }, []);

  const fetchDiscounts = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/discounts");
      setDiscounts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/discounts/stats");
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!form.title || !form.code || !form.type || !form.value) {
        alert("⚠ Please fill all required fields");
        return;
      }

      const payload = { ...form, value: Number(form.value) };

      const token = localStorage.getItem("token");
      if (editingId) {
        await axios.put(`http://localhost:5000/api/discounts/${editingId}`, payload, {
          headers: { "auth-token": token },
        });
        alert("✅ Discount updated successfully");
      } else {
        await axios.post("http://localhost:5000/api/discounts", payload, {
          headers: { "auth-token": token },
        });
        alert("✅ Discount created successfully");
      }

      setForm({
        title: "",
        code: "",
        type: "percentage",
        value: "",
        description: "",
        isActive: true,
      });
      setEditingId(null);
      setShowModal(false);
      fetchDiscounts();
      fetchStats();
    } catch (err) {
      console.error(err.response?.data || err.message);
      alert("❌ Failed to save discount: " + (err.response?.data?.error || err.message));
    }
  };

  const handleEdit = (discount) => {
    setForm({
      title: discount.title,
      code: discount.code,
      type: discount.type,
      value: discount.value,
      description: discount.description || "",
      isActive: discount.isActive,
    });
    setEditingId(discount._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/discounts/${id}`, {
        headers: { "auth-token": token },
      });
      setDiscounts((prev) => prev.filter((d) => d._id !== id));
      alert("🗑 Discount deleted successfully");
      fetchStats();
    } catch (err) {
      console.error(err.response?.data || err.message);
      alert("❌ Failed to delete discount: " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="discounts-page">
      {/* Header */}
      <div className="discounts-header">
        <h1>Discounts Management</h1>
        <button onClick={() => setShowModal(true)}>
          <Plus size={18} className="icon" /> Create Discount
        </button>
      </div>
      <p className="discounts-subtext">Create and manage promotional discounts and offers</p>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card active">
          <h2>{stats.active}</h2>
          <p>Active Discounts</p>
        </div>
        <div className="stat-card usage">
          <h2>{stats.totalUsage}</h2>
          <p>Total Usage</p>
        </div>
        <div className="stat-card revenue">
          <h2>₹{stats.totalRevenue.toLocaleString()}</h2>
          <p>Revenue Generated</p>
        </div>
        <div className="stat-card conversion">
          <h2>{stats.avgConversion}%</h2>
          <p>Avg Conversion Rate</p>
        </div>
      </div>

      {/* Discounts Grid */}
      <div className="discounts-grid">
        {discounts.length > 0 ? discounts.map((d) => (
          <div key={d._id} className="discount-card">
            <h2>{d.title}</h2>
            <p className="discount-value">
              <Tag size={18} className="tag-icon" />
              {d.type === "percentage" ? (
                <>
                  <span>{d.value}</span>
                  <span className="symbol">%</span>
                </>
              ) : (
                <>
                  <span className="symbol">₹</span>
                  <span>{d.value}</span>
                </>
              )}
            </p>
            <span className="discount-code">{d.code}</span>
            <p className="discount-desc">{d.description}</p>
            <div className="plan-actions" style={{ marginTop: "12px" }}>
              <button className="edit-btn" onClick={() => handleEdit(d)}>Edit</button>
              <button className="delete-btn" onClick={() => handleDelete(d._id)}>Delete</button>
            </div>
          </div>
        )) : (
          <p>No discounts available</p>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingId ? "Edit Discount" : "Create Discount"}</h3>
              <button onClick={() => setShowModal(false)}>✖</button>
            </div>
            <form className="plan-form" onSubmit={handleSubmit}>
              <input name="title" placeholder="Discount Title" value={form.title} onChange={handleChange} required />
              <input name="code" placeholder="Discount Code" value={form.code} onChange={handleChange} required />
              <select name="type" value={form.type} onChange={handleChange} required>
                <option value="percentage">Percentage</option>
                <option value="flat">Flat</option>
              </select>
              <input type="number" name="value" placeholder="Value" value={form.value} onChange={handleChange} required />
              <textarea name="description" placeholder="Description" value={form.description} onChange={handleChange}></textarea>
              <label>
                <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} /> Active
              </label>
              <button type="submit">{editingId ? "Update Discount" : "Create Discount"}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscountsPage;
