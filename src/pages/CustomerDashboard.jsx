import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import ToolIcon from "../components/ToolIcon";
import { useAuth } from "../context/AuthContext";
import { getCategories } from "../api/categoryApi";
import { getProvider, getProviders } from "../api/providerApi";
import {
  cancelBooking,
  createBooking,
  getCustomerBookings,
  hideBooking,
} from "../api/bookingApi";
import { createReview } from "../api/reviewApi";
import { createPayment, getCustomerPayments } from "../api/paymentApi";
import {
  normalizeBooking,
  normalizeCategory,
  normalizeProvider,
  unwrapList,
} from "../api/normalizers";

const TABS = [
  { id: "search", label: "Search services", icon: "search" },
  { id: "recommended", label: "Recommended for you", icon: "star" },
  { id: "history", label: "Booking history", icon: "history" },
];

export default function CustomerDashboard() {
  const location = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("search");
  const [query, setQuery] = useState(location.state?.service || "");
  const [locality, setLocality] = useState(location.state?.locality || "");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [minRating, setMinRating] = useState(0);
  const [maxPrice, setMaxPrice] = useState(600);
  const [sortBy, setSortBy] = useState("rating");
  const [categories, setCategories] = useState([]);
  const [providers, setProviders] = useState([]);
  const [bookingHistory, setBookingHistory] = useState([]);
  const [paymentsByBooking, setPaymentsByBooking] = useState({});
  const [providerNames, setProviderNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [cancellingBookingId, setCancellingBookingId] = useState(null);
  const [hidingBookingId, setHidingBookingId] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [confirmingBooking, setConfirmingBooking] = useState(false);

  const customerId = user?.customerId ?? user?.id ?? user?.userId;

  const loadBookings = async () => {
    if (!customerId) return;
    const response = await getCustomerBookings(customerId);
    setBookingHistory(unwrapList(response).map(normalizeBooking));
  };

  const loadPayments = async () => {
    if (!customerId) return;
    const response = await getCustomerPayments(customerId);
    const payments = unwrapList(response);
    setPaymentsByBooking(Object.fromEntries(
      payments
        .map((payment) => [payment.bookingId ?? payment.booking?.id, payment])
        .filter(([bookingId]) => bookingId != null)
    ));
  };

  useEffect(() => {
    let active = true;

    Promise.all([getCategories(), getProviders()])
      .then(([categoryResponse, providerResponse]) => {
        if (!active) return;
        setCategories(unwrapList(categoryResponse).map(normalizeCategory));
        setProviders(unwrapList(providerResponse).map(normalizeProvider));
      })
      .catch((err) => active && setNotice({ type: "error", text: err.message }))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    Promise.all([loadBookings(), loadPayments()])
      .catch((err) => setNotice({ type: "error", text: err.message }));
    // customerId changes only when the authenticated account changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  useEffect(() => {
    const missingProviderIds = [...new Set(
      bookingHistory
        .map((booking) => booking.providerId)
        .filter((id) => id != null && !providerNames[id])
    )];

    if (missingProviderIds.length === 0) return;

    Promise.all(
      missingProviderIds.map(async (providerId) => {
        try {
          const response = await getProvider(providerId);
          const provider = normalizeProvider(response?.provider || response?.data || response);
          return [providerId, provider.name];
        } catch {
          return [providerId, null];
        }
      })
    ).then((entries) => {
      setProviderNames((current) => {
        const next = { ...current };
        entries.forEach(([providerId, name]) => {
          next[providerId] = name || "Provider";
        });
        return next;
      });
    });
  }, [bookingHistory, providerNames]);

  const handleBook = (provider) => {
    if (!customerId) {
      setNotice({ type: "error", text: "Your customer account ID is missing." });
      return;
    }

    setNotice(null);
    setSelectedProvider(provider);
  };

  const handleConfirmBooking = async (paymentMethod) => {
    const provider = selectedProvider;
    if (!provider) return;

    setConfirmingBooking(true);
    let createdBooking;
    try {
      const response = await createBooking({
        customerId,
        providerId: provider.providerId,
        providerServiceId: provider.providerServiceId ?? provider.id,
        description: `${provider.category} service request`,
        serviceAddress: user?.locality || locality || provider.locality,
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        quotedAmount: provider.price,
      });
      createdBooking = response?.booking || response?.data?.booking || response?.data || response;
    } catch (err) {
      setNotice({ type: "error", text: err.message || "Unable to create booking." });
      setConfirmingBooking(false);
      return;
    }

    const bookingId = createdBooking?.bookingId ?? createdBooking?.id;
    let paymentFailed = false;
    if (paymentMethod && bookingId != null) {
      try {
        const paymentResponse = await createPayment(bookingId, paymentMethod);
        const payment = paymentResponse?.payment ||
          paymentResponse?.data?.payment ||
          paymentResponse?.data ||
          paymentResponse;
        setPaymentsByBooking((current) => ({ ...current, [bookingId]: payment }));
      } catch {
        paymentFailed = true;
      }
    } else if (paymentMethod) {
      paymentFailed = true;
    }

    try {
      await Promise.all([loadBookings(), loadPayments()]);
    } catch {
      // The booking and payment results above remain valid even if refreshing fails.
    }

    setSelectedProvider(null);
    setConfirmingBooking(false);
    setActiveTab("history");
    setNotice({
      type: paymentFailed ? "error" : "success",
      text: paymentFailed
        ? `Booking created with ${provider.name}, but payment failed. You can retry from booking history.`
        : `Booking confirmed with ${provider.name}. Payment recorded via ${paymentMethod}.`,
    });
  };

  const handleProviderSearch = async () => {
    setLoading(true);
    setNotice(null);
    try {
      const response = await getProviders({
        query,
        category: selectedCategories[0],
        maxPrice,
        sort: sortBy,
      });
      setProviders(unwrapList(response).map(normalizeProvider));
    } catch (err) {
      setNotice({ type: "error", text: err.message || "Unable to search providers." });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    setCancellingBookingId(bookingId);
    setNotice(null);
    try {
      await cancelBooking(bookingId);
      await loadBookings();
      setNotice({ type: "success", text: "Booking cancelled successfully." });
    } catch (err) {
      setNotice({ type: "error", text: err.message || "Unable to cancel booking." });
    } finally {
      setCancellingBookingId(null);
    }
  };

  const handleHideBooking = async (bookingId) => {
    if (!window.confirm("Remove this booking from your history?")) return;

    setHidingBookingId(bookingId);
    setNotice(null);
    try {
      await hideBooking(bookingId);
      await loadBookings();
      setNotice({ type: "success", text: "Booking removed from your history." });
    } catch (err) {
      setNotice({ type: "error", text: err.message || "Unable to remove booking history." });
    } finally {
      setHidingBookingId(null);
    }
  };

  const toggleCategory = (label) => {
    setSelectedCategories((prev) =>
      prev.includes(label) ? prev.filter((c) => c !== label) : [...prev, label]
    );
  };

  const filteredProviders = useMemo(() => {
    let list = providers.filter((p) => {
      const matchesQuery =
        !query ||
        p.category.toLowerCase().includes(query.toLowerCase()) ||
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()));
      const matchesLocality =
        !locality || p.locality.toLowerCase().includes(locality.toLowerCase());
      const matchesCategory =
        selectedCategories.length === 0 || selectedCategories.includes(p.category);
      const matchesRating = p.rating >= minRating;
      const matchesPrice = p.price <= maxPrice;
      return matchesQuery && matchesLocality && matchesCategory && matchesRating && matchesPrice;
    });

    if (sortBy === "rating") list = [...list].sort((a, b) => b.rating - a.rating);
    if (sortBy === "price-low") list = [...list].sort((a, b) => a.price - b.price);
    if (sortBy === "price-high") list = [...list].sort((a, b) => b.price - a.price);
    if (sortBy === "experience") list = [...list].sort((a, b) => b.experience - a.experience);

    return list;
  }, [providers, query, locality, selectedCategories, minRating, maxPrice, sortBy]);

  const recommended = providers.slice(0, 3);

  const clearFilters = () => {
    setSelectedCategories([]);
    setMinRating(0);
    setMaxPrice(600);
  };

  return (
    <div className="dashboard-page">
      <div className="container-sahayak">
        <div className="dashboard-header">
          <h1>Find your next service</h1>
          <p>Search verified providers, compare ratings and prices, then book in a few taps.</p>
        </div>

        <div className="dashboard-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`dashboard-tab ${activeTab === t.id ? "active" : ""}`}
              onClick={() => setActiveTab(t.id)}
            >
              <ToolIcon name={t.icon} size={16} /> {t.label}
            </button>
          ))}
        </div>

        {notice && (
          <div
            className="auth-alert"
            style={{
              marginBottom: "1rem",
              background: notice.type === "error" ? "#fbe7e3" : "var(--teal-100)",
              color: notice.type === "error" ? "#7a2f24" : "var(--teal-700)",
            }}
          >
            {notice.text}
          </div>
        )}

        {selectedProvider && (
          <BookingConfirmationModal
            key={selectedProvider.id}
            provider={selectedProvider}
            submitting={confirmingBooking}
            onClose={() => !confirmingBooking && setSelectedProvider(null)}
            onConfirm={handleConfirmBooking}
          />
        )}

        {activeTab === "search" && (
          <>
            <div className="dashboard-search-bar">
              <label className="input-with-icon" style={{ border: "1.5px solid var(--line)" }}>
                <ToolIcon name="search" size={18} />
                <input
                  type="text"
                  placeholder="Search by service, name or skill"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              <label className="input-with-icon" style={{ border: "1.5px solid var(--line)" }}>
                <ToolIcon name="pin" size={18} />
                <input
                  type="text"
                  placeholder="Locality"
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                />
              </label>
              <button
                className="btn-sahayak btn-sahayak-teal"
                onClick={handleProviderSearch}
                disabled={loading}
              >
                {loading ? "Searching..." : "Search"}
              </button>
            </div>

            <div className="dashboard-layout">
              {/* ---------- FILTER PANEL ---------- */}
              <aside className="filter-panel">
                <div className="filter-panel-head">
                  <h6>
                    <ToolIcon name="filter" size={16} /> Filters
                  </h6>
                  <button onClick={clearFilters}>Clear all</button>
                </div>

                <div className="filter-group">
                  <div className="filter-group-title">Category</div>
                  <div className="filter-chip-list">
                    {categories.map((c) => (
                      <label className="filter-checkbox" key={c.id}>
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(c.label)}
                          onChange={() => toggleCategory(c.label)}
                        />
                        {c.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="filter-group">
                  <div className="filter-group-title">Minimum rating</div>
                  {[0, 4, 4.5, 4.8].map((r) => (
                    <div
                      key={r}
                      className={`filter-rating-row ${minRating === r ? "active" : ""}`}
                      onClick={() => setMinRating(r)}
                    >
                      <ToolIcon name="star" size={14} />
                      {r === 0 ? "Any rating" : `${r}+ rating`}
                    </div>
                  ))}
                </div>

                <div className="filter-group">
                  <div className="filter-group-title">Max price per visit</div>
                  <div className="price-slider-row">
                    <span>₹0</span>
                    <strong>₹{maxPrice}</strong>
                    <span>₹600+</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="600"
                    step="10"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    style={{ width: "100%", accentColor: "var(--teal-700)" }}
                  />
                </div>
              </aside>

              {/* ---------- RESULTS ---------- */}
              <div>
                <div className="results-meta">
                  <span>{filteredProviders.length} providers found</span>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="rating">Sort: Highest rated</option>
                    <option value="price-low">Sort: Price (low to high)</option>
                    <option value="price-high">Sort: Price (high to low)</option>
                    <option value="experience">Sort: Most experienced</option>
                  </select>
                </div>

                {loading ? (
                  <div className="empty-state surface-card">
                    <h5>Loading providers...</h5>
                  </div>
                ) : filteredProviders.length === 0 ? (
                  <div className="empty-state surface-card">
                    <ToolIcon name="search" size={36} />
                    <h5>No providers match those filters</h5>
                    <p>Try widening your price range or clearing a category filter.</p>
                  </div>
                ) : (
                  <div className="dashboard-provider-list">
                    {filteredProviders.map((p) => (
                      <ProviderRow key={p.id} provider={p} onBook={handleBook} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === "recommended" && (
          <div>
            <div className="section-head" style={{ marginBottom: "1.4rem" }}>
              <div>
                <span className="eyebrow">Picked for you</span>
                <h2 style={{ fontSize: "1.4rem" }}>Recommended providers</h2>
                <p>Based on services you've booked before and what's popular in your area.</p>
              </div>
            </div>
            <div className="recommended-strip">
              {recommended.map((p) => (
                <RecommendedCard key={p.id} provider={p} onBook={handleBook} />
              ))}
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div>
            <div className="section-head" style={{ marginBottom: "1.4rem" }}>
              <div>
                <span className="eyebrow">Your activity</span>
                <h2 style={{ fontSize: "1.4rem" }}>Booking history</h2>
                <p>Every job you've booked through Sahayak, in one place.</p>
              </div>
            </div>

            {bookingHistory.length === 0 ? (
              <div className="empty-state surface-card">
                <ToolIcon name="history" size={36} />
                <h5>No bookings yet</h5>
                <p>Once you book a service, it'll show up here.</p>
              </div>
            ) : (
              <div className="booking-table-wrap">
                <table className="booking-table">
                  <thead>
                    <tr>
                      <th>Booking ID</th>
                      <th>Service</th>
                      <th>Provider</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookingHistory.map((b) => (
                      <React.Fragment key={b.bookingId}>
                        <tr>
                          <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem" }}>
                            {b.bookingNumber || b.bookingId}
                          </td>
                          <td>{b.service || b.category || b.description || "Service"}</td>
                          <td>
                            {b.providerName || b.provider?.name || providerNames[b.providerId] || "Provider"}
                          </td>
                          <td>{formatDate(b.scheduledAt || b.createdAt)}</td>
                          <td>
                            <div className="booking-status-actions">
                              <span className={`status-badge ${b.status.toLowerCase()}`}>
                                {b.status === "COMPLETED" && <ToolIcon name="check" size={12} />}
                                {formatStatus(b.status)}
                              </span>
                              {(b.status === "REQUESTED" || b.status === "ACCEPTED") && (
                                <button
                                  type="button"
                                  className="btn-sahayak btn-sahayak-outline btn-sm"
                                  disabled={cancellingBookingId === b.bookingId}
                                  onClick={() => handleCancelBooking(b.bookingId)}
                                >
                                  {cancellingBookingId === b.bookingId ? "Cancelling..." : "Cancel booking"}
                                </button>
                              )}
                              <button
                                type="button"
                                className="btn-sahayak btn-sahayak-outline btn-sm"
                                disabled={hidingBookingId === b.bookingId}
                                onClick={() => handleHideBooking(b.bookingId)}
                              >
                                {hidingBookingId === b.bookingId ? "Removing..." : "Delete history"}
                              </button>
                            </div>
                          </td>
                          <td>
                            {Number(b.finalAmount ?? b.quotedAmount ?? 0) > 0
                              ? `₹${b.finalAmount ?? b.quotedAmount}`
                              : "—"}
                          </td>
                        </tr>
                        {b.status === "COMPLETED" && (
                          <tr>
                            <td colSpan="6">
                              <div className="booking-completed-actions">
                                <PaymentPanel
                                  booking={b}
                                  payment={paymentsByBooking[b.bookingId]}
                                  onPaymentCreated={(payment) =>
                                    setPaymentsByBooking((current) => ({
                                      ...current,
                                      [b.bookingId]: payment,
                                    }))
                                  }
                                />
                                <ReviewForm bookingId={b.bookingId} />
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ProviderRow({ provider: p, onBook }) {
  return (
    <article className="dashboard-provider-card">
      <div className="dp-avatar">{p.initials}</div>
      <div>
        <div className="dp-name-row">
          <strong>{p.name}</strong>
          {p.verified && <ToolIcon name="shield" size={15} />}
        </div>
        <div className="dp-meta-row">
          <span className="dp-meta-item">{p.category}</span>
          <span className="dp-meta-item">
            <ToolIcon name="pin" size={13} /> {p.locality}
          </span>
          <span className="dp-meta-item rating">
            <ToolIcon name="star" size={13} /> <strong>{p.rating}</strong> ({p.reviews})
          </span>
          <span className="dp-meta-item">{p.experience} yrs experience</span>
        </div>
        <div className="dp-tags">
          {p.tags.map((t) => (
            <span className="provider-tag" key={t}>
              {t}
            </span>
          ))}
        </div>
      </div>
      <div className="dp-actions">
        <div className="dp-price">
          <strong>₹{p.price}</strong> <span>/ {p.priceUnit}</span>
        </div>
        <button className="btn-sahayak btn-sahayak-teal btn-sm" onClick={() => onBook(p)}>
          Book now
        </button>
      </div>
    </article>
  );
}

function RecommendedCard({ provider: p, onBook }) {
  return (
    <article className="provider-card">
      <div className="provider-card-top">
        <div className="provider-avatar">{p.initials}</div>
        <div>
          <div className="provider-name-row">
            <strong>{p.name}</strong>
            {p.verified && <ToolIcon name="shield" size={15} />}
          </div>
          <div className="provider-category">{p.category}</div>
        </div>
      </div>
      <div className="provider-locality">
        <ToolIcon name="pin" size={14} /> {p.locality}
      </div>
      <div className="provider-rating-row">
        <ToolIcon name="star" size={15} />
        <strong>{p.rating}</strong>
        <span className="count">({p.reviews} reviews)</span>
      </div>
      <div className="provider-card-footer">
        <div className="provider-price">
          <strong>₹{p.price}</strong> <span>/ {p.priceUnit}</span>
        </div>
        <button className="btn-sahayak btn-sahayak-teal btn-sm" onClick={() => onBook(p)}>
          Book now
        </button>
      </div>
    </article>
  );
}

function BookingConfirmationModal({ provider, submitting, onClose, onConfirm }) {
  const [paymentMethod, setPaymentMethod] = useState("CASH");

  return (
    <div className="booking-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="booking-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <span className="eyebrow">Confirm service</span>
        <h2 id="booking-modal-title">Review your booking</h2>

        <div className="booking-modal-provider">
          <div className="provider-avatar">{provider.initials}</div>
          <div>
            <strong>{provider.name}</strong>
            <span>{provider.category}</span>
          </div>
          <div className="booking-modal-price">
            <strong>₹{provider.price}</strong>
            <span>/ {provider.priceUnit}</span>
          </div>
        </div>

        <div className="booking-payment-choice">
          <h6>Payment method</h6>
          <div className="booking-payment-methods">
            {["CASH", "UPI", "CARD"].map((method) => (
              <label key={method} className={paymentMethod === method ? "active" : ""}>
                <input
                  type="radio"
                  name="booking-payment-method"
                  value={method}
                  checked={paymentMethod === method}
                  onChange={() => setPaymentMethod(method)}
                />
                {method}
              </label>
            ))}
          </div>
        </div>

        <div className="booking-modal-actions">
          <button
            type="button"
            className="btn-sahayak btn-sahayak-outline"
            disabled={submitting}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-sahayak btn-sahayak-primary"
            disabled={submitting}
            onClick={() => onConfirm(paymentMethod)}
          >
            {submitting ? "Confirming..." : "Confirm booking"}
          </button>
        </div>
      </section>
    </div>
  );
}

function ReviewForm({ bookingId }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      await createReview(bookingId, { rating: Number(rating), comment });
      setMessage("Review submitted. Thank you.");
      setSubmitted(true);
    } catch (err) {
      setMessage(err.message || "Unable to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="booking-review-form">
      <strong>Rate this service</strong>
      <select disabled={submitted} value={rating} onChange={(event) => setRating(event.target.value)}>
        {[5, 4, 3, 2, 1].map((value) => (
          <option key={value} value={value}>{value} stars</option>
        ))}
      </select>
      <input
        type="text"
        value={comment}
        placeholder="Share your experience"
        disabled={submitted}
        onChange={(event) => setComment(event.target.value)}
        style={{ flex: 1 }}
      />
      <button className="btn-sahayak btn-sahayak-teal btn-sm" disabled={submitting || submitted}>
        {submitting ? "Submitting..." : "Submit review"}
      </button>
      {message && <span>{message}</span>}
    </form>
  );
}

function PaymentPanel({ booking, payment, onPaymentCreated }) {
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handlePayment = async () => {
    setSubmitting(true);
    setError("");
    try {
      const response = await createPayment(booking.bookingId, paymentMethod);
      onPaymentCreated(response?.payment || response?.data || response);
    } catch (err) {
      setError(err.message || "Unable to process payment.");
    } finally {
      setSubmitting(false);
    }
  };

  if (payment) {
    return (
      <div className="booking-payment-status">
        <strong>Payment: {formatStatus(payment.status || "PAID")}</strong>
        <span>Method: {payment.paymentMethod || payment.method || "—"}</span>
        <span>
          Transaction: {payment.transactionReference || payment.transactionId || payment.reference || "—"}
        </span>
      </div>
    );
  }

  return (
    <div className="booking-payment-panel">
      <strong>Payment</strong>
      <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
        <option value="CASH">Cash</option>
        <option value="UPI">UPI</option>
        <option value="CARD">Card</option>
      </select>
      <button
        type="button"
        className="btn-sahayak btn-sahayak-primary btn-sm"
        disabled={submitting}
        onClick={handlePayment}
      >
        {submitting ? "Processing..." : "Pay now"}
      </button>
      {error && <span style={{ color: "var(--danger)" }}>{error}</span>}
    </div>
  );
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

function formatStatus(status) {
  const value = String(status || "").toLowerCase();
  return value ? value[0].toUpperCase() + value.slice(1) : "Unknown";
}
