import { apiClient } from "./apiClient";

export const login = (credentials) =>
  apiClient("/api/auth/login", { method: "POST", body: credentials });

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
      categoryId: Number(provider.categoryId),
      price: Number(provider.price),
      priceUnit: "VISIT",
    },
  });
