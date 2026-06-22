import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ToolIcon from "../components/ToolIcon";
import { useAuth } from "../context/AuthContext";

export default function RegisterCustomerPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    locality: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { registerCustomer } = useAuth();
  const navigate = useNavigate();

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      setError("Fill in your name, email and a password to create your account.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await registerCustomer(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Unable to create your account.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <aside className="auth-side">
        <div>
          <span className="eyebrow on-dark">Join as a customer</span>
          <h2>Stop asking around for "a good electrician." Start here.</h2>
          <div className="auth-side-points">
            <div className="auth-side-point">
              <ToolIcon name="search" size={18} />
              <span>Search any service by category, locality, rating or price.</span>
            </div>
            <div className="auth-side-point">
              <ToolIcon name="history" size={18} />
              <span>Keep a running history of every booking, receipt and rating.</span>
            </div>
            <div className="auth-side-point">
              <ToolIcon name="check" size={18} />
              <span>Pay only after the work is done — no advance required.</span>
            </div>
          </div>
        </div>
        <div className="auth-side-quote">
          "Found a Maths tutor for my son within a day, with the price shown upfront." — Sana, Mumbai
        </div>
      </aside>

      <div className="auth-main">
        <div className="auth-form-card">
          <span className="eyebrow">Create account</span>
          <h1>Sign up as a customer</h1>
          <p className="auth-sub">Already booking jobs? <Link to="/login">Log in instead</Link>.</p>

          {error && (
            <div className="auth-alert" style={{ background: "#fbe7e3", color: "#7a2f24" }}>
              <ToolIcon name="shield" size={15} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-field-group">
              <label htmlFor="cust-name">Full name</label>
              <div className="input-with-icon">
                <ToolIcon name="user" size={17} />
                <input
                  id="cust-name"
                  type="text"
                  placeholder="Riya Sharma"
                  value={form.name}
                  onChange={update("name")}
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-field-group">
                <label htmlFor="cust-email">Email address</label>
                <div className="input-with-icon">
                  <ToolIcon name="mail" size={17} />
                  <input
                    id="cust-email"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={update("email")}
                  />
                </div>
              </div>
              <div className="form-field-group">
                <label htmlFor="cust-phone">Phone number</label>
                <div className="input-with-icon">
                  <ToolIcon name="phone" size={17} />
                  <input
                    id="cust-phone"
                    type="tel"
                    placeholder="98765 43210"
                    value={form.phone}
                    onChange={update("phone")}
                  />
                </div>
              </div>
            </div>

            <div className="form-field-group">
              <label htmlFor="cust-locality">Locality / City</label>
              <div className="input-with-icon">
                <ToolIcon name="pin" size={17} />
                <input
                  id="cust-locality"
                  type="text"
                  placeholder="Thane West, Maharashtra"
                  value={form.locality}
                  onChange={update("locality")}
                />
              </div>
              <p className="field-hint">We'll show you providers serving this area first.</p>
            </div>

            <div className="form-field-group">
              <label htmlFor="cust-password">Create a password</label>
              <div className="input-with-icon">
                <ToolIcon name="shield" size={17} />
                <input
                  id="cust-password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={update("password")}
                />
              </div>
            </div>

            <div className="form-check-row">
              <label>
                <input type="checkbox" defaultChecked /> I agree to the <a href="#terms">Terms</a> &amp; <a href="#privacy">Privacy Policy</a>
              </label>
            </div>

            <button
              type="submit"
              className="btn-sahayak btn-sahayak-primary btn-block"
              disabled={submitting}
            >
              {submitting ? "Creating account..." : "Create my account"}
            </button>
          </form>

          <p className="auth-footer-link">
            Are you a tradesperson?{" "}
            <Link to="/register-provider">Register as a provider instead</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
