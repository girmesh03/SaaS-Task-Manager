/**
 * RoleRoute Component - Role-Based Access Guard
 *
 * Protects routes that require specific user roles.
 * Redirects to /dashboard if user has insufficient permissions.
 * Must be used within a ProtectedRoute (assumes user is authenticated).
 *
 * Requirements: 21.1, 21.2, 21.3
 */

import { Navigate, useLocation } from "react-router";
import useAuth from "../hooks/useAuth";
import { USER_ROLES } from "../utils/constants";
import { MuiLoading } from "../components/common";
import { toast } from "react-toastify";
import { canAccessRoute } from "./routeUtils";

/**
 * RoleRoute - Role-based access guard component
 *
 * @param {Object} props - Component props
 * @param {string[]} props.allowedRoles - Array of roles allowed to access this route
 * @param {boolean} props.requirePlatformUser - If true, only platform users can access
 * @param {boolean} props.requireHod - If true, only HOD users can access
 * @param {string} props.redirectTo - Custom redirect path (default: /dashboard)
 * @param {React.ReactNode} props.children - Children to render
 *
 * @returns {React.ReactElement} Protected content or redirect
 *
 * @example
 * // Allow only SuperAdmin and Admin
 * {
 *   Component: () => <RoleRoute allowedRoles={["SuperAdmin", "Admin"]}><Outlet /></RoleRoute>,
 *   children: [
 *     { path: "users", Component: UsersPage }
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
  const { user } = useAuth();

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
    // Show toast error
    toast.error("You do not have permission to access this page.");

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

  // Render children
  return children;
};

export default RoleRoute;
