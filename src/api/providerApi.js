import { apiClient, buildQuery } from "./apiClient";

export const getProviders = (filters = {}) =>
  apiClient(`/api/providers${buildQuery(filters)}`);

export const getProvider = (id) => apiClient(`/api/providers/${id}`);
