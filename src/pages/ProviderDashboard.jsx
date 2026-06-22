import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ToolIcon from "../components/ToolIcon";
import { useAuth } from "../context/AuthContext";
import { getProviderBookings, updateBookingStatus } from "../api/bookingApi";
import { normalizeBooking, unwrapList } from "../api/normalizers";
import { getUser } from "../api/userApi";

export default function ProviderDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [customerNames, setCustomerNames] = useState({});
  const providerId = user?.providerId ?? user?.id ?? user?.userId;

  const loadBookings = async () => {
    if (!providerId) {
      setError("Your provider account ID is missing.");
      setLoading(false);
      return;
    }

    const response = await getProviderBookings(providerId);
    setBookings(unwrapList(response).map(normalizeBooking));
  };

  useEffect(() => {
    setLoading(true);
    loadBookings()
      .catch((err) => setError(err.message || "Unable to load booking requests."))
      .finally(() => setLoading(false));
    // providerId changes only when the authenticated account changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerId]);

  useEffect(() => {
    const unresolvedCustomers = [...new Map(
      bookings
        .filter(
          (booking) =>
            booking.customerId != null &&
            !Object.prototype.hasOwnProperty.call(customerNames, booking.customerId)
        )
        .map((booking) => [booking.customerId, booking])
    ).values()];

    if (unresolvedCustomers.length === 0) return;

    Promise.all(
      unresolvedCustomers.map(async (booking) => {
        const embeddedName = booking.customerName || booking.customer?.name;
        if (embeddedName) return [booking.customerId, embeddedName];

        try {
          const response = await getUser(booking.customerId);
          const customer = response?.user || response?.data?.user || response?.data || response || {};
          const name = customer.name ||
            [customer.firstName, customer.lastName].filter(Boolean).join(" ");
          return [booking.customerId, name || null];
        } catch {
          return [booking.customerId, null];
        }
      })
    ).then((entries) => {
      setCustomerNames((current) => {
        const next = { ...current };
        entries.forEach(([customerId, name]) => {
          next[customerId] = name;
        });
        return next;
      });
    });
  }, [bookings, customerNames]);

  const changeStatus = async (bookingId, status) => {
    setUpdatingId(bookingId);
    setError("");
    try {
      const updated = normalizeBooking(await updateBookingStatus(bookingId, status));
      setBookings((current) =>
        current.map((booking) => booking.bookingId === bookingId ? updated : booking)
      );
    } catch (err) {
      setError(err.message || "Unable to update booking status.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="container-sahayak">
        <div className="dashboard-header">
          <h1>Welcome{user?.name ? `, ${user.name}` : ""}</h1>
          <p>Your provider dashboard — manage job requests, your profile and earnings.</p>
        </div>

        {error && (
          <div className="auth-alert" style={{ background: "#fbe7e3", color: "#7a2f24" }}>
            {error}
          </div>
        )}

        {loading ? (
          <div className="empty-state surface-card" style={{ marginTop: "2rem" }}>
            <h5>Loading job requests...</h5>
          </div>
        ) : bookings.length === 0 ? (
          <div className="empty-state surface-card" style={{ marginTop: "2rem" }}>
            <ToolIcon name="wrench" size={36} />
            <h5>No job requests yet</h5>
            <p>
              New booking requests from customers near you will show up here as soon as they
              come in.
            </p>
            <Link to="/" className="btn-sahayak btn-sahayak-teal" style={{ marginTop: "1rem" }}>
              Back to home
            </Link>
          </div>
        ) : (
          <div className="dashboard-provider-list" style={{ marginTop: "2rem" }}>
            {bookings.map((booking) => (
              <BookingRequestCard
                key={booking.bookingId}
                booking={booking}
                customerName={customerNames[booking.customerId]}
                updating={updatingId === booking.bookingId}
                onStatusChange={changeStatus}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BookingRequestCard({ booking, customerName, updating, onStatusChange }) {
  const availableActions = {
    REQUESTED: ["ACCEPTED", "CANCELLED"],
    ACCEPTED: ["COMPLETED", "CANCELLED"],
  }[booking.status] || [];

  return (
    <article className="surface-card provider-booking-card" style={{ padding: "1.5rem" }}>
      <div className="results-meta">
        <div>
          <span className="eyebrow">{booking.bookingNumber || `Booking #${booking.bookingId}`}</span>
          <h5 style={{ marginTop: "0.5rem" }}>{booking.description || "Service request"}</h5>
        </div>
        <span className={`status-badge ${booking.status.toLowerCase()}`}>
          {formatStatus(booking.status)}
        </span>
      </div>
      <p>
        <strong>Customer:</strong>{" "}
        {customerName || (booking.customerId != null ? `Customer #${booking.customerId}` : "Customer")}
      </p>
      <p><strong>Address:</strong> {booking.serviceAddress || "Not provided"}</p>
      <p><strong>Scheduled:</strong> {formatDateTime(booking.scheduledAt)}</p>
      <p><strong>Quoted amount:</strong> ₹{booking.quotedAmount ?? 0}</p>
      {availableActions.length > 0 && (
        <div className="provider-booking-actions">
          {availableActions.map((status) => (
            <button
              key={status}
              className={`btn-sahayak ${status === "CANCELLED" ? "btn-sahayak-outline" : "btn-sahayak-teal"} btn-sm`}
              disabled={updating}
              onClick={() => onStatusChange(booking.bookingId, status)}
            >
              {updating ? "Updating..." : formatStatus(status)}
            </button>
          ))}
        </div>
      )}
    </article>
  );
}

function formatDateTime(value) {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function formatStatus(status) {
  const value = String(status || "").toLowerCase();
  return value ? value[0].toUpperCase() + value.slice(1) : "Unknown";
}
