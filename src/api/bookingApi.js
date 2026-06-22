import { apiClient, buildQuery } from "./apiClient";

export const createBooking = (booking) =>
  apiClient("/api/customer/bookings", { method: "POST", body: booking });

export const getCustomerBookings = (customerId) =>
  apiClient(`/api/customer/bookings${buildQuery({ customerId })}`);

export const getProviderBookings = (providerId) =>
  apiClient(`/api/provider/bookings${buildQuery({ providerId })}`);

export const updateBookingStatus = (bookingId, status) =>
  apiClient(`/api/provider/bookings/${bookingId}/status${buildQuery({ status })}`, {
    method: "PATCH",
  });

export const cancelBooking = (bookingId) =>
  apiClient(`/api/customer/bookings/${bookingId}/cancel`, { method: "PATCH" });

export const hideBooking = (bookingId) =>
  apiClient(`/api/customer/bookings/${bookingId}/hide`, { method: "PATCH" });
