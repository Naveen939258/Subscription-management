// src/Components/Navbar/Navbar.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import "./Navbar.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const [userInitial, setUserInitial] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  // Fetch notifications
  const fetchNotifications = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await axios.get(`${API_BASE}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data);
      setUnreadCount(res.data.filter((n) => !n.read).length);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  useEffect(() => {
    const handleLoginStatusChange = () => {
      setIsLoggedIn(!!localStorage.getItem("token"));
      const userData = JSON.parse(localStorage.getItem("user"));
      if (userData?.username) {
        setUserInitial(userData.username.charAt(0).toUpperCase());
      } else {
        setUserInitial("");
      }
    };

    handleLoginStatusChange();
    window.addEventListener("loginStatusChanged", handleLoginStatusChange);

    if (isLoggedIn) {
      fetchNotifications();
    }

    return () => {
      window.removeEventListener("loginStatusChanged", handleLoginStatusChange);
    };
  }, [isLoggedIn]);

  // Mark all notifications as read
  const markAllAsRead = async () => {
    const token = localStorage.getItem("token");
    try {
      await axios.put(`${API_BASE}/notifications/mark-read`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("Error marking notifications as read:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setUserInitial("");
    navigate("/");
  };

  return (
    <nav>
      {/* Logo */}
      <h1>📡 Subscription</h1>

      {/* Middle Links */}
      <ul className="nav-links">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/dashboard">Dashboard</Link></li>
        <li><Link to="/plans">Plans</Link></li>
        <li><Link to="/offers">Offers</Link></li>
        {isLoggedIn && <li><Link to="/Subscriptionhistory">Subscription History</Link></li>}
        {isLoggedIn && <li><Link to="/connection">Connections</Link></li>}
      </ul>

      {/* Right Side */}
      {isLoggedIn ? (
        <div className="nav-right">
          {/* 🔔 Notifications */}
          <div className="notification-wrapper">
            <FontAwesomeIcon
              icon={faBell}
              className="bell-icon"
              onClick={() => {
                setShowDropdown(!showDropdown);
                if (!showDropdown) markAllAsRead();
              }}
            />
            {unreadCount > 0 && <span className="notif-count">{unreadCount}</span>}

            {showDropdown && (
              <div className="notif-dropdown">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div key={n._id} className={`notif-item ${n.read ? "read" : ""}`}>
                      {n.message}
                    </div>
                  ))
                ) : (
                  <p className="no-notif">No notifications</p>
                )}
              </div>
            )}
          </div>

          {/* Profile + Logout */}
          <Link to="/profile" className="profile-avatar1" title="My Profile">
            {userInitial || "?"}
          </Link>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      ) : (
        <ul className="nav-auth">
          <li><Link to="/login">Login / Signup</Link></li>
        </ul>
      )}
    </nav>
  );
};

export default Navbar;
