/**
 * Router Module - Route Guards and Configuration
 *
 * Exports route guard components and utilities for React Router v7 Declarative Mode.
 *
 * Requirements: 21.1, 21.2, 21.3, 23.7
 */

// Router Configuration
export { default as AppRoutes } from "./AppRoutes";

// Route Guards
export { default as AuthGuard } from "./AuthGuard";
export { default as GuestGuard } from "./GuestGuard";
export { default as RoleRoute } from "./RoleRoute";

// Route Utilities
export {
  canAccessRoute,
  isPlatformSuperAdmin,
  isCustomerSuperAdmin,
  isHod,
  getDefaultRedirectPath,
} from "./routeUtils";

