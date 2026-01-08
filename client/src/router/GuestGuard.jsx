/**
 * GuestGuard Component - Protects Routes for Guests (Public only)
 *
 * Redirects authenticated users to dashboard.
 * Renders children if not authenticated.
 */

import { Navigate, useLocation } from "react-router";
import useAuth from "../hooks/useAuth";
import { MuiLoading } from "../components/common";

const GuestGuard = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <MuiLoading fullScreen message="Loading..." />;
  }

  // Define pages that are strictly for unauthenticated users
  const isAuthPage = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ].some((path) => location.pathname.startsWith(path));

  // If user is authenticated and trying to access an auth page except home page ("/"), redirect to dashboard
  if (user && isAuthPage) {
    return <Navigate to="/dashboard" replace />;
  }

  // Otherwise (if unauthenticated, or authenticated but on landing page), render children
  return children
};

export default GuestGuard;
