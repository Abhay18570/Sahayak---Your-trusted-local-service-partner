import React from "react";
import { Link } from "react-router-dom";
import ToolIcon from "./ToolIcon";
import { useAuth } from "../context/AuthContext";
import { hasRole, ROLES } from "../utils/roles";

export default function Footer() {
  const { user } = useAuth();

  return (
    <footer className="sahayak-footer">
      <div className="container-sahayak sahayak-footer-grid">
        <div className="sahayak-footer-brand">
          <Link to="/" className="sahayak-brand">
            <span className="sahayak-brand-mark">S</span>
            <span className="sahayak-brand-name on-dark">Sahayak</span>
          </Link>
          <p className="sahayak-footer-tag">
            Your trusted local service partner — verified electricians,
            plumbers, carpenters, tutors and more, booked in minutes.
          </p>
        </div>

        <div className="sahayak-footer-col">
          <h6 className="eyebrow on-dark">Company</h6>
          <Link to="/">About Sahayak</Link>
          <Link to="/">Careers</Link>
          <Link to="/">Press</Link>
        </div>

        <div className="sahayak-footer-col">
          <h6 className="eyebrow on-dark">For customers</h6>
          {hasRole(user, ROLES.CUSTOMER) && <Link to="/dashboard">Find a service</Link>}
          <Link to="/register">Create an account</Link>
          <Link to="/">Safety &amp; trust</Link>
        </div>

        <div className="sahayak-footer-col">
          <h6 className="eyebrow on-dark">For providers</h6>
          <Link to="/register-provider">Join as a provider</Link>
          <Link to="/login">Provider login</Link>
          <Link to="/">Provider resources</Link>
        </div>

        <div className="sahayak-footer-col">
          <h6 className="eyebrow on-dark">Contact</h6>
          <p className="sahayak-footer-contact">
            <ToolIcon name="phone" size={15} /> +91 88000 11223
          </p>
          <p className="sahayak-footer-contact">
            <ToolIcon name="mail" size={15} /> help@sahayak.in
          </p>
          <p className="sahayak-footer-contact">
            <ToolIcon name="pin" size={15} /> Thane, Maharashtra, India
          </p>
        </div>
      </div>

      <div className="container-sahayak sahayak-footer-bottom">
        <span>© 2026 Sahayak. All rights reserved.</span>
        <div className="sahayak-footer-legal">
          <Link to="/">Privacy</Link>
          <Link to="/">Terms</Link>
          <Link to="/">Sitemap</Link>
        </div>
      </div>
    </footer>
  );
}
