/**
 * AuthGuard Component - Protects Routes Requiring Authentication
 *
 * Redirects unauthenticated users to login.
 * Renders children if authenticated.
 */

import { Navigate, useLocation } from "react-router";
import useAuth from "../hooks/useAuth";
import { MuiLoading } from "../components/common";

const AuthGuard = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <MuiLoading fullScreen message="Verifying session..." />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
};

export default AuthGuard;
