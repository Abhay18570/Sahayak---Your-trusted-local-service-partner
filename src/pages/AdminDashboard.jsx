import React, { useEffect, useMemo, useState } from "react";
import ToolIcon from "../components/ToolIcon";
import {
  approveProvider,
  getAdminBookings,
  getPendingProviders,
  getAdminProviders,
  getAdminReviews,
  getAdminStats,
  getAdminUsers,
  rejectProvider,
} from "../api/adminApi";
import { normalizeBooking, normalizeProvider, unwrapList } from "../api/normalizers";
import { normalizeRole } from "../utils/roles";
import { getAdminPayments } from "../api/paymentApi";

const TABS = [
  { id: "users", label: "Users" },
  { id: "bookings", label: "Bookings" },
  { id: "reviews", label: "Reviews" },
  { id: "payments", label: "Payments" },
  { id: "pending-providers", label: "Pending Providers" },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("users");
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [providers, setProviders] = useState([]);
  const [pendingProviders, setPendingProviders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [providerAction, setProviderAction] = useState(null);

  useEffect(() => {
    Promise.all([
      getAdminStats(),
      getAdminUsers(),
      getAdminBookings(),
      getAdminProviders(),
      getPendingProviders(),
      getAdminReviews(),
      getAdminPayments(),
    ])
      .then(([
        statsResponse,
        usersResponse,
        bookingsResponse,
        providersResponse,
        pendingProvidersResponse,
        reviewsResponse,
        paymentsResponse,
      ]) => {
        setStats(statsResponse?.data || statsResponse || {});
        setUsers(unwrapList(usersResponse));
        setBookings(unwrapList(bookingsResponse).map(normalizeBooking));
        setProviders(unwrapList(providersResponse).map(normalizeProvider));
        setPendingProviders(unwrapList(pendingProvidersResponse).map(normalizePendingProvider));
        setReviews(unwrapList(reviewsResponse));
        setPayments(unwrapList(paymentsResponse));
      })
      .catch((err) => setError(err.message || "Unable to load admin dashboard."))
      .finally(() => setLoading(false));
  }, []);

  const handleProviderDecision = async (providerId, decision) => {
    setProviderAction({ providerId, decision });
    setError("");

    try {
      const updateProvider = decision === "approve" ? approveProvider : rejectProvider;
      await updateProvider(providerId);

      const [pendingResponse, statsResponse, providersResponse] = await Promise.all([
        getPendingProviders(),
        getAdminStats(),
        getAdminProviders(),
      ]);

      setPendingProviders(unwrapList(pendingResponse).map(normalizePendingProvider));
      setStats(statsResponse?.data || statsResponse || {});
      setProviders(unwrapList(providersResponse).map(normalizeProvider));
    } catch (err) {
      setError(err.message || `Unable to ${decision} provider.`);
    } finally {
      setProviderAction(null);
    }
  };

  const userNames = useMemo(
    () => Object.fromEntries(users.map((user) => [user.id ?? user.userId, getName(user)])),
    [users]
  );
  const providerNames = useMemo(
    () => Object.fromEntries(providers.map((provider) => [provider.providerId, provider.name])),
    [providers]
  );

  const metrics = [
    ["Total users", stat(stats, "totalUsers", users.length), "user"],
    ["Total customers", stat(stats, "totalCustomers", countRole(users, "customer")), "user"],
    ["Total providers", stat(stats, "totalProviders", providers.length), "wrench"],
    ["Total bookings", stat(stats, "totalBookings", bookings.length), "calendar"],
    ["Completed bookings", stat(stats, "completedBookings", countStatus(bookings, "COMPLETED")), "check"],
    ["Total reviews", stat(stats, "totalReviews", reviews.length), "star"],
  ];

  return (
    <div className="dashboard-page">
      <div className="container-sahayak">
        <div className="dashboard-header">
          <span className="eyebrow">Administration</span>
          <h1>Sahayak overview</h1>
          <p>Monitor users, bookings, providers, and customer feedback.</p>
        </div>

        {error && (
          <div className="auth-alert" style={{ background: "#fbe7e3", color: "#7a2f24" }}>
            {error}
          </div>
        )}

        <div className="admin-metric-grid">
          {metrics.map(([label, value, icon]) => (
            <article className="admin-metric-card" key={label}>
              <span className="admin-metric-icon"><ToolIcon name={icon} size={22} /></span>
              <div><strong>{value}</strong><span>{label}</span></div>
            </article>
          ))}
        </div>

        <div className="dashboard-tabs">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              className={`dashboard-tab ${activeTab === id ? "active" : ""}`}
              onClick={() => setActiveTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="empty-state surface-card"><h5>Loading admin data...</h5></div>
        ) : activeTab === "users" ? (
          <UsersTable users={users} />
        ) : activeTab === "bookings" ? (
          <BookingsTable bookings={bookings} userNames={userNames} providerNames={providerNames} />
        ) : activeTab === "reviews" ? (
          <ReviewsTable reviews={reviews} userNames={userNames} providerNames={providerNames} />
        ) : activeTab === "payments" ? (
          <PaymentsTable payments={payments} userNames={userNames} />
        ) : (
          <PendingProvidersTable
            providers={pendingProviders}
            providerAction={providerAction}
            onDecision={handleProviderDecision}
          />
        )}
      </div>
    </div>
  );
}

function UsersTable({ users }) {
  return (
    <Table headers={["User", "Email", "Phone", "Role", "Status", "Joined"]}>
      {users.map((user) => (
        <tr key={user.id ?? user.userId}>
          <td><strong>{getName(user)}</strong></td>
          <td>{user.email || "—"}</td>
          <td>{user.phone || "—"}</td>
          <td>{formatValue(user.role)}</td>
          <td>{user.enabled === false || user.active === false ? "Disabled" : "Active"}</td>
          <td>{formatDate(user.createdAt)}</td>
        </tr>
      ))}
    </Table>
  );
}

function BookingsTable({ bookings, userNames, providerNames }) {
  return (
    <Table headers={["Booking", "Customer", "Provider", "Scheduled", "Status", "Amount"]}>
      {bookings.map((booking) => (
        <tr key={booking.bookingId}>
          <td><strong>{booking.bookingNumber || `#${booking.bookingId}`}</strong></td>
          <td>{booking.customerName || userNames[booking.customerId] || `Customer #${booking.customerId}`}</td>
          <td>{booking.providerName || providerNames[booking.providerId] || `Provider #${booking.providerId}`}</td>
          <td>{formatDate(booking.scheduledAt)}</td>
          <td><span className={`status-badge ${booking.status.toLowerCase()}`}>{formatValue(booking.status)}</span></td>
          <td>₹{booking.finalAmount ?? booking.quotedAmount ?? 0}</td>
        </tr>
      ))}
    </Table>
  );
}

function ReviewsTable({ reviews, userNames, providerNames }) {
  return (
    <Table headers={["Review", "Customer", "Provider", "Rating", "Comment", "Created"]}>
      {reviews.map((review) => (
        <tr key={review.id}>
          <td>#{review.id}</td>
          <td>{userNames[review.customerId] || `Customer #${review.customerId}`}</td>
          <td>{providerNames[review.providerId] || `Provider #${review.providerId}`}</td>
          <td><span className="admin-rating"><ToolIcon name="star" size={13} /> {review.rating}</span></td>
          <td>{review.comment || "—"}</td>
          <td>{formatDate(review.createdAt)}</td>
        </tr>
      ))}
    </Table>
  );
}

function PaymentsTable({ payments, userNames }) {
  return (
    <Table headers={["Transaction", "Booking", "Customer", "Method", "Amount", "Status", "Created"]}>
      {payments.map((payment) => (
        <tr key={payment.id ?? payment.transactionReference ?? payment.transactionId}>
          <td>
            <strong>
              {payment.transactionReference || payment.transactionId || payment.reference || `#${payment.id}`}
            </strong>
          </td>
          <td>{payment.bookingNumber || `#${payment.bookingId ?? payment.booking?.id}`}</td>
          <td>{payment.customerName || userNames[payment.customerId] || `Customer #${payment.customerId}`}</td>
          <td>{formatValue(payment.paymentMethod || payment.method)}</td>
          <td>₹{payment.amount ?? payment.paidAmount ?? 0}</td>
          <td>
            <span className={`status-badge ${String(payment.status || "paid").toLowerCase()}`}>
              {formatValue(payment.status || "PAID")}
            </span>
          </td>
          <td>{formatDate(payment.createdAt || payment.paidAt)}</td>
        </tr>
      ))}
    </Table>
  );
}

function PendingProvidersTable({ providers, providerAction, onDecision }) {
  if (providers.length === 0) {
    return (
      <div className="empty-state surface-card">
        <h5>No pending provider approvals.</h5>
      </div>
    );
  }

  return (
    <Table
      headers={[
        "Provider ID",
        "Name",
        "Email",
        "Phone",
        "Experience years",
        "Bio",
        "Verification status",
        "Actions",
      ]}
    >
      {providers.map((provider) => {
        const isCurrentProvider = providerAction?.providerId === provider.providerId;

        return (
          <tr key={provider.providerId}>
            <td><strong>#{provider.providerId}</strong></td>
            <td>{provider.name}</td>
            <td>{provider.email || "—"}</td>
            <td>{provider.phone || "—"}</td>
            <td>{provider.experienceYears}</td>
            <td className="admin-provider-bio">{provider.bio || "—"}</td>
            <td>
              <span className={`status-badge ${String(provider.verificationStatus).toLowerCase()}`}>
                {formatValue(provider.verificationStatus)}
              </span>
            </td>
            <td>
              <div className="admin-provider-actions">
                <button
                  type="button"
                  className="btn-sahayak btn-sahayak-teal btn-sm"
                  disabled={Boolean(providerAction)}
                  onClick={() => onDecision(provider.providerId, "approve")}
                >
                  {isCurrentProvider && providerAction.decision === "approve"
                    ? "Approving..."
                    : "Approve"}
                </button>
                <button
                  type="button"
                  className="btn-sahayak btn-sahayak-reject btn-sm"
                  disabled={Boolean(providerAction)}
                  onClick={() => onDecision(provider.providerId, "reject")}
                >
                  {isCurrentProvider && providerAction.decision === "reject"
                    ? "Rejecting..."
                    : "Reject"}
                </button>
              </div>
            </td>
          </tr>
        );
      })}
    </Table>
  );
}

function Table({ headers, children }) {
  return (
    <div className="booking-table-wrap admin-table-wrap">
      <table className="booking-table">
        <thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function stat(stats, key, fallback) {
  return stats[key] ?? stats[key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)] ?? fallback;
}

function countRole(users, role) {
  return users.filter((user) => normalizeRole(user.role) === normalizeRole(role)).length;
}

function countStatus(bookings, status) {
  return bookings.filter((booking) => booking.status === status).length;
}

function getName(user) {
  return user.name || [user.firstName, user.lastName].filter(Boolean).join(" ") || `User #${user.id ?? user.userId}`;
}

function normalizePendingProvider(provider) {
  const user = provider.user || {};

  return {
    ...provider,
    providerId: provider.providerId ?? provider.id ?? provider.userId ?? user.id,
    name:
      provider.name ||
      user.name ||
      [provider.firstName ?? user.firstName, provider.lastName ?? user.lastName]
        .filter(Boolean)
        .join(" ") ||
      `Provider #${provider.providerId ?? provider.id ?? provider.userId ?? user.id}`,
    email: provider.email ?? user.email,
    phone: provider.phone ?? user.phone,
    experienceYears: provider.experienceYears ?? provider.experience ?? 0,
    bio: provider.bio ?? provider.description ?? "",
    verificationStatus:
      provider.verificationStatus ?? provider.status ?? (provider.verified ? "VERIFIED" : "PENDING"),
  };
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

function formatValue(value) {
  const text = String(value || "").replaceAll("_", " ").toLowerCase();
  return text ? text[0].toUpperCase() + text.slice(1) : "—";
}
