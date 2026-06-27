import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ToolIcon from "../components/ToolIcon";
import ProviderAvatar from "../components/ProviderAvatar";
import { useAuth } from "../context/AuthContext";
import {
  getCompletionImages,
  getProviderBookings,
  saveCompletionImage,
  updateBookingStatus,
} from "../api/bookingApi";
import { normalizeBooking, normalizeProvider, unwrapList } from "../api/normalizers";
import { getUser } from "../api/userApi";
import {
  addProviderServiceArea,
  deleteProviderServiceArea,
  getProvider,
  getProviderEarnings,
  getProviderServiceAreas,
  uploadProviderImage,
} from "../api/providerApi";
import { getProviderWallet } from "../api/walletApi";
import { getMaskedAadhaar } from "../utils/providerKyc";

export default function ProviderDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [earnings, setEarnings] = useState(null);
  const [earningsLoading, setEarningsLoading] = useState(true);
  const [earningsError, setEarningsError] = useState("");
  const [wallet, setWallet] = useState(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [walletError, setWalletError] = useState("");
  const [serviceAreas, setServiceAreas] = useState([]);
  const [serviceAreasLoading, setServiceAreasLoading] = useState(true);
  const [serviceAreasError, setServiceAreasError] = useState("");
  const [providerProfile, setProviderProfile] = useState(() => normalizeProvider(user || {}));
  const [updatingId, setUpdatingId] = useState(null);
  const [customerNames, setCustomerNames] = useState({});
  const providerId = user?.providerId ?? user?.id ?? user?.userId;

  useEffect(() => {
    if (!providerId) return;

    getProvider(providerId)
      .then((response) => {
        const profile = response?.provider || response?.data?.provider || response?.data || response;
        setProviderProfile(normalizeProvider({ ...user, ...profile }));
      })
      .catch(() => setProviderProfile(normalizeProvider(user || {})));
  }, [providerId, user]);

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
    if (!providerId) {
      setWalletError("Your provider account ID is missing.");
      setWalletLoading(false);
      return;
    }

    setWalletLoading(true);
    setWalletError("");
    getProviderWallet(providerId)
      .then((response) => setWallet(response?.data || response))
      .catch((err) =>
        setWalletError(err.message || "Unable to load your wallet summary.")
      )
      .finally(() => setWalletLoading(false));
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
      setError(
        status === "WORK_DONE" && err.status === 400
          ? "Please upload completion image before marking work done."
          : err.message || "Unable to update booking status."
      );
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

        <ProviderKycSummary provider={providerProfile} />

        <EarningsSummary
          earnings={earnings}
          loading={earningsLoading}
          error={earningsError}
        />

        <WalletSummary
          wallet={wallet}
          loading={walletLoading}
          error={walletError}
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

function ProviderKycSummary({ provider }) {
  const maskedAadhaar = getMaskedAadhaar(provider);

  return (
    <section className="surface-card provider-kyc-summary" aria-label="Provider profile">
      <ProviderAvatar
        className="dp-avatar"
        imageUrl={provider.profileImageUrl}
        initials={provider.initials}
        alt={`${provider.name} profile`}
      />
      <div>
        <strong>{provider.name}</strong>
        <span>{provider.category}</span>
        {maskedAadhaar && <span>Aadhaar: {maskedAadhaar}</span>}
      </div>
    </section>
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

function WalletSummary({ wallet, loading, error }) {
  const cards = [
    ["Total Earnings", formatCurrency(wallet?.totalEarnings), "star"],
    ["Pending Earnings", formatCurrency(wallet?.pendingEarnings), "history"],
    ["Withdrawable Balance", formatCurrency(wallet?.withdrawableBalance), "check"],
    ["Total Paid Jobs", wallet?.totalPaidJobs ?? 0, "wrench"],
  ];

  return (
    <section className="provider-wallet-section" aria-labelledby="provider-wallet-title">
      <div className="provider-section-heading">
        <span className="eyebrow">Wallet</span>
        <h2 id="provider-wallet-title">Provider wallet</h2>
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
          Loading wallet...
        </div>
      ) : !error ? (
        <div className="provider-wallet-grid">
          {cards.map(([title, value, icon]) => (
            <article className="admin-metric-card provider-wallet-card" key={title}>
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
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [completionImages, setCompletionImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [proofError, setProofError] = useState("");
  const [proofMessage, setProofMessage] = useState("");
  const availableActions = {
    REQUESTED: ["ACCEPTED", "CANCELLED"],
    ACCEPTED: ["CANCELLED"],
  }[booking.status] || [];

  useEffect(() => {
    let active = true;
    if (!["ACCEPTED", "WORK_DONE", "COMPLETED"].includes(booking.status)) return undefined;

    getCompletionImages(booking.bookingId)
      .then((response) => {
        if (active) setCompletionImages(normalizeCompletionImages(response));
      })
      .catch(() => {
        if (active) setCompletionImages([]);
      });

    return () => {
      active = false;
    };
  }, [booking.bookingId, booking.status]);

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl]
  );

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      setPreviewUrl("");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type) || !/\.(jpe?g|png|webp)$/i.test(file.name)) {
      event.target.value = "";
      setSelectedFile(null);
      setPreviewUrl("");
      setProofError("Choose a JPG, JPEG, PNG or WEBP image.");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setProofError("");
    setProofMessage("");
  };

  const handleUploadProof = async () => {
    if (!selectedFile) {
      setProofError("Please select a completion image to upload.");
      return;
    }

    setUploading(true);
    setProofError("");
    setProofMessage("");
    try {
      const uploadResponse = await uploadProviderImage(selectedFile);
      const imageUrl =
        uploadResponse?.imageUrl ??
        uploadResponse?.data?.imageUrl ??
        uploadResponse?.url;

      if (!imageUrl) throw new Error("No image URL was returned after upload.");

      await saveCompletionImage(booking.bookingId, imageUrl);
      setCompletionImages((current) => [...current, imageUrl]);
      setSelectedFile(null);
      setPreviewUrl("");
      setProofMessage("Completion image uploaded successfully.");
    } catch (err) {
      setProofError(err.message || "Unable to upload completion image.");
    } finally {
      setUploading(false);
    }
  };

  const handleMarkWorkDone = () => {
    if (completionImages.length === 0) {
      setProofError("Please upload completion image before marking work done.");
      return;
    }

    setProofError("");
    onStatusChange(booking.bookingId, "WORK_DONE");
  };

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
      {booking.status === "ACCEPTED" && (
        <div className="completion-proof-upload">
          <h6>Upload completion image</h6>
          <div className="input-with-icon">
            <ToolIcon name="user" size={17} />
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              disabled={uploading || updating}
            />
          </div>
          {previewUrl && (
            <div className="completion-proof-card">
              <img src={previewUrl} alt="Selected work completion preview" />
              <span>{selectedFile?.name}</span>
            </div>
          )}
          {proofError && (
            <div className="auth-alert auth-alert-error" role="alert">{proofError}</div>
          )}
          {proofMessage && (
            <div className="auth-alert auth-alert-success" role="status">{proofMessage}</div>
          )}
          <div className="provider-booking-actions">
            <button
              type="button"
              className="btn-sahayak btn-sahayak-outline btn-sm"
              disabled={uploading || updating || !selectedFile}
              onClick={handleUploadProof}
            >
              {uploading ? "Uploading..." : "Upload proof"}
            </button>
            <button
              type="button"
              className="btn-sahayak btn-sahayak-teal btn-sm"
              disabled={uploading || updating}
              onClick={handleMarkWorkDone}
            >
              {updating ? "Updating..." : "Mark work done"}
            </button>
          </div>
        </div>
      )}

      {["WORK_DONE", "COMPLETED"].includes(booking.status) && completionImages.length > 0 && (
        <CompletionProofGallery images={completionImages} />
      )}

      {availableActions.length > 0 && (
        <div className="provider-booking-actions">
          {availableActions.map((status) => (
            <button
              key={status}
              className={`btn-sahayak ${status === "CANCELLED" ? "btn-sahayak-outline" : "btn-sahayak-teal"} btn-sm`}
              disabled={updating || uploading}
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

function CompletionProofGallery({ images }) {
  return (
    <div className="completion-proof-gallery">
      <strong>Work completion proof</strong>
      <div>
        {images.map((imageUrl, index) => (
          <a href={imageUrl} target="_blank" rel="noreferrer" key={`${imageUrl}-${index}`}>
            <img src={imageUrl} alt={`Work completion proof ${index + 1}`} />
          </a>
        ))}
      </div>
    </div>
  );
}

function normalizeCompletionImages(response) {
  const value =
    response?.completionImages ??
    response?.images ??
    response?.data?.completionImages ??
    response?.data?.images ??
    response?.data ??
    response;
  const images = Array.isArray(value) ? value : value ? [value] : [];

  return images
    .map((image) =>
      typeof image === "string"
        ? image
        : image?.imageUrl ?? image?.url ?? image?.completionImageUrl
    )
    .filter(Boolean);
}

function formatDateTime(value) {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function formatStatus(status) {
  const value = String(status || "").replace(/_/g, " ").toLowerCase();
  return value ? value[0].toUpperCase() + value.slice(1) : "Unknown";
}

function formatCurrency(value) {
  const amount = Number(value ?? 0);
  return `₹${Number.isFinite(amount) ? amount.toLocaleString("en-IN") : "0"}`;
}
