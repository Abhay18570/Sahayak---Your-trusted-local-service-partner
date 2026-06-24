import { apiClient, buildQuery } from "./apiClient";

export const getCustomerProfile = (userId) =>
  apiClient(`/api/customer/profile${buildQuery({ userId })}`);

export const updateCustomerProfile = (userId, data) =>
  apiClient(`/api/customer/profile${buildQuery({ userId })}`, {
    method: "PUT",
    body: data,
  });
