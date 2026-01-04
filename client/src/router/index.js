/**
 * Router Module - Route Guards and Configuration
 *
 * Exports route guard components and utilities for React Router v7.
 *
 * Requirements: 21.1, 21.2, 21.3, 23.7
 */

// Router Configuration
export { default as router } from "./routes";

// Route Guards
export { default as ProtectedRoute } from "./ProtectedRoute";
export { default as RoleRoute } from "./RoleRoute";

// Route Components
export { default as LoadingFallback } from "./LoadingFallback";
export { default as RouteErrorBoundary } from "./RouteErrorBoundary";

// Route Utilities
export {
  canAccessRoute,
  isPlatformSuperAdmin,
  isCustomerSuperAdmin,
  isHod,
  getDefaultRedirectPath,
} from "./routeUtils";
