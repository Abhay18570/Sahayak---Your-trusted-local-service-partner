import { ApiError, BASE_URL, buildQuery } from "./apiClient";

export const getProviderWallet = async (providerId) => {
  const response = await fetch(
    `${BASE_URL}/api/provider/wallet${buildQuery({ providerId })}`,
    {
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    }
  );

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      data?.message || data?.detail || data?.error || data || `Wallet request failed (${response.status})`;
    throw new ApiError(message, response.status, data);
  }

  return data;
};
