import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import "./CSS/Profile.css";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [currentPassword, setCurrentPassword] = useState("");
  const token = localStorage.getItem("token");

  // Fetch profile
 const fetchProfile = useCallback(async () => {
  try {
    const res = await axios.get("http://localhost:5000/auth/me", {
      headers: { "auth-token": token },
    });
    setUser(res.data);
    setFormData(res.data);
  } catch (err) {
    console.error("❌ Failed to load profile", err);
  }
}, [token]); // depends only on token


 useEffect(() => {
  fetchProfile();
}, [fetchProfile]);

  // Update profile
  const handleUpdate = async () => {
    if (formData.password && !currentPassword) {
      alert("❌ Enter current password to set a new one.");
      return;
    }

    try {
      const res = await axios.put(
        "http://localhost:5000/auth/me",
        { ...formData, currentPassword },
        { headers: { "auth-token": token } }
      );
      setUser(res.data);
      setEditMode(false);
      setCurrentPassword("");
      alert("✅ Profile updated successfully!");
    } catch (err) {
      console.error("❌ Update failed", err);
      alert("❌ Update failed");
    }
  };

  if (!user) return <p>Loading profile...</p>;

  return (
    <div className="profile-page">
      {/* Avatar Circle */}
      <div className="profile-avatar">
        {user.username?.charAt(0).toUpperCase()}
      </div>

      <h1 className="profile-title">My Profile</h1>

      <div className="profile-card">
        {!editMode ? (
          <>
            <p><strong>Name:</strong> {user.username}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Phone:</strong> {user.phone || "-"}</p>
            <p>
              <strong>Status:</strong>{" "}
              {user.isBlocked ? "Inactive ❌" : "Active ✅"}
            </p>
            <button onClick={() => setEditMode(true)} className="edit-btn">
              ✏ Edit Profile
            </button>
          </>
        ) : (
          <>
            <input
              type="text"
              placeholder="Name"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="Phone"
              value={formData.phone || ""}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
            />

            {/* Password Update Section */}
            <input
              type="password"
              placeholder="Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="New Password (optional)"
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />

            <div className="profile-actions">
              <button onClick={() => setEditMode(false)} className="cancel-btn">
                Cancel
              </button>
              <button onClick={handleUpdate} className="save-btn">
                Save
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Profile;
