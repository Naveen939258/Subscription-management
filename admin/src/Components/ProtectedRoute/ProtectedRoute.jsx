import React from "react";
import "./ProtectedRoute.css";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const isAdmin = localStorage.getItem("isAdmin") === "true";

  if (!token || !isAdmin) {
    return (
      <div className="protected-wrapper">
        <div className="protected-card">
          <h2>Admin Login</h2>
          <p>You must be an admin to view this page.</p>
          <a href="/login" className="protected-btn">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
