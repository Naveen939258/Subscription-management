import React from "react";
import { NavLink } from "react-router-dom";
import "./Sidebar.css";

const Sidebar = () => {
  return (
    <div className="sidebar">
      <h2 className="sidebar-title">Admin</h2>
      <ul>
        <li>
          <NavLink to="/" end>
            📊 Dashboard
          </NavLink>
        </li>
        <li>
          <NavLink to="/users">
            👥 Users
          </NavLink>
        </li>
        <li>
          <NavLink to="/connections">
            🔗 Connections
          </NavLink>
        </li>
        <li>
          <NavLink to="/plans">
            📦 Plans
          </NavLink>
        </li>
        <li>
          <NavLink to="/subscriptions">
            💳 Subscriptions
          </NavLink>
        </li>
        <li>
          <NavLink to="/discountpage">
            % discounts
          </NavLink>
        </li>
        <li>
  <NavLink to="/admin-notifications">
    🔔 Notifications
  </NavLink>
      </li>

      </ul>
    </div>
  );
};

export default Sidebar;
