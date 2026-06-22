import { apiClient } from "./apiClient";

export const getAdminStats = () => apiClient("/api/admin/stats");
export const getAdminUsers = () => apiClient("/api/admin/users");
export const getAdminBookings = () => apiClient("/api/admin/bookings");
export const getAdminProviders = () => apiClient("/api/admin/providers");
export const getAdminReviews = () => apiClient("/api/admin/reviews");
