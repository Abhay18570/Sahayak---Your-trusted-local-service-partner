export const ROLES = {
  ADMIN: "ADMIN",
  PROVIDER: "PROVIDER",
  CUSTOMER: "CUSTOMER",
};

export function normalizeRole(role) {
  return String(role || "")
    .trim()
    .replace(/^ROLE_/i, "")
    .toUpperCase();
}

export function hasRole(user, role) {
  return normalizeRole(user?.role) === normalizeRole(role);
}

export function dashboardPathForRole(role) {
  switch (normalizeRole(role)) {
    case ROLES.ADMIN:
      return "/admin-dashboard";
    case ROLES.PROVIDER:
      return "/provider-dashboard";
    case ROLES.CUSTOMER:
      return "/dashboard";
    default:
      return null;
  }
}
