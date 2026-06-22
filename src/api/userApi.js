import { apiClient } from "./apiClient";

export const getUser = (id) => apiClient(`/api/users/${id}`);
