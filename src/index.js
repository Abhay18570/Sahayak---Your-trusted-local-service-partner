import React from "react";
import ReactDOM from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/tokens.css";
import "./styles/layout.css";
import "./styles/landing.css";
import "./styles/auth.css";
import "./styles/dashboard.css";
import "./styles/premium.css";
import "./styles/responsive.css";
import "./styles/theme.css";
import App from "./App";
import { applyInitialTheme, ThemeProvider } from "./context/ThemeContext";

const GOOGLE_CLIENT_ID = "419101375254-knedp5fs47u3usrpu50679lvmmoe0jgf.apps.googleusercontent.com";

applyInitialTheme();

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <App />
      </GoogleOAuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
