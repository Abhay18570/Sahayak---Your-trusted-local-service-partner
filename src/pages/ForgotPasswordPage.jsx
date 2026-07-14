import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ToolIcon from "../components/ToolIcon";
import DecorativeBackdrop from "../components/DecorativeBackdrop";
import { forgotPassword, resetPassword } from "../api/authApi";
import { validateEmail } from "../utils/formValidation";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [emailError, setEmailError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!resetComplete) return undefined;

    const redirectTimer = window.setTimeout(() => {
      navigate("/login", {
        replace: true,
        state: { passwordReset: true },
      });
    }, 1800);

    return () => window.clearTimeout(redirectTimer);
  }, [navigate, resetComplete]);

  const handleSendOtp = async (event) => {
    event.preventDefault();
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setError("Enter your registered email address.");
      return;
    }
    const nextEmailError = validateEmail(normalizedEmail);
    setEmailError(nextEmailError);
    if (nextEmailError) {
      setError("");
      return;
    }

    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      await forgotPassword(normalizedEmail);
      setEmail(normalizedEmail);
      setStep(2);
      setMessage("OTP sent to your registered email.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to send OTP. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();

    if (!otp.trim()) {
      setError("Enter the OTP sent to your email.");
      return;
    }
    if (!newPassword) {
      setError("Enter a new password.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Your new password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirm password must match.");
      return;
    }

    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      await resetPassword(email, otp.trim(), newPassword);
      setMessage("Password reset successfully. Please login with your new password.");
      setResetComplete(true);
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to reset password. Please check the OTP."));
    } finally {
      setSubmitting(false);
    }
  };

  const changeEmail = () => {
    setStep(1);
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setEmailError("");
    setMessage("");
  };

  return (
    <div className="auth-page">
      <aside className="auth-side auth-side-login">
        <DecorativeBackdrop variant="login" />
        <div>
          <span className="eyebrow on-dark">Account recovery</span>
          <h2>A quick verification, then you are back in.</h2>
          <div className="auth-side-points">
            <div className="auth-side-point">
              <ToolIcon name="mail" size={18} />
              <span>We will send a one-time password to your registered email.</span>
            </div>
            <div className="auth-side-point">
              <ToolIcon name="shield" size={18} />
              <span>Your OTP confirms that the Sahayak account belongs to you.</span>
            </div>
            <div className="auth-side-point">
              <ToolIcon name="check" size={18} />
              <span>Once reset, sign in normally with your new password.</span>
            </div>
          </div>
        </div>
        <div className="auth-side-quote">
          For your security, never share your OTP or password with anyone.
        </div>
      </aside>

      <div className="auth-main">
        <div className="auth-form-card">
          <span className="eyebrow">Step {step} of 2</span>
          <h1>{step === 1 ? "Forgot your password?" : "Set a new password"}</h1>
          <p className="auth-sub">
            {step === 1
              ? "Enter the email linked to your Sahayak account."
              : `Enter the OTP sent to ${email}.`}
          </p>

          {error && (
            <div className="auth-alert auth-alert-error" role="alert">
              <ToolIcon name="shield" size={15} /> {error}
            </div>
          )}

          {message && (
            <div className="auth-alert auth-alert-success" role="status">
              <ToolIcon name="check" size={15} /> {message}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleSendOtp}>
              <div className="form-field-group">
                <label htmlFor="forgot-email">Email address</label>
                <div className={`input-with-icon ${emailError ? "field-invalid" : ""}`}>
                  <ToolIcon name="mail" size={17} />
                  <input
                    id="forgot-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setEmailError(validateEmail(event.target.value));
                    }}
                    disabled={submitting}
                  />
                </div>
                {emailError && <p className="field-error">{emailError}</p>}
              </div>

              <button
                type="submit"
                className="btn-sahayak btn-sahayak-teal btn-block"
                disabled={submitting}
              >
                {submitting ? "Sending OTP..." : "Send OTP"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword}>
              <div className="form-field-group">
                <div className="auth-field-label-row">
                  <label htmlFor="reset-otp">Email OTP</label>
                  <button type="button" className="auth-text-button" onClick={changeEmail}>
                    Change email
                  </button>
                </div>
                <div className="input-with-icon">
                  <ToolIcon name="shield" size={17} />
                  <input
                    id="reset-otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="Enter your OTP"
                    value={otp}
                    onChange={(event) => setOtp(event.target.value)}
                    disabled={submitting || resetComplete}
                  />
                </div>
              </div>

              <div className="form-field-group">
                <label htmlFor="reset-password">New password</label>
                <div className="input-with-icon">
                  <ToolIcon name="shield" size={17} />
                  <input
                    id="reset-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Minimum 6 characters"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    disabled={submitting || resetComplete}
                  />
                  <button
                    type="button"
                    className="auth-input-action"
                    onClick={() => setShowPassword((visible) => !visible)}
                    disabled={resetComplete}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="form-field-group">
                <label htmlFor="confirm-reset-password">Confirm password</label>
                <div className="input-with-icon">
                  <ToolIcon name="shield" size={17} />
                  <input
                    id="confirm-reset-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Re-enter your new password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    disabled={submitting || resetComplete}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-sahayak btn-sahayak-teal btn-block"
                disabled={submitting || resetComplete}
              >
                {submitting ? "Resetting password..." : "Reset Password"}
              </button>
            </form>
          )}

          <p className="auth-footer-link">
            Remembered your password? <Link to="/login">Back to login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function getApiErrorMessage(error, fallback) {
  const backendMessage = [
    error?.data?.message,
    error?.data?.detail,
    error?.data?.error,
    typeof error?.data === "string" ? error.data : "",
    error?.message,
  ].find((message) => typeof message === "string" && message.trim());

  return backendMessage?.trim() || fallback;
}
