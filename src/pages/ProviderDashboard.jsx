import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ToolIcon from "../components/ToolIcon";
import { useAuth } from "../context/AuthContext";
import { getProviderBookings, updateBookingStatus } from "../api/bookingApi";
import { normalizeBooking, unwrapList } from "../api/normalizers";
import { getUser } from "../api/userApi";
import {
  addProviderServiceArea,
  deleteProviderServiceArea,
  getProviderEarnings,
  getProviderServiceAreas,
} from "../api/providerApi";

export default function ProviderDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [earnings, setEarnings] = useState(null);
  const [earningsLoading, setEarningsLoading] = useState(true);
  const [earningsError, setEarningsError] = useState("");
  const [serviceAreas, setServiceAreas] = useState([]);
  const [serviceAreasLoading, setServiceAreasLoading] = useState(true);
  const [serviceAreasError, setServiceAreasError] = useState("");
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

  const loadServiceAreas = async () => {
    if (!providerId) {
      setServiceAreasError("Your provider account ID is missing.");
      setServiceAreasLoading(false);
      return;
    }

    const response = await getProviderServiceAreas(providerId);
    setServiceAreas(unwrapList(response));
  };

  useEffect(() => {
    setServiceAreasLoading(true);
    setServiceAreasError("");
    loadServiceAreas()
      .catch((err) =>
        setServiceAreasError(err.message || "Unable to load your service areas.")
      )
      .finally(() => setServiceAreasLoading(false));
    // providerId changes only when the authenticated account changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerId]);

  useEffect(() => {
    if (!providerId) {
      setEarningsError("Your provider account ID is missing.");
      setEarningsLoading(false);
      return;
    }

    setEarningsLoading(true);
    setEarningsError("");
    getProviderEarnings(providerId)
      .then((response) => setEarnings(response?.data || response))
      .catch((err) =>
        setEarningsError(err.message || "Unable to load your earnings summary.")
      )
      .finally(() => setEarningsLoading(false));
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

        <EarningsSummary
          earnings={earnings}
          loading={earningsLoading}
          error={earningsError}
        />

        <ServiceAreasSection
          providerId={providerId}
          serviceAreas={serviceAreas}
          loading={serviceAreasLoading}
          error={serviceAreasError}
          onRefresh={loadServiceAreas}
          onError={setServiceAreasError}
        />

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

function ServiceAreasSection({
  providerId,
  serviceAreas,
  loading,
  error,
  onRefresh,
  onError,
}) {
  const [form, setForm] = useState({ locality: "", city: "", state: "" });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [message, setMessage] = useState("");

  const handleAdd = async (event) => {
    event.preventDefault();
    if (!form.locality.trim() || !form.city.trim() || !form.state.trim()) {
      onError("Enter locality, city and state.");
      return;
    }

    setSaving(true);
    setMessage("");
    onError("");
    try {
      await addProviderServiceArea(providerId, {
        locality: form.locality.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
      });
      await onRefresh();
      setForm({ locality: "", city: "", state: "" });
      setMessage("Service area added.");
    } catch (err) {
      onError(err.message || "Unable to add service area.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (serviceAreaId) => {
    setDeletingId(serviceAreaId);
    setMessage("");
    onError("");
    try {
      await deleteProviderServiceArea(serviceAreaId);
      await onRefresh();
      setMessage("Service area removed.");
    } catch (err) {
      onError(err.message || "Unable to delete service area.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="provider-service-areas-section">
      <div className="provider-section-heading">
        <span className="eyebrow">Coverage</span>
        <h2>Service areas</h2>
      </div>

      {error && (
        <div className="auth-alert" style={{ background: "#fbe7e3", color: "#7a2f24" }}>
          {error}
        </div>
      )}
      {message && (
        <div className="auth-alert" style={{ background: "#e3f3e8", color: "#25613c" }}>
          {message}
        </div>
      )}

      <div className="provider-service-areas-layout">
        <form className="surface-card provider-service-area-form" onSubmit={handleAdd}>
          <h3>Add service area</h3>
          <div className="form-field-group">
            <label htmlFor="service-area-locality">Locality</label>
            <div className="input-with-icon">
              <ToolIcon name="pin" size={17} />
              <input
                id="service-area-locality"
                type="text"
                value={form.locality}
                onChange={(event) =>
                  setForm((current) => ({ ...current, locality: event.target.value }))
                }
              />
            </div>
          </div>
          <div className="form-row-2">
            <div className="form-field-group">
              <label htmlFor="service-area-city">City</label>
              <div className="input-with-icon">
                <ToolIcon name="pin" size={17} />
                <input
                  id="service-area-city"
                  type="text"
                  value={form.city}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, city: event.target.value }))
                  }
                />
              </div>
            </div>
            <div className="form-field-group">
              <label htmlFor="service-area-state">State</label>
              <div className="input-with-icon">
                <ToolIcon name="pin" size={17} />
                <input
                  id="service-area-state"
                  type="text"
                  value={form.state}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, state: event.target.value }))
                  }
                />
              </div>
            </div>
          </div>
          <button
            type="submit"
            className="btn-sahayak btn-sahayak-teal btn-sm"
            disabled={saving || !providerId}
          >
            {saving ? "Adding..." : "Add service area"}
          </button>
        </form>

        <div className="provider-service-area-list">
          {loading ? (
            <div className="surface-card provider-earnings-loading">
              Loading service areas...
            </div>
          ) : serviceAreas.length === 0 ? (
            <div className="surface-card empty-state">
              <ToolIcon name="pin" size={30} />
              <h5>No service areas added</h5>
            </div>
          ) : (
            serviceAreas.map((area) => {
              const areaId = area.id ?? area.serviceAreaId;
              return (
                <article className="surface-card provider-service-area-card" key={areaId}>
                  <div>
                    <strong>{area.locality}</strong>
                    <span>{[area.city, area.state].filter(Boolean).join(", ")}</span>
                  </div>
                  <button
                    type="button"
                    className="btn-sahayak btn-sahayak-outline btn-sm"
                    disabled={deletingId === areaId}
                    onClick={() => handleDelete(areaId)}
                  >
                    {deletingId === areaId ? "Deleting..." : "Delete"}
                  </button>
                </article>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}

function EarningsSummary({ earnings, loading, error }) {
  const cards = [
    ["Total Earnings", formatCurrency(earnings?.totalEarnings), "star"],
    ["Monthly Earnings", formatCurrency(earnings?.monthlyEarnings), "calendar"],
    ["Completed Jobs", earnings?.completedJobs ?? 0, "check"],
    ["Total Payments", earnings?.totalPayments ?? 0, "wrench"],
  ];

  return (
    <section className="provider-earnings-section" aria-labelledby="provider-earnings-title">
      <div className="provider-section-heading">
        <span className="eyebrow">Earnings</span>
        <h2 id="provider-earnings-title">Your earnings overview</h2>
      </div>

      {error && (
        <div
          className="auth-alert"
          role="alert"
          style={{ background: "#fbe7e3", color: "#7a2f24" }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="provider-earnings-loading surface-card" aria-live="polite">
          Loading earnings...
        </div>
      ) : !error ? (
        <div className="provider-earnings-grid">
          {cards.map(([title, value, icon]) => (
            <article className="admin-metric-card" key={title}>
              <span className="admin-metric-icon">
                <ToolIcon name={icon} size={22} />
              </span>
              <div>
                <strong>{value}</strong>
                <span>{title}</span>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
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

function formatCurrency(value) {
  const amount = Number(value ?? 0);
  return `₹${Number.isFinite(amount) ? amount.toLocaleString("en-IN") : "0"}`;
}
