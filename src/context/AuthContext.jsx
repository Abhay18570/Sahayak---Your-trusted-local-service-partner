import React, { createContext, useContext, useState } from "react";
import * as authApi from "../api/authApi";
import { normalizeRole } from "../utils/roles";

const AuthContext = createContext(null);
const USER_STORAGE_KEY = "sahayak.user";

function readStoredUser() {
  try {
    if (process.env.NODE_ENV === "development") {
      localStorage.removeItem(USER_STORAGE_KEY);
      return null;
    }

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

  return {
    ...user,
    role: normalizeRole(user.role || fallbackRole),
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);

  const storeUser = (nextUser) => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
    return nextUser;
  };

  const login = async (credentials) => {
    const response = await authApi.login(credentials);
    const authenticatedUser = getReturnedUser(response, credentials.role || "customer");
    return storeUser(authenticatedUser);
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
