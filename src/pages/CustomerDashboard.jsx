import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import ToolIcon from "../components/ToolIcon";
import ProviderAvatar from "../components/ProviderAvatar";
import { useAuth } from "../context/AuthContext";
import { getCategories } from "../api/categoryApi";
import { getProvider, getProviderAvailability, getProviders } from "../api/providerApi";
import {
  cancelBooking,
  confirmBookingCompletion,
  createBooking,
  getCompletionImages,
  getCustomerBookings,
  hideBooking,
} from "../api/bookingApi";
import { createReview } from "../api/reviewApi";
import { createPayment, getCustomerPayments } from "../api/paymentApi";
import { downloadInvoicePdf, getInvoiceByBooking } from "../api/invoiceApi";
import { createRazorpayOrder, verifyRazorpayPayment } from "../api/razorpayApi";
import { getCustomerProfile, updateCustomerProfile } from "../api/customerApi";
import {
  normalizeBooking,
  normalizeCategory,
  normalizeProvider,
  unwrapList,
} from "../api/normalizers";
import {
  hasValidationErrors,
  sanitizeMobileNumber,
  validateMobileNumber,
  validateName,
} from "../utils/formValidation";

const TABS = [
  { id: "search", label: "Search services", icon: "search" },
  { id: "recommended", label: "Recommended for you", icon: "star" },
  { id: "history", label: "Booking history", icon: "history" },
  { id: "profile", label: "Profile", icon: "user" },
];

function getValidCustomerTab(tabId) {
  return TABS.some((tab) => tab.id === tabId) ? tabId : null;
}

export default function CustomerDashboard() {
  const location = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(() =>
    getValidCustomerTab(location.state?.activeTab) || "search"
  );
  const [query, setQuery] = useState(location.state?.service || "");
  const [city, setCity] = useState(location.state?.city || user?.city || "");
  const [locality, setLocality] = useState(
    location.state?.locality || user?.locality || ""
  );
  const [selectedCategory, setSelectedCategory] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("rating");
  const [categories, setCategories] = useState([]);
  const [providers, setProviders] = useState([]);
  const [bookingHistory, setBookingHistory] = useState([]);
  const [paymentsByBooking, setPaymentsByBooking] = useState({});
  const [invoicesByBooking, setInvoicesByBooking] = useState({});
  const [invoiceErrorsByBooking, setInvoiceErrorsByBooking] = useState({});
  const [loadingInvoiceId, setLoadingInvoiceId] = useState(null);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState(null);
  const [completionImagesByBooking, setCompletionImagesByBooking] = useState({});
  const [providerNames, setProviderNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [cancellingBookingId, setCancellingBookingId] = useState(null);
  const [confirmingCompletionId, setConfirmingCompletionId] = useState(null);
  const [hidingBookingId, setHidingBookingId] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [bookingError, setBookingError] = useState("");
  const [confirmingBooking, setConfirmingBooking] = useState(false);

  const customerId = user?.customerId ?? user?.id ?? user?.userId;
  const profileUserId = user?.userId ?? user?.id ?? user?.customerId;

  const loadBookings = async () => {
    if (!customerId) return;
    const response = await getCustomerBookings(customerId);
    setBookingHistory(unwrapList(response).map(normalizeBooking));
  };

  const loadPayments = async () => {
    if (!customerId) return;
    const response = await getCustomerPayments(customerId);
    const payments = unwrapList(response);
    setPaymentsByBooking(indexPaymentsByBooking(payments));
  };

  useEffect(() => {
    let active = true;
    const savedCity = user?.city || "";
    const savedLocality = user?.locality || "";

    if (savedCity) {
      setCity((current) => current || savedCity);
      setLocality((current) => current || savedLocality);
    }

    Promise.all([
      getCategories(),
      savedCity
        ? getProviders({ city: savedCity, locality: savedLocality })
        : Promise.resolve([]),
    ])
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
  }, [user?.city, user?.locality]);

  useEffect(() => {
    Promise.all([loadBookings(), loadPayments()])
      .catch((err) => setNotice({ type: "error", text: err.message }));
    // customerId changes only when the authenticated account changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  useEffect(() => {
    const nextTab = getValidCustomerTab(location.state?.activeTab);
    if (nextTab) {
      setActiveTab(nextTab);
    }
  }, [location.state?.activeTab]);

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

  useEffect(() => {
    const proofReadyBookings = bookingHistory.filter(
      (booking) =>
        ["WORK_DONE", "COMPLETED"].includes(booking.status) &&
        !Object.prototype.hasOwnProperty.call(
          completionImagesByBooking,
          booking.bookingId
        )
    );

    if (proofReadyBookings.length === 0) return;

    Promise.all(
      proofReadyBookings.map(async (booking) => {
        try {
          const response = await getCompletionImages(booking.bookingId);
          return [booking.bookingId, normalizeCompletionImages(response)];
        } catch {
          return [booking.bookingId, []];
        }
      })
    ).then((entries) => {
      setCompletionImagesByBooking((current) => ({
        ...current,
        ...Object.fromEntries(entries),
      }));
    });
  }, [bookingHistory, completionImagesByBooking]);

  const handleBook = (provider) => {
    if (!customerId) {
      setNotice({ type: "error", text: "Your customer account ID is missing." });
      return;
    }

    setNotice(null);
    setBookingError("");
    setSelectedProvider(provider);
  };

  const handleConfirmBooking = async (paymentMethod, scheduledAt, serviceAddress) => {
    const provider = selectedProvider;
    if (!provider) return;

    setBookingError("");
    setConfirmingBooking(true);
    let createdBooking;
    try {
      const response = await createBooking({
        customerId,
        providerId: provider.providerId,
        providerServiceId: provider.providerServiceId ?? provider.id,
        description: `${provider.category} service request`,
        serviceAddress,
        scheduledAt,
        quotedAmount: provider.price,
      });
      createdBooking = response?.booking || response?.data?.booking || response?.data || response;
    } catch (err) {
      setBookingError(
        err.status === 409
          ? "This provider is already booked for this time slot. Please choose another time."
          : err.status === 400
            ? "This provider is not available at the selected day or time. Please choose another slot."
          : err.message || "Unable to create booking."
      );
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

    setBookingError("");
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
    if (!city.trim()) {
      setNotice({
        type: "error",
        text: "Please add your city in profile to see nearby providers.",
      });
      return;
    }

    setLoading(true);
    setNotice(null);
    try {
      const response = await getProviders({
        query: query.trim(),
        city: city.trim(),
        locality: locality.trim(),
        category: selectedCategory,
        maxPrice: maxPrice === "" ? undefined : Number(maxPrice),
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

  const handleConfirmCompletion = async (bookingId) => {
    setConfirmingCompletionId(bookingId);
    setNotice(null);
    try {
      await confirmBookingCompletion(bookingId);
      await Promise.all([loadBookings(), loadPayments()]);
      setNotice({ type: "success", text: "Completion confirmed successfully." });
    } catch (err) {
      setNotice({ type: "error", text: err.message || "Unable to confirm completion." });
    } finally {
      setConfirmingCompletionId(null);
    }
  };

  const loadInvoiceForBooking = async (bookingId) => {
    setLoadingInvoiceId(bookingId);
    setInvoiceErrorsByBooking((current) => ({ ...current, [bookingId]: "" }));
    try {
      const response = await getInvoiceByBooking(bookingId);
      const invoice = normalizeInvoice(response);
      setInvoicesByBooking((current) => ({ ...current, [bookingId]: invoice }));
      return invoice;
    } catch (err) {
      setInvoiceErrorsByBooking((current) => ({
        ...current,
        [bookingId]: err.message || "Unable to load invoice.",
      }));
      return null;
    } finally {
      setLoadingInvoiceId(null);
    }
  };

  const handlePaymentCreated = async (bookingId, payment, paymentMethod) => {
    const nextPayment = normalizePaymentForBooking(bookingId, payment, paymentMethod);
    setPaymentsByBooking((current) => ({
      ...current,
      [bookingId]: nextPayment,
    }));
    try {
      await Promise.all([loadBookings(), loadPayments()]);
    } catch {
      // The verified payment result remains valid even if refreshing fails.
    }
    await loadInvoiceForBooking(bookingId);
  };

  const handlePaymentAlreadyExists = async (bookingId) => {
    try {
      await Promise.all([loadPayments(), loadBookings()]);
    } catch {
      // A stale payment panel can still recover once the next refresh succeeds.
    }
    await loadInvoiceForBooking(bookingId);
  };

  const handleDownloadInvoice = async (bookingId) => {
    setDownloadingInvoiceId(bookingId);
    setInvoiceErrorsByBooking((current) => ({ ...current, [bookingId]: "" }));
    try {
      await downloadInvoicePdf(bookingId);
    } catch (err) {
      setInvoiceErrorsByBooking((current) => ({
        ...current,
        [bookingId]: err.message || "Unable to download invoice.",
      }));
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  const filteredProviders = useMemo(() => {
    let list = providers.filter((provider) => provider.rating >= minRating);

    if (sortBy === "rating") list = [...list].sort((a, b) => b.rating - a.rating);
    if (sortBy === "price-low") list = [...list].sort((a, b) => a.price - b.price);
    if (sortBy === "price-high") list = [...list].sort((a, b) => b.price - a.price);
    if (sortBy === "experience") list = [...list].sort((a, b) => b.experience - a.experience);

    return list;
  }, [providers, minRating, sortBy]);

  const recommended = providers.slice(0, 3);

  const getPaymentForBooking = (bookingId) =>
    Object.values(paymentsByBooking).find((payment) => paymentBelongsToBooking(payment, bookingId));

  const isBookingPaid = (bookingId) => Boolean(getPaymentForBooking(bookingId));

  const clearFilters = () => {
    setQuery("");
    setCity("");
    setLocality("");
    setSelectedCategory("");
    setMinRating(0);
    setMaxPrice("");
    setSortBy("rating");
    setProviders([]);
    setNotice(null);
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
            initialAddress={{
              locality: user?.locality || locality || selectedProvider.locality || "",
              city: user?.city || city || "",
              state: user?.state || "",
              pincode: user?.pincode || "",
            }}
            error={bookingError}
            submitting={confirmingBooking}
            onSlotChange={() => setBookingError("")}
            onClose={() => {
              if (!confirmingBooking) {
                setBookingError("");
                setSelectedProvider(null);
              }
            }}
            onConfirm={handleConfirmBooking}
          />
        )}

        {activeTab === "search" && (
          <>
            {!city.trim() && (
              <div
                className="auth-alert"
                style={{ background: "#fff3d6", color: "#76510b" }}
              >
                <ToolIcon name="pin" size={15} />
                Please add your city in profile to see nearby providers.
              </div>
            )}
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
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
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
                    <label className="filter-checkbox">
                      <input
                        type="radio"
                        name="provider-category"
                        checked={selectedCategory === ""}
                        onChange={() => setSelectedCategory("")}
                      />
                      All categories
                    </label>
                    {categories.map((c) => (
                      <label className="filter-checkbox" key={c.id}>
                        <input
                          type="radio"
                          name="provider-category"
                          checked={selectedCategory === c.label}
                          onChange={() => setSelectedCategory(c.label)}
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
                  <div className="input-with-icon">
                    <span aria-hidden="true">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      placeholder="No maximum"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                    />
                  </div>
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
                              {b.status === "WORK_DONE" && (
                                <button
                                  type="button"
                                  className="btn-sahayak btn-sahayak-teal btn-sm"
                                  disabled={confirmingCompletionId === b.bookingId}
                                  onClick={() => handleConfirmCompletion(b.bookingId)}
                                >
                                  {confirmingCompletionId === b.bookingId
                                    ? "Confirming..."
                                    : "Confirm completion"}
                                </button>
                              )}
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
                        {["WORK_DONE", "COMPLETED"].includes(b.status) && (
                          <tr>
                            <td colSpan="6">
                              <div className="booking-completed-actions">
                                {completionImagesByBooking[b.bookingId]?.length > 0 && (
                                  <CompletionProofGallery
                                    images={completionImagesByBooking[b.bookingId]}
                                  />
                                )}
                                {b.status === "COMPLETED" && (
                                  <>
                                    <PaymentPanel
                                      booking={b}
                                      payment={isBookingPaid(b.bookingId) ? getPaymentForBooking(b.bookingId) : null}
                                      invoice={invoicesByBooking[b.bookingId]}
                                      invoiceError={invoiceErrorsByBooking[b.bookingId]}
                                      invoiceLoading={loadingInvoiceId === b.bookingId}
                                      invoiceDownloading={downloadingInvoiceId === b.bookingId}
                                      customer={user}
                                      onPaymentCreated={(payment, paymentMethod) =>
                                        handlePaymentCreated(b.bookingId, payment, paymentMethod)
                                      }
                                      onPaymentAlreadyExists={() => handlePaymentAlreadyExists(b.bookingId)}
                                      onViewInvoice={() => loadInvoiceForBooking(b.bookingId)}
                                      onDownloadInvoice={() => handleDownloadInvoice(b.bookingId)}
                                    />
                                    <ReviewForm bookingId={b.bookingId} />
                                  </>
                                )}
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

        {activeTab === "profile" && <CustomerProfile userId={profileUserId} />}
      </div>
    </div>
  );
}

function CustomerProfile({ userId }) {
  const { user, updateCurrentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    city: user?.city || "",
    locality: user?.locality || "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    let active = true;

    if (!userId) {
      setMessage({ type: "error", text: "Your customer account ID is missing." });
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    getCustomerProfile(userId)
      .then((response) => {
        if (!active) return;
        const loadedProfile = unwrapProfile(response);
        const normalizedProfile = {
          ...loadedProfile,
          name: loadedProfile.name ?? user?.name ?? "",
          email: loadedProfile.email ?? user?.email ?? "",
          phone: loadedProfile.phone ?? user?.phone ?? "",
          city: loadedProfile.city ?? user?.city ?? "",
          locality: loadedProfile.locality ?? user?.locality ?? "",
          role: loadedProfile.role ?? user?.role ?? "CUSTOMER",
        };
        setProfile(normalizedProfile);
        setForm({
          name: normalizedProfile.name,
          phone: sanitizeMobileNumber(normalizedProfile.phone),
          city: normalizedProfile.city,
          locality: normalizedProfile.locality,
        });
      })
      .catch((err) => {
        if (active) {
          setMessage({
            type: "error",
            text: err.message || "Unable to load your profile.",
          });
        }
      })
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [
    userId,
    user?.city,
    user?.email,
    user?.locality,
    user?.name,
    user?.phone,
    user?.role,
  ]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextFieldErrors = {
      name: validateName(form.name),
      phone: validateMobileNumber(form.phone),
    };
    setFieldErrors(nextFieldErrors);
    if (hasValidationErrors(nextFieldErrors)) {
      setMessage(null);
      return;
    }

    if (!form.name.trim() || !form.phone.trim()) {
      setMessage({ type: "error", text: "Name and phone are required." });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const response = await updateCustomerProfile(userId, {
        name: form.name.trim(),
        phone: form.phone.trim(),
      });
      const updatedProfile = unwrapProfile(response);
      const nextProfile = {
        ...profile,
        ...updatedProfile,
        name: updatedProfile.name ?? form.name.trim(),
        phone: updatedProfile.phone ?? form.phone.trim(),
        city: form.city.trim(),
        locality: form.locality.trim(),
      };

      setProfile(nextProfile);
      setForm({
        name: nextProfile.name,
        phone: sanitizeMobileNumber(nextProfile.phone),
        city: nextProfile.city,
        locality: nextProfile.locality,
      });
      updateCurrentUser({
        name: nextProfile.name,
        phone: nextProfile.phone,
        city: nextProfile.city,
        locality: nextProfile.locality,
      });
      setMessage({ type: "success", text: "Profile updated successfully." });
    } catch (err) {
      setMessage({
        type: "error",
        text: err.message || "Unable to update your profile.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="empty-state surface-card">
        <h5>Loading your profile...</h5>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="customer-profile-card surface-card">
        {message && <ProfileMessage message={message} />}
      </div>
    );
  }

  return (
    <section className="customer-profile-section">
      <div className="section-head">
        <div>
          <span className="eyebrow">Your account</span>
          <h2>Customer profile</h2>
          <p>Keep your contact details current for bookings and service updates.</p>
        </div>
      </div>

      <form className="customer-profile-card surface-card" onSubmit={handleSubmit}>
        {message && <ProfileMessage message={message} />}

        <div className="customer-profile-grid">
          <div className="form-field-group">
            <label htmlFor="customer-profile-name">Name</label>
            <div className={`input-with-icon ${fieldErrors.name ? "field-invalid" : ""}`}>
              <ToolIcon name="user" size={17} />
              <input
                id="customer-profile-name"
                type="text"
                value={form.name}
                onChange={(event) => {
                  const value = event.target.value;
                  setForm((current) => ({ ...current, name: value }));
                  setFieldErrors((current) => ({ ...current, name: validateName(value) }));
                }}
              />
            </div>
            {fieldErrors.name && <p className="field-error">{fieldErrors.name}</p>}
          </div>

          <div className="form-field-group">
            <label htmlFor="customer-profile-phone">Phone</label>
            <div className={`input-with-icon ${fieldErrors.phone ? "field-invalid" : ""}`}>
              <ToolIcon name="phone" size={17} />
              <input
                id="customer-profile-phone"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={form.phone}
                onChange={(event) => {
                  const value = sanitizeMobileNumber(event.target.value);
                  setForm((current) => ({ ...current, phone: value }));
                  setFieldErrors((current) => ({
                    ...current,
                    phone: validateMobileNumber(value),
                  }));
                }}
              />
            </div>
            {fieldErrors.phone && <p className="field-error">{fieldErrors.phone}</p>}
          </div>

          <div className="form-field-group">
            <label htmlFor="customer-profile-email">Email</label>
            <div className="input-with-icon customer-profile-readonly">
              <ToolIcon name="mail" size={17} />
              <input id="customer-profile-email" type="email" value={profile.email} readOnly />
            </div>
          </div>

          <div className="form-field-group">
            <label htmlFor="customer-profile-city">City</label>
            <div className="input-with-icon">
              <ToolIcon name="pin" size={17} />
              <input
                id="customer-profile-city"
                type="text"
                value={form.city}
                onChange={(event) =>
                  setForm((current) => ({ ...current, city: event.target.value }))
                }
              />
            </div>
          </div>

          <div className="form-field-group">
            <label htmlFor="customer-profile-locality">Locality</label>
            <div className="input-with-icon">
              <ToolIcon name="pin" size={17} />
              <input
                id="customer-profile-locality"
                type="text"
                value={form.locality}
                onChange={(event) =>
                  setForm((current) => ({ ...current, locality: event.target.value }))
                }
              />
            </div>
          </div>

          <div className="form-field-group">
            <label htmlFor="customer-profile-role">Role</label>
            <div className="input-with-icon customer-profile-readonly">
              <ToolIcon name="shield" size={17} />
              <input
                id="customer-profile-role"
                type="text"
                value={formatStatus(profile.role)}
                readOnly
              />
            </div>
          </div>
        </div>

        <div className="customer-profile-actions">
          <button
            type="submit"
            className="btn-sahayak btn-sahayak-teal"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </section>
  );
}

function ProfileMessage({ message }) {
  return (
    <div
      className="auth-alert"
      style={{
        background: message.type === "error" ? "#fbe7e3" : "#e3f3e8",
        color: message.type === "error" ? "#7a2f24" : "#25613c",
      }}
    >
      <ToolIcon name={message.type === "error" ? "shield" : "check"} size={15} />
      {message.text}
    </div>
  );
}

function unwrapProfile(response) {
  const profile = response?.profile || response?.data?.profile || response?.data || response;
  return profile && typeof profile === "object" ? profile : {};
}

function ProviderRow({ provider: p, onBook }) {
  return (
    <article className="dashboard-provider-card">
      <ProviderAvatar
        className="dp-avatar"
        imageUrl={p.profileImageUrl}
        initials={p.initials}
        alt={`${p.name} profile`}
      />
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
        <ProviderAvatar
          imageUrl={p.profileImageUrl}
          initials={p.initials}
          alt={`${p.name} profile`}
        />
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

function BookingConfirmationModal({
  provider,
  initialAddress,
  error,
  submitting,
  onClose,
  onConfirm,
  onSlotChange,
}) {
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [bookingDate, setBookingDate] = useState(getTomorrowDate());
  const [bookingTime, setBookingTime] = useState("09:00");
  const [serviceAddressFields, setServiceAddressFields] = useState(() => ({
    house: "",
    building: "",
    locality: initialAddress?.locality || "",
    city: initialAddress?.city || "",
    state: initialAddress?.state || "",
    pincode: initialAddress?.pincode || "",
    landmark: "",
  }));
  const [addressError, setAddressError] = useState("");
  const [availability, setAvailability] = useState([]);

  useEffect(() => {
    let active = true;
    const providerId = provider.providerId ?? provider.id;

    if (providerId == null) return undefined;

    getProviderAvailability(providerId)
      .then((response) => {
        if (active) setAvailability(normalizeAvailability(response));
      })
      .catch(() => {
        if (active) setAvailability([]);
      });

    return () => {
      active = false;
    };
  }, [provider.id, provider.providerId]);

  const updateDate = (value) => {
    setBookingDate(value);
    onSlotChange();
  };

  const updateTime = (value) => {
    setBookingTime(value);
    onSlotChange();
  };

  const updateAddressField = (field, value) => {
    setServiceAddressFields((current) => ({ ...current, [field]: value }));
    setAddressError("");
  };

  const confirmBooking = () => {
    if (!bookingDate || !bookingTime) return;
    const requiredFields = ["house", "locality", "city", "state", "pincode"];
    const missingField = requiredFields.find((field) => !serviceAddressFields[field].trim());

    if (missingField) {
      setAddressError("House / Flat No, Locality, City, State and Pincode are required.");
      return;
    }

    onConfirm(
      paymentMethod,
      `${bookingDate}T${bookingTime}:00`,
      buildServiceAddress(serviceAddressFields)
    );
  };

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
          <ProviderAvatar
            imageUrl={provider.profileImageUrl}
            initials={provider.initials}
            alt={`${provider.name} profile`}
          />
          <div>
            <strong>{provider.name}</strong>
            <span>{provider.category}</span>
          </div>
          <div className="booking-modal-price">
            <strong>₹{provider.price}</strong>
            <span>/ {provider.priceUnit}</span>
          </div>
        </div>

        {error && (
          <div
            className="auth-alert"
            role="alert"
            style={{ background: "#fbe7e3", color: "#7a2f24" }}
          >
            <ToolIcon name="shield" size={15} />
            {error}
          </div>
        )}

        <div className="booking-slot-section">
          <h6>Choose your service slot</h6>
          <div className="booking-slot-fields">
            <div className="form-field-group">
              <label htmlFor="booking-date">Booking date</label>
              <div className="input-with-icon">
                <ToolIcon name="calendar" size={17} />
                <input
                  id="booking-date"
                  type="date"
                  min={getTodayDate()}
                  value={bookingDate}
                  onChange={(event) => updateDate(event.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>
            <div className="form-field-group">
              <label htmlFor="booking-time">Booking time</label>
              <div className="input-with-icon">
                <ToolIcon name="history" size={17} />
                <input
                  id="booking-time"
                  type="time"
                  value={bookingTime}
                  onChange={(event) => updateTime(event.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>
          </div>

          {availability.length > 0 && (
            <div className="booking-availability">
              <ToolIcon name="calendar" size={16} />
              <div>
                <strong>Provider availability</strong>
                {availability.map((slot) => (
                  <span key={`${slot.day}-${slot.startTime}-${slot.endTime}`}>
                    {formatAvailability(slot)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="booking-address-section">
          <h6>Service address</h6>
          {addressError && (
            <div className="auth-alert auth-alert-error" role="alert">
              {addressError}
            </div>
          )}
          <div className="booking-address-fields">
            <div className="form-field-group">
              <label htmlFor="booking-house">House / Flat No</label>
              <div className="input-with-icon">
                <ToolIcon name="pin" size={17} />
                <input
                  id="booking-house"
                  type="text"
                  value={serviceAddressFields.house}
                  onChange={(event) => updateAddressField("house", event.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>
            <div className="form-field-group">
              <label htmlFor="booking-building">Building / Street</label>
              <div className="input-with-icon">
                <ToolIcon name="pin" size={17} />
                <input
                  id="booking-building"
                  type="text"
                  value={serviceAddressFields.building}
                  onChange={(event) => updateAddressField("building", event.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>
            <div className="form-field-group">
              <label htmlFor="booking-locality">Locality</label>
              <div className="input-with-icon">
                <ToolIcon name="pin" size={17} />
                <input
                  id="booking-locality"
                  type="text"
                  value={serviceAddressFields.locality}
                  onChange={(event) => updateAddressField("locality", event.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>
            <div className="form-field-group">
              <label htmlFor="booking-city">City</label>
              <div className="input-with-icon">
                <ToolIcon name="pin" size={17} />
                <input
                  id="booking-city"
                  type="text"
                  value={serviceAddressFields.city}
                  onChange={(event) => updateAddressField("city", event.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>
            <div className="form-field-group">
              <label htmlFor="booking-state">State</label>
              <div className="input-with-icon">
                <ToolIcon name="pin" size={17} />
                <input
                  id="booking-state"
                  type="text"
                  value={serviceAddressFields.state}
                  onChange={(event) => updateAddressField("state", event.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>
            <div className="form-field-group">
              <label htmlFor="booking-pincode">Pincode</label>
              <div className="input-with-icon">
                <ToolIcon name="pin" size={17} />
                <input
                  id="booking-pincode"
                  type="text"
                  value={serviceAddressFields.pincode}
                  onChange={(event) => updateAddressField("pincode", event.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>
            <div className="form-field-group booking-landmark-field">
              <label htmlFor="booking-landmark">Landmark</label>
              <div className="input-with-icon">
                <ToolIcon name="pin" size={17} />
                <input
                  id="booking-landmark"
                  type="text"
                  value={serviceAddressFields.landmark}
                  onChange={(event) => updateAddressField("landmark", event.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>
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
            disabled={submitting || !bookingDate || !bookingTime}
            onClick={confirmBooking}
          >
            {submitting ? "Confirming..." : "Confirm booking"}
          </button>
        </div>
      </section>
    </div>
  );
}

function getTodayDate() {
  const today = new Date();
  const offset = today.getTimezoneOffset() * 60 * 1000;
  return new Date(today.getTime() - offset).toISOString().slice(0, 10);
}

function getTomorrowDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const offset = tomorrow.getTimezoneOffset() * 60 * 1000;
  return new Date(tomorrow.getTime() - offset).toISOString().slice(0, 10);
}

function buildServiceAddress(fields) {
  const house = fields.house.trim();
  const building = fields.building.trim();
  const locality = fields.locality.trim();
  const city = fields.city.trim();
  const state = fields.state.trim();
  const pincode = fields.pincode.trim();
  const landmark = fields.landmark.trim();
  const addressParts = [house, building, locality, city].filter(Boolean);

  if (state || pincode) {
    addressParts.push([state, pincode].filter(Boolean).join(" - "));
  }
  if (landmark) {
    addressParts.push(`Landmark: ${landmark}`);
  }

  return addressParts.join(", ");
}

function normalizeAvailability(response) {
  const value = response?.availability ?? response?.data?.availability ?? response?.data ?? response;
  const slots = Array.isArray(value) ? value : value ? [value] : [];

  return slots
    .map((slot) => ({
      day: slot.day ?? slot.dayOfWeek ?? slot.weekDay,
      startTime: slot.startTime ?? slot.fromTime ?? slot.start,
      endTime: slot.endTime ?? slot.toTime ?? slot.end,
    }))
    .filter((slot) => slot.day && slot.startTime && slot.endTime);
}

function formatAvailability(slot) {
  const day = String(slot.day)
    .toLowerCase()
    .replace(/^\w/, (letter) => letter.toUpperCase());
  return `${day}, ${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}`;
}

function formatTime(value) {
  const [hours = "0", minutes = "00"] = String(value).split(":");
  const hour = Number(hours);
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${String(displayHour).padStart(2, "0")}:${minutes} ${suffix}`;
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

function normalizeInvoice(response) {
  const invoice = response?.invoice || response?.data?.invoice || response?.data || response || {};

  return {
    ...invoice,
    invoiceNumber: invoice.invoiceNumber ?? invoice.number ?? invoice.invoiceNo ?? `#${invoice.id ?? ""}`,
    bookingId: invoice.bookingId ?? invoice.booking?.id,
    platformFee: Number(invoice.platformFee ?? 0),
    cgst: Number(invoice.cgst ?? invoice.CGST ?? 0),
    sgst: Number(invoice.sgst ?? invoice.SGST ?? 0),
    providerEarning: Number(invoice.providerEarning ?? invoice.providerEarnings ?? 0),
    totalPayable: Number(invoice.totalPayable ?? invoice.totalAmount ?? invoice.amount ?? 0),
  };
}

function getPaymentBookingId(payment) {
  return payment?.bookingId ?? payment?.booking_id ?? payment?.booking?.id ?? payment?.booking?.bookingId;
}

function paymentBelongsToBooking(payment, bookingId) {
  const paymentBookingId = getPaymentBookingId(payment);
  return paymentBookingId != null && bookingId != null && String(paymentBookingId) === String(bookingId);
}

function indexPaymentsByBooking(payments) {
  return Object.fromEntries(
    payments
      .map((payment) => [getPaymentBookingId(payment), payment])
      .filter(([bookingId]) => bookingId != null)
  );
}

function normalizePaymentForBooking(bookingId, payment, paymentMethod) {
  const value = payment || {};
  return {
    ...value,
    bookingId: value.bookingId ?? value.booking_id ?? bookingId,
    paymentMethod: value.paymentMethod ?? value.method ?? paymentMethod,
    status: value.status ?? "PAID",
  };
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

function PaymentPanel({
  booking,
  payment,
  invoice,
  invoiceError,
  invoiceLoading,
  invoiceDownloading,
  customer,
  onPaymentCreated,
  onPaymentAlreadyExists,
  onViewInvoice,
  onDownloadInvoice,
}) {
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handlePayment = async () => {
    setSubmitting(true);
    setError("");
    try {
      if (paymentMethod === "CASH") {
        const response = await createPayment(booking.bookingId, paymentMethod);
        await onPaymentCreated(response?.payment || response?.data || response, paymentMethod);
      } else {
        const response = await payWithRazorpay({
          bookingId: booking.bookingId,
          paymentMethod,
          customer,
        });
        await onPaymentCreated(
          response?.payment || response?.data?.payment || response?.data || response,
          paymentMethod
        );
      }
    } catch (err) {
      if (err.status === 409) {
        await onPaymentAlreadyExists();
        return;
      }
      setError(err.message || "Payment cancelled or failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (payment) {
    return (
      <div className="booking-payment-status booking-invoice-status">
        <div className="booking-payment-summary">
          <strong>Payment: {formatStatus(payment.status || "PAID")}</strong>
          <span>Method: {payment.paymentMethod || payment.method || "—"}</span>
          <span>
            Transaction: {payment.transactionReference || payment.transactionId || payment.reference || "—"}
          </span>
          <button
            type="button"
            className="btn-sahayak btn-sahayak-outline btn-sm"
            disabled={invoiceLoading}
            onClick={onViewInvoice}
          >
            {invoiceLoading ? "Loading invoice..." : "View invoice"}
          </button>
          {invoice && (
            <button
              type="button"
              className="btn-sahayak btn-sahayak-teal btn-sm"
              disabled={invoiceDownloading}
              onClick={onDownloadInvoice}
            >
              {invoiceDownloading ? "Downloading..." : "Download PDF"}
            </button>
          )}
        </div>
        {invoice && <InvoiceDetails invoice={invoice} />}
        {invoice && <span className="booking-invoice-email">Invoice sent to your email.</span>}
        {invoiceError && <span style={{ color: "var(--danger)" }}>{invoiceError}</span>}
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

function loadRazorpayScript() {
  if (window.Razorpay) return Promise.resolve(true);

  return new Promise((resolve) => {
    const existingScript = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true), { once: true });
      existingScript.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

async function payWithRazorpay({ bookingId, paymentMethod, customer }) {
  const scriptLoaded = await loadRazorpayScript();
  if (!scriptLoaded || !window.Razorpay) {
    throw new Error("Payment cancelled or failed");
  }

  const orderResponse = await createRazorpayOrder(bookingId);
  const order = orderResponse?.data || orderResponse;

  return new Promise((resolve, reject) => {
    const checkout = new window.Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency || "INR",
      order_id: order.orderId,
      name: "Sahayak",
      description: "Sahayak Service Payment",
      prefill: {
        name: customer?.name || "",
        email: customer?.email || "",
        contact: customer?.phone || customer?.mobile || "",
      },
      method: {
        upi: paymentMethod === "UPI",
        card: paymentMethod === "CARD",
        netbanking: false,
        wallet: false,
      },
      handler: async (response) => {
        try {
          const verified = await verifyRazorpayPayment(bookingId, {
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
            paymentMethod,
          });
          resolve(verified);
        } catch (err) {
          reject(err);
        }
      },
      modal: {
        ondismiss: () => reject(new Error("Payment cancelled or failed")),
      },
    });

    checkout.on("payment.failed", () => reject(new Error("Payment cancelled or failed")));
    checkout.open();
  });
}

function InvoiceDetails({ invoice }) {
  const rows = [
    ["Invoice number", invoice.invoiceNumber],
    ["Platform fee", formatCurrency(invoice.platformFee)],
    ["CGST", formatCurrency(invoice.cgst)],
    ["SGST", formatCurrency(invoice.sgst)],
    ["Provider earning", formatCurrency(invoice.providerEarning)],
    ["Total payable", formatCurrency(invoice.totalPayable)],
  ];

  return (
    <div className="booking-invoice-details">
      {rows.map(([label, value]) => (
        <div key={label}>
          <span>{label}</span>
          <strong>{value || "-"}</strong>
        </div>
      ))}
    </div>
  );
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

function formatStatus(status) {
  const value = String(status || "").replace(/_/g, " ").toLowerCase();
  return value ? value[0].toUpperCase() + value.slice(1) : "Unknown";
}

function formatCurrency(value) {
  const amount = Number(value ?? 0);
  return `Rs. ${Number.isFinite(amount) ? amount.toLocaleString("en-IN") : "0"}`;
}
