export function getProviderImageUrl(provider = {}) {
  return (
    provider.profileImageUrl ??
    provider.user?.profileImageUrl ??
    provider.providerProfile?.profileImageUrl ??
    ""
  );
}

export function getMaskedAadhaar(provider = {}) {
  const value =
    provider.aadhaarMasked ??
    provider.user?.aadhaarMasked ??
    provider.providerProfile?.aadhaarMasked ??
    provider.aadhaarNumber ??
    provider.user?.aadhaarNumber ??
    "";
  const digits = String(value).replace(/\D/g, "");

  return digits.length >= 4 ? `XXXX-XXXX-${digits.slice(-4)}` : "";
}
