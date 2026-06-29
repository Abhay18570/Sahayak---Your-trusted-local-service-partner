export const NAME_ERROR = "Name should contain only letters.";
export const MOBILE_ERROR = "Please enter a valid 10-digit mobile number.";
export const EMAIL_ERROR = "Please enter a valid email address.";

const NAME_PATTERN = /^[A-Za-z ]+$/;
const MOBILE_PATTERN = /^\d{10}$/;
const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export function sanitizeMobileNumber(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 10);
}

export function validateName(value) {
  const normalized = String(value || "").trim();
  return normalized && !NAME_PATTERN.test(normalized) ? NAME_ERROR : "";
}

export function validateMobileNumber(value) {
  const normalized = String(value || "").trim();
  return !MOBILE_PATTERN.test(normalized) ? MOBILE_ERROR : "";
}

export function validateEmail(value) {
  const normalized = String(value || "").trim();
  return normalized && !EMAIL_PATTERN.test(normalized) ? EMAIL_ERROR : "";
}

export function hasValidationErrors(errors) {
  return Object.values(errors).some(Boolean);
}
