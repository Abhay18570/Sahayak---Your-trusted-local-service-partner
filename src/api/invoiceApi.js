import { ApiError, BASE_URL, apiClient } from "./apiClient";

export const getInvoiceByBooking = (bookingId) =>
  apiClient(`/api/invoices/booking/${bookingId}`);

export const getInvoices = () => apiClient("/api/invoices");

export const downloadInvoicePdf = async (bookingId) => {
  const response = await fetch(`${BASE_URL}/api/invoices/booking/${bookingId}/download`, {
    credentials: "include",
    headers: {
      Accept: "application/pdf",
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new ApiError(
      message || `Invoice download failed (${response.status})`,
      response.status,
      message
    );
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = `invoice-booking-${bookingId}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
};
