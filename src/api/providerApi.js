import { apiClient, buildQuery } from "./apiClient";

export const getProviders = (filters = {}) =>
  apiClient(`/api/providers${buildQuery(filters)}`);

export const getProvider = (id) => apiClient(`/api/providers/${id}`);

export const getProviderEarnings = (providerId) =>
  apiClient(`/api/provider/earnings${buildQuery({ providerId })}`);

export const getProviderServiceAreas = (providerId) =>
  apiClient(`/api/provider/service-areas${buildQuery({ providerId })}`);

export const addProviderServiceArea = (providerId, serviceArea) =>
  apiClient(`/api/provider/service-areas${buildQuery({ providerId })}`, {
    method: "POST",
    body: serviceArea,
  });

export const deleteProviderServiceArea = (serviceAreaId) =>
  apiClient(`/api/provider/service-areas/${serviceAreaId}`, { method: "DELETE" });

export const saveProviderAvailability = (providerId, availability) =>
  apiClient(`/api/provider/availability${buildQuery({ providerId })}`, {
    method: "POST",
    body: availability,
  });
