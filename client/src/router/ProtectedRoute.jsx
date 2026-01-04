/**
 * ProtectedRoute Component - Authentication Guard
 *
 * Protects routes that require authentication.
 * Redirects to /login if user is not authenticated.
 * Preserves the intended destination for redirect after login.
 *
 * Requirements: 21.1, 21.2, 21.3
 */

import { Navigate, Outlet, useLocation } from "react-router";
import { useSelector } from "react-redux";
import {
  selectCurrentUser,
  selectIsAuthenticated,
  selectIsLoading,
} from "../redux/features/authSlice";
import MuiLoading from "../components/common/MuiLoading";

/**
 * ProtectedRoute - Authentication guard component
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Optional children to render instead of Outlet
 *
 * @returns {React.ReactElement} Protected content or redirect to login
 *
 * @example
 * // In router configuration
 * {
 *   Component: ProtectedRoute,
 *   children: [
 *     { path: "dashboard", Component: DashboardPage }
 *   ]
 * }
 *
 * @example
 * // With children prop
 * <ProtectedRoute>
 *   <DashboardPage />
 * </ProtectedRoute>
 */
const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectIsLoading);

  // Show loading state while checking authentication
  if (isLoading) {
    return <MuiLoading fullScreen message="Checking authentication..." />;
  }

  // Redirect to login if not authenticated
  // Preserve the intended destination in state for redirect after login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Render children if provided, otherwise render Outlet for nested routes
  return children ? children : <Outlet />;
};

export default ProtectedRoute;
