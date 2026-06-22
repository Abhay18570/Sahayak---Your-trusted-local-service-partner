import { apiClient } from "./apiClient";

export const createReview = (bookingId, review) =>
  apiClient(`/api/customer/bookings/${bookingId}/reviews`, {
    method: "POST",
    body: review,
  });

export const getProviderReviews = (providerId) =>
  apiClient(`/api/providers/${providerId}/reviews`);
