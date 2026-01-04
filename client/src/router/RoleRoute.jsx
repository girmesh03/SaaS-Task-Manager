/**
 * RoleRoute Component - Role-Based Access Guard
 *
 * Protects routes that require specific user roles.
 * Redirects to /dashboard if user has insufficient permissions.
 * Must be used within a ProtectedRoute (assumes user is authenticated).
 *
 * Requirements: 21.1, 21.2, 21.3
 */

import { Navigate, Outlet, useLocation } from "react-router";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../redux/features/authSlice";
import { USER_ROLES } from "../utils/constants";
import MuiLoading from "../components/common/MuiLoading";
import { canAccessRoute } from "./routeUtils";

/**
 * RoleRoute - Role-based access guard component
 *
 * @param {Object} props - Component props
 * @param {string[]} props.allowedRoles - Array of roles allowed to access this route
 * @param {boolean} props.requirePlatformUser - If true, only platform users can access
 * @param {boolean} props.requireHod - If true, only HOD users can access
 * @param {string} props.redirectTo - Custom redirect path (default: /dashboard)
 * @param {React.ReactNode} props.children - Optional children to render instead of Outlet
 *
 * @returns {React.ReactElement} Protected content or redirect
 *
 * @example
 * // Allow only SuperAdmin and Admin
 * {
 *   Component: () => <RoleRoute allowedRoles={["SuperAdmin", "Admin"]} />,
 *   children: [
 *     { path: "users", Component: UsersPage }
 *   ]
 * }
 *
 * @example
 * // Platform SuperAdmin only (Organizations page)
 * {
 *   Component: () => <RoleRoute allowedRoles={["SuperAdmin"]} requirePlatformUser />,
 *   children: [
 *     { path: "organizations", Component: OrganizationsPage }
 *   ]
 * }
 *
 * @example
 * // HOD users only
 * {
 *   Component: () => <RoleRoute requireHod />,
 *   children: [
 *     { path: "department-settings", Component: DepartmentSettingsPage }
 *   ]
 * }
 */
const RoleRoute = ({
  allowedRoles = [],
  requirePlatformUser = false,
  requireHod = false,
  redirectTo = "/dashboard",
  children,
}) => {
  const location = useLocation();
  const user = useSelector(selectCurrentUser);

  // If no user, show loading (should be handled by ProtectedRoute parent)
  if (!user) {
    return <MuiLoading fullScreen message="Loading user data..." />;
  }

  // Use the canAccessRoute helper for consistent permission checking
  const hasAccess = canAccessRoute(
    user,
    allowedRoles,
    requirePlatformUser,
    requireHod
  );

  // Redirect if access check fails
  if (!hasAccess) {
    return (
      <Navigate
        to={redirectTo}
        state={{
          from: location.pathname,
          reason: "insufficient_permissions",
        }}
        replace
      />
    );
  }

  // Render children if provided, otherwise render Outlet for nested routes
  return children ? children : <Outlet />;
};

export default RoleRoute;
