import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ToolIcon from "./ToolIcon";
import { hasRole, ROLES } from "../utils/roles";
import sahayakLogo from "../sahayak_logo/Sahayak_logo.png";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const close = () => setOpen(false);

  return (
    <header className="sahayak-nav">
      <div className="container-sahayak sahayak-nav-inner">
        <Link to="/" className="sahayak-brand" onClick={close}>
          <span className="sahayak-brand-mark">
            <img src={sahayakLogo} alt="" aria-hidden="true" />
          </span>
          <span className="sahayak-brand-name">Sahayak</span>
        </Link>

        <button
          className="sahayak-nav-toggle"
          aria-label="Toggle navigation"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`sahayak-nav-links ${open ? "is-open" : ""}`}>
          {!hasRole(user, ROLES.CUSTOMER) && (
            <NavLink to="/" className="sahayak-nav-link" onClick={close} end>
              Home
            </NavLink>
          )}
          {!hasRole(user, ROLES.CUSTOMER) && (
            <a href="/#how-it-works" className="sahayak-nav-link" onClick={close}>
              How it works
            </a>
          )}

          <div className="sahayak-nav-actions">
            {user ? (
              <>
                <span className="sahayak-nav-user">
                  <ToolIcon name="user" size={16} /> {user.name.split(" ")[0]}
                </span>
                <button
                  className="btn-sahayak btn-sahayak-outline btn-sm"
                  onClick={() => {
                    logout();
                    close();
                    navigate("/");
                  }}
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-sahayak btn-sahayak-ghost btn-sm" onClick={close}>
                  Log in
                </Link>
                <Link to="/register" className="btn-sahayak btn-sahayak-primary btn-sm" onClick={close}>
                  Join Sahayak
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
