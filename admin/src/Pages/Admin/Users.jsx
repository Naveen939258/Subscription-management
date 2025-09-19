import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import "../CSS/Users.css";
import { FaUser, FaEnvelope, FaPhone, FaToggleOn } from "react-icons/fa";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [editUser, setEditUser] = useState(null);
  const [newUserModal, setNewUserModal] = useState(false);

  const token = localStorage.getItem("token");

  // Fetch users (memoized)
  const fetchUsers = useCallback(async () => {
    try {
      const res = await axios.get("https://subscription-management-bn9p.onrender.com/admin/users", {
        headers: { "auth-token": token },
      });
      setUsers(res.data);
      setFiltered(res.data);
    } catch (err) {
      console.error("❌ Error fetching users:", err);
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Search filter
  useEffect(() => {
    const result = users
      .filter((u) => !u.isAdmin)
      .filter((u) =>
        u.username.toLowerCase().includes(search.toLowerCase())
      );
    setFiltered(result);
  }, [search, users]);

  // Sort by name
  const handleSort = () => {
    const sorted = [...filtered].sort((a, b) => {
      if (sortOrder === "asc") {
        return a.username.localeCompare(b.username);
      } else {
        return b.username.localeCompare(a.username);
      }
    });
    setFiltered(sorted);
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  // Block/Unblock
  const handleBlock = async (id) => {
    try {
      await axios.patch(
        `https://subscription-management-bn9p.onrender.com/admin/users/${id}/block`,
        {},
        { headers: { "auth-token": token } }
      );
      fetchUsers();
    } catch (err) {
      console.error("❌ Block/Unblock failed:", err);
    }
  };

  // Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await axios.delete(`https://subscription-management-bn9p.onrender.com/admin/users/${id}`, {
        headers: { "auth-token": token },
      });
      fetchUsers();
    } catch (err) {
      console.error("❌ Delete failed:", err);
    }
  };

  // Update
  const handleUpdate = async () => {
    try {
      await axios.put(
        `https://subscription-management-bn9p.onrender.com/admin/users/${editUser._id}`,
        editUser,
        { headers: { "auth-token": token } }
      );
      setEditUser(null);
      fetchUsers();
    } catch (err) {
      console.error("❌ Update failed:", err);
    }
  };

  // Create
  const handleCreate = async () => {
    try {
      await axios.post("https://subscription-management-bn9p.onrender.com/auth/register", editUser, {
        headers: { "auth-token": token },
      });
      setNewUserModal(false);
      setEditUser(null);
      fetchUsers();
    } catch (err) {
      console.error("❌ Create failed:", err);
    }
  };

  // Stats
  const onlyUsers = users.filter((u) => !u.isAdmin);
  const totalUsers = onlyUsers.length;
  const activeUsers = onlyUsers.filter((u) => !u.isBlocked).length;
  const admins = users.filter((u) => u.isAdmin).length;

  return (
    <div className="users-page">
      {/* Summary */}
      <div className="summary-cards">
        <div className="card">Total Users <span>{totalUsers}</span></div>
        <div className="card">Active Users <span>{activeUsers}</span></div>
        <div className="card">Admins <span>{admins}</span></div>
      </div>

      {/* Search + Sort */}
      <div className="search-sort-container">
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={handleSort}>
          Sort {sortOrder === "asc" ? "A-Z" : "Z-A"}
        </button>
      </div>

      {/* Directory */}
      <div className="directory-header">
        <h3>Users Directory</h3>
        <div>
          <button
            onClick={() => {
              setEditUser({
                username: "",
                email: "",
                phone: "",
                password: "123456",
              });
              setNewUserModal(true);
            }}
          >
            ➕ Create User
          </button>
          <button onClick={fetchUsers}>🔄 Refresh</button>
        </div>
      </div>

      {/* Table */}
      <div className="user-table-container">
        {filtered.length > 0 ? (
          <table className="user-table">
            <thead>
              <tr>
                <th><FaUser /> Name</th>
                <th><FaEnvelope /> Email</th>
                <th><FaToggleOn /> Status</th>
                <th><FaPhone /> Phone</th>
                <th>⚙ Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u._id}>
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                  <td className={u.isBlocked ? "inactive" : "active"}>
                    {u.isBlocked ? "Inactive" : "Active"}
                  </td>
                  <td>{u.phone || "-"}</td>
                  <td>
                    <button onClick={() => setEditUser(u)}>✏ Edit</button>
                    <button onClick={() => handleBlock(u._id)}>
                      {u.isBlocked ? "Unblock" : "Block"}
                    </button>
                    <button onClick={() => handleDelete(u._id)}>🗑 Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="no-users">User not found</p>
        )}
      </div>

      {/* Modal */}
      {(editUser || newUserModal) && (
        <div className="modal">
          <div className="modal-content">
            <h3>{newUserModal ? "Create User" : "Edit User"}</h3>
            <input
              type="text"
              placeholder="Name"
              value={editUser.username}
              onChange={(e) =>
                setEditUser({ ...editUser, username: e.target.value })
              }
            />
            <input
              type="email"
              placeholder="Email"
              value={editUser.email}
              onChange={(e) =>
                setEditUser({ ...editUser, email: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="Phone"
              value={editUser.phone || ""}
              onChange={(e) =>
                setEditUser({ ...editUser, phone: e.target.value })
              }
            />
            <div className="modal-actions">
              <button onClick={() => setEditUser(null)}>Cancel</button>
              <button
                onClick={newUserModal ? handleCreate : handleUpdate}
                className="save-btn"
              >
                {newUserModal ? "Create User" : "Update User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
