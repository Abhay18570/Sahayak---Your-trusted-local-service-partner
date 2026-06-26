import { apiClient } from "./apiClient";

export const login = (credentials) =>
  apiClient("/api/auth/login", { method: "POST", body: credentials });

export const googleCustomerLogin = (credential) =>
  apiClient("/api/auth/google/customer", {
    method: "POST",
    body: { credential },
  });

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
      price: Number(provider.price),
      priceUnit: "VISIT",
    },
  });
