import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../CSS/AdminLogin.css";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/auth/login", {
        email,
        password,
      });

      const { token, user } = res.data;

      // Ensure this account is an admin before saving token
      if (!user || !user.isAdmin) {
        setError("Not authorized as admin");
        setLoading(false);
        return;
      }

      // Save token and admin flag (store as string)
      localStorage.setItem("token", token);
      localStorage.setItem("isAdmin", user.isAdmin ? "true" : "false");
      localStorage.setItem("userEmail", user.email || "");

      // Redirect to dashboard
      navigate("/");
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.error || "Login failed. Check credentials.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h2>Admin Sign In</h2>
        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@example.com"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </label>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="login-note">
          Use an admin account. If you don't have one, register via backend or promote a user.
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
