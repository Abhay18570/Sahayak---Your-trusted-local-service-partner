import { apiClient } from "./apiClient";

export const createRazorpayOrder = (bookingId) =>
  apiClient(`/api/razorpay/bookings/${bookingId}/create-order`, {
    method: "POST",
  });

export const verifyRazorpayPayment = (bookingId, payload) =>
  apiClient(`/api/razorpay/bookings/${bookingId}/verify-payment`, {
    method: "POST",
    body: payload,
  });
