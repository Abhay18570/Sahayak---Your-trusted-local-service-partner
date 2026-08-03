import React, { useEffect, useMemo, useState } from "react";
import ToolIcon from "../components/ToolIcon";
import DecorativeBackdrop from "../components/DecorativeBackdrop";
import ProviderAvatar from "../components/ProviderAvatar";
import { useAuth } from "../context/AuthContext";
import {
  approveProvider,
  deleteUser,
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
import { downloadInvoicePdf, getInvoices } from "../api/invoiceApi";
import { getMaskedAadhaar, getProviderImageUrl } from "../utils/providerKyc";

const TABS = [
  { id: "users", label: "Users", icon: "users" },
  { id: "bookings", label: "Bookings", icon: "calendar" },
  { id: "reviews", label: "Reviews", icon: "star" },
  { id: "payments", label: "Payments", icon: "wallet" },
  { id: "invoices", label: "Invoices", icon: "check" },
  { id: "pending-providers", label: "Pending Providers", icon: "wrench" },
];

export default function AdminDashboard() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("users");
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [providers, setProviders] = useState([]);
  const [pendingProviders, setPendingProviders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [providerAction, setProviderAction] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);

  useEffect(() => {
    Promise.all([
      getAdminStats(),
      getAdminUsers(),
      getAdminBookings(),
      getAdminProviders(),
      getPendingProviders(),
      getAdminReviews(),
      getAdminPayments(),
      getInvoices(),
    ])
      .then(([
        statsResponse,
        usersResponse,
        bookingsResponse,
        providersResponse,
        pendingProvidersResponse,
        reviewsResponse,
        paymentsResponse,
        invoicesResponse,
      ]) => {
        setStats(statsResponse?.data || statsResponse || {});
        setUsers(unwrapList(usersResponse));
        setBookings(unwrapList(bookingsResponse).map(normalizeBooking));
        setProviders(unwrapList(providersResponse).map(normalizeProvider));
        setPendingProviders(unwrapList(pendingProvidersResponse).map(normalizePendingProvider));
        setReviews(unwrapList(reviewsResponse));
        setPayments(unwrapList(paymentsResponse));
        setInvoices(unwrapList(invoicesResponse).map(normalizeInvoice));
      })
      .catch((err) => setError(err.message || "Unable to load admin dashboard."))
      .finally(() => setLoading(false));
  }, []);

  const handleProviderDecision = async (providerId, decision) => {
    setProviderAction({ providerId, decision });
    setError("");
    setMessage("");

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

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to disable this user?")) return;

    setDeletingUserId(userId);
    setError("");
    setMessage("");

    try {
      await deleteUser(userId);

      const [usersResponse, providersResponse, pendingResponse, statsResponse] =
        await Promise.all([
          getAdminUsers(),
          getAdminProviders(),
          getPendingProviders(),
          getAdminStats(),
        ]);

      setUsers(unwrapList(usersResponse));
      setProviders(unwrapList(providersResponse).map(normalizeProvider));
      setPendingProviders(unwrapList(pendingResponse).map(normalizePendingProvider));
      setStats(statsResponse?.data || statsResponse || {});
      setMessage("User disabled successfully");
    } catch (err) {
      setError(err.message || "Unable to disable user.");
    } finally {
      setDeletingUserId(null);
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
    ["Platform earnings", formatCurrency(getTotalPlatformEarnings(invoices)), "check"],
  ];

  return (
    <div className="dashboard-page dashboard-page-admin">
      <DecorativeBackdrop variant="admin" />
      <div className="container-sahayak">
        <div className="dashboard-header">
          <span className="eyebrow">Administration</span>
          <h1>Sahayak overview</h1>
          <p>Monitor users, bookings, providers, and customer feedback.</p>
        </div>

        {error && (
          <div className="auth-alert auth-alert-error">
            {error}
          </div>
        )}
        {message && (
          <div className="auth-alert auth-alert-success">
            <ToolIcon name="check" size={15} />
            {message}
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
          {TABS.map(({ id, label, icon }) => (
            <button
              key={id}
              className={`dashboard-tab ${activeTab === id ? "active" : ""}`}
              onClick={() => setActiveTab(id)}
            >
              <ToolIcon name={icon} size={16} /> {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="empty-state surface-card"><h5>Loading admin data...</h5></div>
        ) : activeTab === "users" ? (
          <UsersTable
            users={users}
            providers={providers}
            currentUser={currentUser}
            deletingUserId={deletingUserId}
            onDeleteUser={handleDeleteUser}
          />
        ) : activeTab === "bookings" ? (
          <BookingsTable bookings={bookings} userNames={userNames} providerNames={providerNames} />
        ) : activeTab === "reviews" ? (
          <ReviewsTable reviews={reviews} userNames={userNames} providerNames={providerNames} />
        ) : activeTab === "payments" ? (
          <PaymentsTable payments={payments} userNames={userNames} />
        ) : activeTab === "invoices" ? (
          <InvoicesTable invoices={invoices} />
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

function UsersTable({
  users,
  providers,
  currentUser,
  deletingUserId,
  onDeleteUser,
}) {
  if (users.length === 0) return <AdminEmptyState icon="users" title="No users yet" body="Registered Sahayak users will appear here." />;
  return (
    <Table headers={["User", "Email", "Phone", "Role", "KYC", "Status", "Joined", "Actions"]}>
      {users.map((user) => {
        const userId = user.id ?? user.userId;
        const disabled = user.enabled === false || user.active === false;
        const isCurrentUser = isSameUser(user, currentUser);

        return (
        <tr key={userId}>
          <td>
            <AdminProviderIdentity
              provider={getProviderForUser(user, providers)}
              name={getName(user)}
            />
          </td>
          <td>{user.email || "—"}</td>
          <td>{user.phone || "—"}</td>
          <td>{formatValue(user.role)}</td>
          <td>{getMaskedAadhaar(getProviderForUser(user, providers)) || "—"}</td>
          <td>
            <span className={`status-badge ${disabled ? "disabled" : "active"}`}>
              {disabled ? "Disabled" : "Active"}
            </span>
          </td>
          <td>{formatDate(user.createdAt)}</td>
          <td>
            {!disabled && !isCurrentUser && (
              <button
                type="button"
                className="btn-sahayak btn-sahayak-reject btn-sm"
                disabled={deletingUserId != null}
                onClick={() => onDeleteUser(userId)}
              >
                {deletingUserId === userId ? "Disabling..." : "Disable"}
              </button>
            )}
          </td>
        </tr>
        );
      })}
    </Table>
  );
}

function BookingsTable({ bookings, userNames, providerNames }) {
  if (bookings.length === 0) return <AdminEmptyState icon="calendar" title="No bookings yet" body="New service bookings will appear here." />;
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
  if (reviews.length === 0) return <AdminEmptyState icon="star" title="No reviews yet" body="Customer reviews will appear after completed services." />;
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
  if (payments.length === 0) return <AdminEmptyState icon="wallet" title="No payments yet" body="Completed payment records will appear here." />;
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

function InvoicesTable({ invoices }) {
  const totalPlatformEarnings = getTotalPlatformEarnings(invoices);
  const [downloadingId, setDownloadingId] = useState(null);
  const [downloadError, setDownloadError] = useState("");

  const handleDownload = async (bookingId) => {
    setDownloadingId(bookingId);
    setDownloadError("");
    try {
      await downloadInvoicePdf(bookingId);
    } catch (err) {
      setDownloadError(err.message || "Unable to download invoice.");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <section className="admin-invoices-section">
      <div className="admin-invoice-summary surface-card">
        <span className="admin-metric-icon"><ToolIcon name="check" size={22} /></span>
        <div>
          <strong>{formatCurrency(totalPlatformEarnings)}</strong>
          <span>Total platform earning</span>
        </div>
      </div>
      {downloadError && (
        <div className="auth-alert auth-alert-error">
          {downloadError}
        </div>
      )}
      {invoices.length === 0 ? (
        <AdminEmptyState icon="check" title="No invoices yet" body="Generated service invoices will appear here." />
      ) : <Table
        headers={[
          "Invoice",
          "Booking",
          "Customer",
          "Provider",
          "Service amount",
          "Platform fee",
          "CGST",
          "SGST",
          "Provider earning",
          "Total payable",
          "Created",
          "Download",
        ]}
      >
        {invoices.map((invoice) => (
          <tr key={invoice.id ?? invoice.invoiceNumber ?? invoice.bookingId}>
            <td><strong>{invoice.invoiceNumber || "-"}</strong></td>
            <td>#{invoice.bookingId ?? "-"}</td>
            <td>{invoice.customerId ?? "-"}</td>
            <td>{invoice.providerId ?? "-"}</td>
            <td>{formatCurrency(invoice.serviceAmount)}</td>
            <td>{formatCurrency(invoice.platformFee)}</td>
            <td>{formatCurrency(invoice.cgst)}</td>
            <td>{formatCurrency(invoice.sgst)}</td>
            <td>{formatCurrency(invoice.providerEarning)}</td>
            <td>{formatCurrency(invoice.totalPayable)}</td>
            <td>{formatDate(invoice.createdAt)}</td>
            <td>
              <button
                type="button"
                className="btn-sahayak btn-sahayak-outline btn-sm"
                disabled={downloadingId === invoice.bookingId || invoice.bookingId == null}
                onClick={() => handleDownload(invoice.bookingId)}
              >
                {downloadingId === invoice.bookingId ? "Downloading..." : "Download"}
              </button>
            </td>
          </tr>
        ))}
      </Table>}
    </section>
  );
}

function PendingProvidersTable({ providers, providerAction, onDecision }) {
  if (providers.length === 0) {
    return (
      <div className="empty-state surface-card">
        <ToolIcon name="check" size={36} />
        <h5>No pending provider approvals.</h5>
        <p>New provider applications will appear here for review.</p>
      </div>
    );
  }

  return (
    <Table
      headers={[
        "Provider ID",
        "Provider",
        "Email",
        "Phone",
        "Masked Aadhaar",
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
            <td><AdminProviderIdentity provider={provider} name={provider.name} /></td>
            <td>{provider.email || "—"}</td>
            <td>{provider.phone || "—"}</td>
            <td>{getMaskedAadhaar(provider) || "—"}</td>
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

function AdminEmptyState({ icon, title, body }) {
  return (
    <div className="empty-state surface-card">
      <ToolIcon name={icon} size={36} />
      <h5>{title}</h5>
      <p>{body}</p>
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

function getTotalPlatformEarnings(invoices) {
  return invoices.reduce(
    (total, invoice) => total + invoice.platformFee + invoice.cgst + invoice.sgst,
    0
  );
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
    profileImageUrl: getProviderImageUrl(provider) || getProviderImageUrl(user),
    aadhaarMasked: getMaskedAadhaar(provider) || getMaskedAadhaar(user),
    experienceYears: provider.experienceYears ?? provider.experience ?? 0,
    bio: provider.bio ?? provider.description ?? "",
    verificationStatus:
      provider.verificationStatus ?? provider.status ?? (provider.verified ? "VERIFIED" : "PENDING"),
  };
}

function normalizeInvoice(invoice) {
  return {
    ...invoice,
    id: invoice.id ?? invoice.invoiceId,
    invoiceNumber: invoice.invoiceNumber ?? invoice.number ?? invoice.invoiceNo ?? `#${invoice.id ?? invoice.invoiceId ?? ""}`,
    bookingId: invoice.bookingId ?? invoice.booking?.id,
    customerId: invoice.customerId ?? invoice.customer?.id ?? invoice.booking?.customerId,
    providerId: invoice.providerId ?? invoice.provider?.id ?? invoice.booking?.providerId,
    serviceAmount: Number(invoice.serviceAmount ?? invoice.amount ?? invoice.booking?.quotedAmount ?? 0),
    platformFee: Number(invoice.platformFee ?? 0),
    cgst: Number(invoice.cgst ?? invoice.CGST ?? 0),
    sgst: Number(invoice.sgst ?? invoice.SGST ?? 0),
    providerEarning: Number(invoice.providerEarning ?? invoice.providerEarnings ?? 0),
    totalPayable: Number(invoice.totalPayable ?? invoice.totalAmount ?? invoice.amount ?? 0),
    createdAt: invoice.createdAt ?? invoice.invoiceDate ?? invoice.generatedAt,
  };
}

function AdminProviderIdentity({ provider, name }) {
  return (
    <div className="admin-provider-identity">
      <ProviderAvatar
        className="dp-avatar admin-provider-avatar"
        imageUrl={getProviderImageUrl(provider)}
        initials={getInitials(name)}
        alt={`${name} profile`}
      />
      <strong>{name}</strong>
    </div>
  );
}

function getProviderForUser(user, providers) {
  return providers.find((provider) => {
    const userId = user.id ?? user.userId;
    return (
      provider.providerId === user.providerId ||
      provider.userId === userId ||
      provider.user?.id === userId ||
      (provider.email && provider.email === user.email)
    );
  }) || user;
}

function isSameUser(user, currentUser) {
  if (!currentUser) return false;

  const userId = user.id ?? user.userId;
  const currentUserId = currentUser.id ?? currentUser.userId;

  if (userId != null && currentUserId != null) {
    return String(userId) === String(currentUserId);
  }

  return Boolean(user.email && currentUser.email && user.email === currentUser.email);
}

function getInitials(name) {
  return String(name || "Provider")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

function formatCurrency(value) {
  const amount = Number(value ?? 0);
  return `Rs. ${Number.isFinite(amount) ? amount.toLocaleString("en-IN") : "0"}`;
}

function formatValue(value) {
  const text = String(value || "").replaceAll("_", " ").toLowerCase();
  return text ? text[0].toUpperCase() + text.slice(1) : "—";
}
