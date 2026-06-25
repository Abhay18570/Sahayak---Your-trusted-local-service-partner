import { getMaskedAadhaar } from "../utils/providerKyc";

export function unwrapList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.content)) return response.content;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.content)) return response.data.content;
  const nestedList = response && typeof response === "object"
    ? Object.values(response).find(Array.isArray)
    : null;
  if (nestedList) return nestedList;
  return [];
}

export function normalizeCategory(category) {
  return {
    ...category,
    id: category.id ?? category.slug ?? category.name,
    label: category.label ?? category.name ?? "Service",
  };
}

export function normalizeProvider(provider) {
  const safeProvider = { ...provider };
  delete safeProvider.aadhaarNumber;
  if (safeProvider.user && typeof safeProvider.user === "object") {
    safeProvider.user = { ...safeProvider.user };
    delete safeProvider.user.aadhaarNumber;
  }
  if (safeProvider.providerProfile && typeof safeProvider.providerProfile === "object") {
    safeProvider.providerProfile = { ...safeProvider.providerProfile };
    delete safeProvider.providerProfile.aadhaarNumber;
  }
  const service = provider.providerService ?? provider.providerServices?.[0] ?? provider.services?.[0];
  const name = provider.name ?? provider.user?.name ?? "Provider";
  const category =
    provider.category?.name ??
    provider.category ??
    provider.categoryName ??
    service?.category?.name ??
    provider.serviceName ??
    "Service";

  return {
    ...safeProvider,
    id: provider.id ?? provider.providerId ?? provider.userId,
    providerId: provider.providerId ?? provider.id ?? provider.userId,
    providerServiceId:
      provider.providerServiceId ?? provider.serviceId ?? service?.id,
    name,
    initials: provider.initials ?? name.split(" ").map((part) => part[0]).join("").slice(0, 2),
    profileImageUrl:
      provider.profileImageUrl ??
      provider.user?.profileImageUrl ??
      provider.providerProfile?.profileImageUrl ??
      "",
    aadhaarMasked: getMaskedAadhaar(provider),
    category,
    locality: provider.locality ?? provider.serviceArea ?? provider.user?.locality ?? "",
    rating: Number(provider.rating ?? provider.averageRating ?? 0),
    reviews: Number(provider.reviews ?? provider.totalReviews ?? 0),
    price: Number(provider.price ?? service?.price ?? provider.quotedAmount ?? 0),
    priceUnit: provider.priceUnit ?? service?.priceUnit ?? "visit",
    experience: Number(provider.experience ?? provider.experienceYears ?? 0),
    verified: provider.verified ?? provider.verificationStatus === "VERIFIED",
    tags: provider.tags ?? provider.skills?.map((skill) => skill.name ?? skill) ?? [],
  };
}

export function normalizeBooking(booking) {
  return {
    ...booking,
    id: booking.bookingId ?? booking.id,
    bookingId: booking.bookingId ?? booking.id,
    status: String(booking.status ?? "REQUESTED").toUpperCase(),
  };
}
