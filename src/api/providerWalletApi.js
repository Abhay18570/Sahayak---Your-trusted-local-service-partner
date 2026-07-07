import { apiClient, buildQuery } from "./apiClient";

export const getProviderWallet = (providerId) =>
  apiClient(`/api/provider/wallet${buildQuery({ providerId })}`);

export const saveProviderBankDetails = (payload) =>
  apiClient("/api/provider/wallet/bank-details", {
    method: "POST",
    body: payload,
  });

export const getProviderBankDetails = (providerId) =>
  apiClient(`/api/provider/wallet/bank-details${buildQuery({ providerId })}`);

export const withdrawProviderAmount = (payload) =>
  apiClient("/api/provider/wallet/withdraw", {
    method: "POST",
    body: payload,
  });

export const getProviderWithdrawals = (providerId) =>
  apiClient(`/api/provider/wallet/withdrawals${buildQuery({ providerId })}`);
