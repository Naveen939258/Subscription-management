import React from "react";
import { Routes, Route } from "react-router-dom";
import Subscriptions from "./Pages/Admin/Subscriptions";
import Users from "./Pages/Admin/Users";
import Plans from "./Pages/Admin/Plans";
import Dashboard from "./Pages/Admin/DashBoard";
import Layout from "./Components/Layout/Layout";
import AdminLogin from "./Pages/Admin/AdminLogin";
import ProtectedRoute from "./Components/ProtectedRoute/ProtectedRoute";
import DiscountsPage from "./Pages/Admin/DiscountsPage";
import AdminConnections from "./Pages/Admin/AdminConnections";
import AdminNotifications from "./Pages/Admin/AdminNotifications";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<AdminLogin />} />

      {/* All protected routes go inside Layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <Layout>
              <Users />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/connections"
        element={
          <ProtectedRoute>
            <Layout>
              <AdminConnections/>
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/plans"
        element={
          <ProtectedRoute>
            <Layout>
              <Plans />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/subscriptions"
        element={
          <ProtectedRoute>
            <Layout>
              <Subscriptions />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-notifications"
        element={
          <ProtectedRoute>
            <Layout>
              <AdminNotifications />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/discountpage"
        element={
          <ProtectedRoute>
            <Layout>
              <DiscountsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
