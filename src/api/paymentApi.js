import { apiClient, buildQuery } from "./apiClient";

export const createPayment = (bookingId, paymentMethod) =>
  apiClient(`/api/customer/bookings/${bookingId}/payment`, {
    method: "POST",
    body: { paymentMethod },
  });

export const getCustomerPayments = (customerId) =>
  apiClient(`/api/customer/payments${buildQuery({ customerId })}`);

export const getAdminPayments = () => apiClient("/api/admin/payments");
