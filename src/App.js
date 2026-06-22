import React from "react";
import { BrowserRouter, Navigate, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterCustomerPage from "./pages/RegisterCustomerPage";
import RegisterProviderPage from "./pages/RegisterProviderPage";
import CustomerDashboard from "./pages/CustomerDashboard";
import ProviderDashboard from "./pages/ProviderDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import { hasRole, ROLES } from "./utils/roles";

function CustomerRoute({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!hasRole(user, ROLES.CUSTOMER)) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!hasRole(user, ROLES.ADMIN)) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}

function ProviderRoute({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!hasRole(user, ROLES.PROVIDER)) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterCustomerPage />} />
            <Route path="/register-provider" element={<RegisterProviderPage />} />
            <Route
              path="/dashboard"
              element={
                <CustomerRoute>
                  <CustomerDashboard />
                </CustomerRoute>
              }
            />
            <Route
              path="/provider-dashboard"
              element={
                <ProviderRoute>
                  <ProviderDashboard />
                </ProviderRoute>
              }
            />
            <Route
              path="/admin-dashboard"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route path="*" element={<LandingPage />} />
          </Routes>
        </main>
        <Footer />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
