import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import ToolIcon from "./ToolIcon";
import { dashboardPathForRole, normalizeRole, ROLES } from "../utils/roles";
import sahayakLogo from "../sahayak_logo/Sahayak_logo.png";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const userRole = normalizeRole(user?.role);
  const dashboardPath = dashboardPathForRole(userRole) || "/";
  const showProfileLink = userRole === ROLES.CUSTOMER || userRole === ROLES.PROVIDER;
  const displayName =
    user?.name ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.email ||
    "User";

  const close = () => setOpen(false);
  const goToProfile = () => {
    close();

    if (userRole === ROLES.CUSTOMER) {
      navigate("/dashboard", { state: { activeTab: "profile" } });
      return;
    }

    navigate(dashboardPath);
  };

  return (
    <header className="sahayak-nav">
      <div className="container-sahayak sahayak-nav-inner">
        <Link to="/" className="sahayak-brand" onClick={close}>
          <span className="sahayak-brand-mark">
            <img src={sahayakLogo} alt="" aria-hidden="true" />
          </span>
          <span className="sahayak-brand-name">Sahayak</span>
        </Link>

        <nav className={`sahayak-nav-links ${open ? "is-open" : ""}`}>
          {!user && (
            <>
              <NavLink to="/" className="sahayak-nav-link" onClick={close} end>
                Home
              </NavLink>
              <a href="/#how-it-works" className="sahayak-nav-link" onClick={close}>
                How It Works
              </a>
            </>
          )}

          <div className="sahayak-nav-actions">
            {user ? (
              <>
                <NavLink to={dashboardPath} className="sahayak-nav-link" onClick={close}>
                  Dashboard
                </NavLink>
                {showProfileLink && (
                  <button
                    type="button"
                    className="sahayak-nav-link"
                    onClick={goToProfile}
                  >
                    Profile
                  </button>
                )}
                <span className="sahayak-nav-user">
                  <ToolIcon name="user" size={16} /> {displayName.split(" ")[0]}
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
                  Login
                </Link>
                <Link to="/register" className="btn-sahayak btn-sahayak-primary btn-sm" onClick={close}>
                  Register
                </Link>
              </>
            )}
          </div>
        </nav>

        <div className="sahayak-nav-utilities">
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
            aria-pressed={isDark}
            title={`Switch to ${isDark ? "light" : "dark"} theme`}
          >
            <span className="theme-toggle-track" aria-hidden="true">
              <span className="theme-toggle-thumb">
                {isDark ? <Moon size={15} /> : <Sun size={15} />}
              </span>
            </span>
          </button>

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
        </div>
      </div>
    </header>
  );
}
