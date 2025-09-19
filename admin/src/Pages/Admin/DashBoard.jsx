import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../CSS/DashBoard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    users: 0,
    activeUsers: 0, 
    blockedUsers: 0,
    admins: 0,
    plans: 0,
    subscriptions: 0,
    activeSubs: 0,
    connections: 0,
    activeConnections: 0,
    inactiveConnections: 0,
    withPlans: 0,
  });

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");

      const [usersRes, plansRes, subsRes, connectionsRes] = await Promise.all([
        axios.get("http://localhost:5000/admin/users", { headers: { "auth-token": token } }),
        axios.get("http://localhost:5000/admin/plans", { headers: { "auth-token": token } }),
        axios.get("http://localhost:5000/admin/subscriptions", { headers: { "auth-token": token } }),
        axios.get("http://localhost:5000/admin/connections", { headers: { "auth-token": token } }),
      ]);

      const users = usersRes.data || [];
      const plans = plansRes.data || [];
      const subs = subsRes.data || [];
      const connections = connectionsRes.data || [];

      const onlyUsers = users.filter((u) => !u.isAdmin);
      const activeUsers = onlyUsers.filter((u) => !u.isBlocked).length;
      const blockedUsers = onlyUsers.filter((u) => u.isBlocked).length;
      const admins = users.filter((u) => u.isAdmin).length;
      const activeSubs = subs.filter((s) => s.status === "Active").length;

      // Connection stats
      const totalConnections = connections.length;
      const activeConnections = connections.filter((c) => c.status === "Active").length;
      const inactiveConnections = connections.filter((c) => c.status !== "Active").length;
      const withPlans = connections.filter((c) => c.currentSubscription).length;

      setStats({
        users: users.length,
        activeUsers,
        blockedUsers,
        admins,
        plans: plans.length,
        subscriptions: subs.length,
        activeSubs,
        connections: totalConnections,
        activeConnections,
        inactiveConnections,
        withPlans,
      });

    } catch (err) {
      console.error("Failed to fetch dashboard stats:", err.response?.data || err.message);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="dashboard-icon">🛡️</div>
        <h2>Admin Dashboard</h2>
        <p>Welcome back, Admin</p>
      </div>

      <div className="dashboard-actions">
        {/* Existing action cards */}
        <div className="action-card create">
          <div className="action-icon">👤➕</div>
          <h3>Create New User</h3>
          <p>Add new users to the system with role assignments</p>
          <button className="action-btn create-btn" onClick={() => navigate("/users")}>➕ Create User</button>
        </div>

        <div className="action-card manage">
          <div className="action-icon">👥</div>
          <h3>Manage Users</h3>
          <p>View, edit, and manage existing system users</p>
          <button className="action-btn manage-btn" onClick={() => navigate("/users")}>⚙ Manage Users</button>
        </div>

        <div className="action-card create">
          <div className="action-icon">📦➕</div>
          <h3>Create Plan</h3>
          <p>Add new internet/data plans</p>
          <button className="action-btn create-btn" onClick={() => navigate("/plans")}>➕ Create Plan</button>
        </div>

        <div className="action-card manage">
          <div className="action-icon">📦</div>
          <h3>Manage Plans</h3>
          <p>View, edit, and delete plans</p>
          <button className="action-btn manage-btn" onClick={() => navigate("/plans")}>⚙ Manage Plans</button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {/* Users */}
        <div className="stat-card"><h3>Total Users</h3><p>{stats.users}</p></div>
        <div className="stat-card"><h3>Active Users</h3><p>{stats.activeUsers}</p></div>
        <div className="stat-card"><h3>Blocked Users</h3><p>{stats.blockedUsers}</p></div>
        <div className="stat-card"><h3>Admins</h3><p>{stats.admins}</p></div>

        {/* Plans & Subscriptions */}
        <div className="stat-card"><h3>Total Plans</h3><p>{stats.plans}</p></div>
        <div className="stat-card"><h3>Total Subscriptions</h3><p>{stats.subscriptions}</p></div>
        <div className="stat-card"><h3>Active Subscriptions</h3><p>{stats.activeSubs}</p></div>

        {/* Connections */}
        <div className="stat-card"><h3>Total Connections</h3><p>{stats.connections}</p></div>
        <div className="stat-card"><h3>Active Connections</h3><p>{stats.activeConnections}</p></div>
        <div className="stat-card"><h3>Inactive Connections</h3><p>{stats.inactiveConnections}</p></div>
        <div className="stat-card"><h3>Connections with Plan</h3><p>{stats.withPlans}</p></div>
      </div>
    </div>
  );
};

export default Dashboard;
