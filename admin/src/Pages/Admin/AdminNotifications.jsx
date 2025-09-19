import React, { useState } from "react";
import axios from "axios";
import "../CSS/AdminNotifications.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

const AdminNotifications = () => {
  const [message, setMessage] = useState("");

  const sendNotification = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/admin/notifications`, { message });
      alert("✅ Notification sent to all users!");
      setMessage("");
    } catch (err) {
      console.error(err);
      alert("❌ Error sending notification");
    }
  };

  return (
    <div className="notifications-page">
      <div className="notifications-header">
  <h2>
    📢
    <span className="emoji">Send Notification</span> 
  </h2>
</div>


      <div className="notifications-box">
        <form onSubmit={sendNotification}>
          <label htmlFor="message">Message</label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write a new notification..."
            rows="5"
            required
          />
          <div className="form-actions">
            <button type="submit" className="submit-btn">
              Send Notification
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminNotifications;
