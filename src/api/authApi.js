import { ApiError, BASE_URL, apiClient } from "./apiClient";

export const login = (credentials) =>
  apiClient("/api/auth/login", { method: "POST", body: credentials });

export const googleCustomerLogin = async (credential) => {
  const response = await fetch(`${BASE_URL}/api/auth/google/customer`, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ credential }),
  });

  const text = await response.text();
  let data = text;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const message =
      data?.message || data?.detail || data?.error || data || `Google login failed (${response.status})`;
    throw new ApiError(message, response.status, data);
  }

  return data;
};

export const forgotPassword = (email) =>
  apiClient("/api/auth/forgot-password", {
    method: "POST",
    body: { email },
    responseType: "text",
  });

export const resetPassword = (email, otp, newPassword) =>
  apiClient("/api/auth/reset-password", {
    method: "POST",
    body: { email, otp, newPassword },
    responseType: "text",
  });

export const registerCustomer = (customer) =>
  apiClient("/api/auth/register/customer", { method: "POST", body: customer });

export const registerProvider = (provider) =>
  apiClient("/api/auth/register/provider", {
    method: "POST",
    body: {
      name: provider.name,
      email: provider.email,
      phone: provider.phone,
      password: provider.password,
      experienceYears: Number(provider.experienceYears),
      bio: provider.bio,
      profileImageUrl: provider.profileImageUrl,
      aadhaarNumber: provider.aadhaarNumber,
      categoryId: Number(provider.categoryId),
      ...(provider.customServiceName
        ? { customServiceName: provider.customServiceName }
        : {}),
      price: Number(provider.price),
      priceUnit: "VISIT",
    },
  });
