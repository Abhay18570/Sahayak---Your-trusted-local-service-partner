import { apiClient } from "./apiClient";

export const login = (credentials) =>
  apiClient("/api/auth/login", { method: "POST", body: credentials });

export const registerCustomer = (customer) =>
  apiClient("/api/auth/register/customer", { method: "POST", body: customer });

export const registerProvider = (provider) =>
  apiClient("/api/auth/register/provider", { method: "POST", body: provider });
