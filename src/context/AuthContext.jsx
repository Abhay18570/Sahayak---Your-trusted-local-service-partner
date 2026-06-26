import React, { createContext, useContext, useState } from "react";
import * as authApi from "../api/authApi";
import { normalizeRole } from "../utils/roles";

const AuthContext = createContext(null);
const USER_STORAGE_KEY = "sahayak.user";

function readStoredUser() {
  try {
    const storedUser = JSON.parse(localStorage.getItem(USER_STORAGE_KEY));
    return storedUser ? { ...storedUser, role: normalizeRole(storedUser.role) } : null;
  } catch {
    localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
}

function getReturnedUser(response, fallbackRole) {
  const user = response?.user || response?.data?.user || response?.data || response;

  if (typeof user === "number" || typeof user === "string") {
    return {
      id: user,
      role: normalizeRole(fallbackRole),
    };
  }

  return sanitizeUser({
    ...user,
    role: normalizeRole(user.role || fallbackRole),
  });
}

function sanitizeUser(user) {
  if (!user || typeof user !== "object") return user;

  const sanitized = { ...user };
  delete sanitized.aadhaarNumber;

  if (sanitized.providerProfile && typeof sanitized.providerProfile === "object") {
    sanitized.providerProfile = { ...sanitized.providerProfile };
    delete sanitized.providerProfile.aadhaarNumber;
  }

  return sanitized;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);

  const storeUser = (nextUser) => {
    const sanitizedUser = sanitizeUser(nextUser);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(sanitizedUser));
    setUser(sanitizedUser);
    return sanitizedUser;
  };

  const login = async (credentialsOrUser) => {
    if (credentialsOrUser?.id && credentialsOrUser?.role && !credentialsOrUser?.password) {
      return storeUser(getReturnedUser(credentialsOrUser, credentialsOrUser.role));
    }

    const response = await authApi.login(credentialsOrUser);
    const authenticatedUser = getReturnedUser(response, credentialsOrUser.role || "customer");
    return storeUser(authenticatedUser);
  };

  const googleCustomerLogin = async (credential) => {
    const response = await authApi.googleCustomerLogin(credential);
    return storeUser(getReturnedUser(response, "customer"));
  };

  const registerCustomer = async (customer) => {
    const response = await authApi.registerCustomer(customer);
    return storeUser(getReturnedUser(response, "customer"));
  };

  const registerProvider = async (provider) => {
    const response = await authApi.registerProvider(provider);
    return storeUser(getReturnedUser(response, "provider"));
  };

  const updateCurrentUser = (updates) => {
    if (!user) return null;
    return storeUser({ ...user, ...updates });
  };

  const logout = () => {
    localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        googleCustomerLogin,
        registerCustomer,
        registerProvider,
        updateCurrentUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
