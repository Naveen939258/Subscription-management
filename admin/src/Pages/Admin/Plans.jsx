import React, { useEffect, useState } from "react";
import axios from "axios";
import "../CSS/Plans.css";

const Plans = () => {
  const [plans, setPlans] = useState([]);
  const [stats, setStats] = useState({ totalSubscribers: 0, monthlyRevenue: 0 });
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "",
    speed: "",
    dataQuota: "",
    price: "",
    duration: "",
    description: "",
    features: "",
  });
  const [editingId, setEditingId] = useState(null);

  // Fetch plans
  const fetchPlans = async () => {
    try {
      const res = await axios.get("http://localhost:5000/admin/plans", {
        headers: { "auth-token": localStorage.getItem("token") },
      });
      setPlans(res.data);
    } catch (err) {
      console.error("❌ Error fetching plans:", err.response?.data || err.message);
      alert("❌ Error fetching plans: " + (err.response?.data?.error || err.message));
    }
  };

  // Fetch stats (total subscribers & revenue for this month)
  const fetchStats = async () => {
    try {
      const res = await axios.get("http://localhost:5000/admin/stats/plans", {
        headers: { "auth-token": localStorage.getItem("token") },
      });
      setStats(res.data);
    } catch (err) {
      console.error("❌ Error fetching stats:", err.response?.data || err.message);
    }
  };

  useEffect(() => {
    fetchPlans();
    fetchStats();
  }, []);

  // Handle form change
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!form.name || !form.price || !form.duration || !form.type) {
        alert("⚠ Please fill all required fields");
        return;
      }

      const payload = {
        ...form,
        features: form.features.split(",").map((f) => f.trim()).filter(Boolean),
      };

      if (editingId) {
        await axios.put(`http://localhost:5000/admin/plans/${editingId}`, payload, {
          headers: { "auth-token": localStorage.getItem("token") },
        });
        alert("✅ Plan updated successfully");
      } else {
        await axios.post("http://localhost:5000/admin/plans", payload, {
          headers: { "auth-token": localStorage.getItem("token") },
        });
        alert("✅ Plan added successfully");
      }

      setForm({
        name: "",
        type: "",
        speed: "",
        dataQuota: "",
        price: "",
        duration: "",
        description: "",
        features: "",
      });
      setEditingId(null);
      setShowModal(false);
      fetchPlans();
      fetchStats();
    } catch (err) {
      console.error("❌ Failed to save plan:", err.response?.data || err.message);
      alert("❌ Failed to save plan: " + (err.response?.data?.error || err.message));
    }
  };

  const handleEdit = (plan) => {
    setForm({
      name: plan.name,
      type: plan.type || "",
      speed: plan.speed || "",
      dataQuota: plan.dataQuota || "",
      price: plan.price,
      duration: plan.duration,
      description: plan.description || "",
      features: (plan.features || []).join(", "),
    });
    setEditingId(plan._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/admin/plans/${id}`, {
        headers: { "auth-token": localStorage.getItem("token") },
      });
      setPlans((prev) => prev.filter((p) => p._id !== id));
      alert("🗑 Plan deleted successfully");
      fetchStats();
    } catch (err) {
      console.error("❌ Failed to delete plan:", err.response?.data || err.message);
      alert("❌ Failed to delete plan: " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="plans-page">
      {/* Header */}
      <div className="plans-header">
        <h2>Plans Management</h2>
        <button className="create-btn" onClick={() => setShowModal(true)}>
          + Create New Plan
        </button>
      </div>

      {/* Stats */}
      <div className="plans-stats">
        <div className="stat-card">📦 <p>Total Plans</p><h3>{plans.length}</h3></div>
        <div className="stat-card active">✅ <p>Active Plans</p><h3>{plans.length}</h3></div>
        <div className="stat-card">👥 <p>Total Subscribers</p><h3>{stats.totalSubscribers}</h3></div>
        <div className="stat-card revenue">💰 <p>Monthly Revenue</p><h3>₹{stats.monthlyRevenue.toLocaleString()}</h3></div>
      </div>

      {/* Plans Grid */}
      <div className="plans-grid">
        {plans.length > 0 ? (
          plans.map((plan) => (
            <div key={plan._id} className="plan-card">
              <div className="plan-card-top">
                <h3>{plan.name}</h3>
                <p className="plan-type">{plan.type}</p>
                <h2 className="plan-price">₹{plan.price}/{plan.duration}</h2>
              </div>
              <div className="plan-card-bottom">
                <p className="plan-duration">{plan.duration}</p>
                <p><b>Speed:</b> {plan.speed}</p>
                <p><b>Data:</b> {plan.dataQuota}</p>
                <p className="plan-desc">{plan.description}</p>
                <ul>
                  {plan.features?.map((f, i) => <li key={i}>✔ {f}</li>)}
                </ul>
                <div className="plan-actions">
                  <button className="edit-btn" onClick={() => handleEdit(plan)}>Edit</button>
                  <button className="delete-btn" onClick={() => handleDelete(plan._id)}>Delete</button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p>No plans available</p>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingId ? "Edit Plan" : "Create New Plan"}</h3>
              <button onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form className="plan-form" onSubmit={handleSubmit}>
              <input name="name" value={form.name} onChange={handleChange} placeholder="Plan Name" required />
              <select name="type" value={form.type} onChange={handleChange} required>
                <option value="">Select Plan Type</option>
                <option value="Fibernet">Fibernet</option>
                <option value="Prepaid">Prepaid</option>
                <option value="Postpaid">Postpaid</option>
              </select>
              <input name="speed" value={form.speed} onChange={handleChange} placeholder="Download Speed (Mbps)" />
              <input name="dataQuota" value={form.dataQuota} onChange={handleChange} placeholder="Data Quota (GB)" />
              <input type="number" name="price" value={form.price} onChange={handleChange} placeholder="Price (₹)" required />
              <select name="duration" value={form.duration} onChange={handleChange} required>
                <option value="">Select Duration</option>
                <option value="1 Monthly">1 Monthly</option>
                <option value="3 Monthly">3 Monthly</option>
                <option value="6 Monthly">6 Monthly</option>
                <option value="Yearly">Yearly</option>
              </select>
              <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description"></textarea>
              <input name="features" value={form.features} onChange={handleChange} placeholder="Features (comma separated)" />
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="submit-btn">{editingId ? "Update Plan" : "Create Plan"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Plans;
