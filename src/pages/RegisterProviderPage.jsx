import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ToolIcon from "../components/ToolIcon";
import { useAuth } from "../context/AuthContext";
import { getCategories } from "../api/categoryApi";
import { normalizeCategory, unwrapList } from "../api/normalizers";

export default function RegisterProviderPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    category: "",
    experience: "",
    locality: "",
    idProof: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const { registerProvider } = useAuth();
  const navigate = useNavigate();

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  useEffect(() => {
    getCategories()
      .then((response) => setCategories(unwrapList(response).map(normalizeCategory)))
      .catch((err) => setError(err.message || "Unable to load service categories."));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.category || !form.password) {
      setError("Fill in your name, email, service category and password to continue.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await registerProvider(form);
      navigate("/provider-dashboard");
    } catch (err) {
      setError(err.message || "Unable to submit your provider application.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <aside className="auth-side">
        <div>
          <span className="eyebrow on-dark">Join as a provider</span>
          <h2>Your tools, your hours, more customers.</h2>
          <div className="auth-side-points">
            <div className="auth-side-point">
              <ToolIcon name="calendar" size={18} />
              <span>Set your own availability — accept jobs that fit your schedule.</span>
            </div>
            <div className="auth-side-point">
              <ToolIcon name="shield" size={18} />
              <span>Verified badge after a quick ID check builds customer trust fast.</span>
            </div>
            <div className="auth-side-point">
              <ToolIcon name="star" size={18} />
              <span>Top-rated providers get featured on the homepage every week.</span>
            </div>
          </div>
        </div>
        <div className="auth-side-quote">
          "Sahayak filled my calendar within two weeks of signing up." — Devendra, Carpenter
        </div>
      </aside>

      <div className="auth-main">
        <div className="auth-form-card">
          <span className="eyebrow">Provider sign-up</span>
          <h1>Register as a service provider</h1>
          <p className="auth-sub">Already on Sahayak? <Link to="/login">Log in instead</Link>.</p>

          {error && (
            <div className="auth-alert" style={{ background: "#fbe7e3", color: "#7a2f24" }}>
              <ToolIcon name="shield" size={15} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-row-2">
              <div className="form-field-group">
                <label htmlFor="prov-name">Full name</label>
                <div className="input-with-icon">
                  <ToolIcon name="user" size={17} />
                  <input
                    id="prov-name"
                    type="text"
                    placeholder="Ramesh Yadav"
                    value={form.name}
                    onChange={update("name")}
                  />
                </div>
              </div>
              <div className="form-field-group">
                <label htmlFor="prov-phone">Phone number</label>
                <div className="input-with-icon">
                  <ToolIcon name="phone" size={17} />
                  <input
                    id="prov-phone"
                    type="tel"
                    placeholder="98765 43210"
                    value={form.phone}
                    onChange={update("phone")}
                  />
                </div>
              </div>
            </div>

            <div className="form-field-group">
              <label htmlFor="prov-email">Email address</label>
              <div className="input-with-icon">
                <ToolIcon name="mail" size={17} />
                <input
                  id="prov-email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={update("email")}
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-field-group">
                <label htmlFor="prov-category">Primary service</label>
                <div className="input-with-icon">
                  <ToolIcon name="filter" size={17} />
                  <select id="prov-category" value={form.category} onChange={update("category")}>
                    <option value="">Select a category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.label}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-field-group">
                <label htmlFor="prov-exp">Years of experience</label>
                <div className="input-with-icon">
                  <ToolIcon name="star" size={17} />
                  <input
                    id="prov-exp"
                    type="number"
                    min="0"
                    placeholder="e.g. 5"
                    value={form.experience}
                    onChange={update("experience")}
                  />
                </div>
              </div>
            </div>

            <div className="form-field-group">
              <label htmlFor="prov-locality">Service area / Locality</label>
              <div className="input-with-icon">
                <ToolIcon name="pin" size={17} />
                <input
                  id="prov-locality"
                  type="text"
                  placeholder="Thane West, Maharashtra"
                  value={form.locality}
                  onChange={update("locality")}
                />
              </div>
            </div>

            <div className="form-field-group">
              <label htmlFor="prov-id">Government ID number (for verification)</label>
              <div className="input-with-icon">
                <ToolIcon name="shield" size={17} />
                <input
                  id="prov-id"
                  type="text"
                  placeholder="Aadhaar / PAN number"
                  value={form.idProof}
                  onChange={update("idProof")}
                />
              </div>
              <p className="field-hint">Used only to verify your identity. Never shown to customers.</p>
            </div>

            <div className="form-field-group">
              <label htmlFor="prov-password">Create a password</label>
              <div className="input-with-icon">
                <ToolIcon name="shield" size={17} />
                <input
                  id="prov-password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={update("password")}
                />
              </div>
            </div>

            <div className="form-check-row">
              <label>
                <input type="checkbox" defaultChecked /> I agree to the <a href="#terms">Provider Terms</a> &amp; background check
              </label>
            </div>

            <button
              type="submit"
              className="btn-sahayak btn-sahayak-primary btn-block"
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit application"}
            </button>
          </form>

          <p className="auth-footer-link">
            Looking to hire instead?{" "}
            <Link to="/register">Register as a customer</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
