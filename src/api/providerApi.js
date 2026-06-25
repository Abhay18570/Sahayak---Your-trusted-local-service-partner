import { apiClient, ApiError, BASE_URL, buildQuery } from "./apiClient";

export const getProviders = (filters = {}) =>
  apiClient(`/api/providers${buildQuery(filters)}`);

export const getProvider = (id) => apiClient(`/api/providers/${id}`);

export const getProviderAvailability = (providerId) =>
  apiClient(`/api/providers/${providerId}/availability`);

export async function uploadProviderImage(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${BASE_URL}/api/uploads/provider-image`, {
    method: "POST",
    credentials: "include",
    headers: { Accept: "application/json" },
    body: formData,
  });
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      data?.message || data?.detail || data?.error || data || `Upload failed (${response.status})`;
    throw new ApiError(message, response.status, data);
  }

  return data;
}

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
