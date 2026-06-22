import React, { useEffect, useMemo, useState } from "react";
import ToolIcon from "../components/ToolIcon";
import {
  getAdminBookings,
  getAdminProviders,
  getAdminReviews,
  getAdminStats,
  getAdminUsers,
} from "../api/adminApi";
import { normalizeBooking, normalizeProvider, unwrapList } from "../api/normalizers";
import { normalizeRole } from "../utils/roles";
import { getAdminPayments } from "../api/paymentApi";

const TABS = ["users", "bookings", "reviews", "payments"];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("users");
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [providers, setProviders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      getAdminStats(),
      getAdminUsers(),
      getAdminBookings(),
      getAdminProviders(),
      getAdminReviews(),
      getAdminPayments(),
    ])
      .then(([
        statsResponse,
        usersResponse,
        bookingsResponse,
        providersResponse,
        reviewsResponse,
        paymentsResponse,
      ]) => {
        setStats(statsResponse?.data || statsResponse || {});
        setUsers(unwrapList(usersResponse));
        setBookings(unwrapList(bookingsResponse).map(normalizeBooking));
        setProviders(unwrapList(providersResponse).map(normalizeProvider));
        setReviews(unwrapList(reviewsResponse));
        setPayments(unwrapList(paymentsResponse));
      })
      .catch((err) => setError(err.message || "Unable to load admin dashboard."))
      .finally(() => setLoading(false));
  }, []);

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
          {TABS.map((tab) => (
            <button
              key={tab}
              className={`dashboard-tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab[0].toUpperCase() + tab.slice(1)}
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
        ) : (
          <PaymentsTable payments={payments} userNames={userNames} />
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

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

function formatValue(value) {
  const text = String(value || "").replaceAll("_", " ").toLowerCase();
  return text ? text[0].toUpperCase() + text.slice(1) : "—";
}
