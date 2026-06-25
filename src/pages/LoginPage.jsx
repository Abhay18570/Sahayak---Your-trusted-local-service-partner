import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import ToolIcon from "../components/ToolIcon";
import { useAuth } from "../context/AuthContext";
import { dashboardPathForRole } from "../utils/roles";

export default function LoginPage() {
  const [role, setRole] = useState("customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Enter both your email and password to continue.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const loggedInUser = await login({ email, password, role });
      const dashboardPath = dashboardPathForRole(loggedInUser.role);
      if (!dashboardPath) throw new Error("This account has an unsupported role.");
      navigate(dashboardPath, { replace: true });
    } catch (err) {
      setError(getLoginErrorMessage(err, role));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <aside className="auth-side">
        <div>
          <span className="eyebrow on-dark">Welcome back</span>
          <h2>Pick up right where your last job left off.</h2>
          <div className="auth-side-points">
            <div className="auth-side-point">
              <ToolIcon name="shield" size={18} />
              <span>Every provider on Sahayak is ID-verified and background checked.</span>
            </div>
            <div className="auth-side-point">
              <ToolIcon name="calendar" size={18} />
              <span>Track upcoming bookings and rebook your favourite providers in two taps.</span>
            </div>
            <div className="auth-side-point">
              <ToolIcon name="star" size={18} />
              <span>Rated 4.8/5 by over 40,000 customers across Mumbai &amp; Thane.</span>
            </div>
          </div>
        </div>
        <div className="auth-side-quote">
          "Booked an electrician at 9pm, he was at my door in forty minutes." — Neha, Thane
        </div>
      </aside>

      <div className="auth-main">
        <div className="auth-form-card">
          <span className="eyebrow">{location.state?.from ? "Session expired" : "Sign in"}</span>
          <h1>Log in to Sahayak</h1>
          <p className="auth-sub">New here? Creating an account takes less than a minute.</p>

          <div className="auth-role-toggle">
            <a
              href="#customer"
              className={role === "customer" ? "active" : ""}
              onClick={(e) => {
                e.preventDefault();
                setRole("customer");
                setError("");
              }}
            >
              I'm a customer
            </a>
            <a
              href="#provider"
              className={role === "provider" ? "active" : ""}
              onClick={(e) => {
                e.preventDefault();
                setRole("provider");
                setError("");
              }}
            >
              I'm a provider
            </a>
            <a
              href="#admin"
              className={role === "admin" ? "active" : ""}
              onClick={(e) => {
                e.preventDefault();
                setRole("admin");
                setError("");
              }}
            >
              I'm an admin
            </a>
          </div>

          {error && (
            <div className="auth-alert" style={{ background: "#fbe7e3", color: "#7a2f24" }}>
              <ToolIcon name="shield" size={15} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-field-group">
              <label htmlFor="login-email">Email address</label>
              <div className="input-with-icon">
                <ToolIcon name="mail" size={17} />
                <input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-field-group">
              <label htmlFor="login-password">Password</label>
              <div className="input-with-icon">
                <ToolIcon name="shield" size={17} />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  style={{ background: "none", border: "none", color: "var(--ink-500)", fontSize: "0.78rem", cursor: "pointer" }}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="form-check-row">
              <label>
                <input type="checkbox" /> Keep me signed in
              </label>
              <Link to="/forgot-password">Forgot password?</Link>
            </div>

            <button
              type="submit"
              className="btn-sahayak btn-sahayak-teal btn-block"
              disabled={submitting}
            >
              {submitting
                ? "Logging in..."
                : `Log in as ${role}`}
            </button>
          </form>

          <div className="auth-divider">or continue with</div>
          <button className="btn-sahayak btn-sahayak-outline btn-block" type="button">
            Continue with Google
          </button>

          <p className="auth-footer-link">
            Don't have an account?{" "}
            {role === "admin" ? (
              <span>Admin accounts are managed by Sahayak.</span>
            ) : role === "provider" ? (
              <Link to="/register-provider">Register as a provider</Link>
            ) : (
              <Link to="/register">Register as a customer</Link>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function getLoginErrorMessage(error, role) {
  const backendMessage = [
    error?.data?.message,
    error?.data?.detail,
    error?.data?.error,
    error?.message,
  ].find((message) => typeof message === "string" && message.trim());
  const normalizedMessage = backendMessage?.trim().toLowerCase() || "";

  if (role === "provider" && normalizedMessage.includes("internal server error")) {
    return "Your approval is still pending. Please wait some time.";
  }

  if (
    normalizedMessage.includes("provider") &&
    normalizedMessage.includes("pending") &&
    normalizedMessage.includes("approval")
  ) {
    return "Your provider registration is submitted. Please wait for admin approval.";
  }

  if (
    normalizedMessage.includes("provider") &&
    normalizedMessage.includes("rejected")
  ) {
    return "Your provider registration was rejected. Please contact admin.";
  }

  return backendMessage?.trim() || "Unable to log in. Please check your details.";
}
