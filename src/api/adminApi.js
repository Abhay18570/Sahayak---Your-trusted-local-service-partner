import { apiClient } from "./apiClient";

export const getAdminStats = () => apiClient("/api/admin/stats");
export const getAdminUsers = () => apiClient("/api/admin/users");
export const getAdminBookings = () => apiClient("/api/admin/bookings");
export const getAdminProviders = () => apiClient("/api/admin/providers");
export const getAdminReviews = () => apiClient("/api/admin/reviews");
export const getPendingProviders = () => apiClient("/api/admin/providers/pending");
export const deleteUser = (userId) =>
  apiClient(`/api/admin/users/${userId}`, {
    method: "DELETE",
    responseType: "text",
  });
export const approveProvider = (providerId) =>
  apiClient(`/api/admin/providers/${providerId}/approve`, { method: "PATCH" });
export const rejectProvider = (providerId) =>
  apiClient(`/api/admin/providers/${providerId}/reject`, { method: "PATCH" });
