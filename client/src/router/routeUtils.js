/**
 * Route Utilities - Helper functions for route access control
 *
 * Provides utility functions for checking route access permissions.
 * Used by route guards and navigation components.
 *
 * Requirements: 21.1, 21.2, 21.3
 */

import { USER_ROLES } from "../utils/constants";

/**
 * Check if user can access a route based on role and permissions
 *
 * Can be used for:
 * - Conditional rendering in navigation menus
 * - Programmatic route access checks
 * - Pre-navigation validation
 *
 * @param {Object} user - Current user object from Redux state
 * @param {string} user.role - User's role (SuperAdmin, Admin, Manager, User)
 * @param {boolean} user.isPlatformUser - Whether user belongs to platform organization
 * @param {boolean} user.isHod - Whether user is Head of Department
 * @param {string[]} allowedRoles - Array of roles allowed to access (empty = all roles)
 * @param {boolean} requirePlatformUser - If true, only platform users can access
 * @param {boolean} requireHod - If true, only HOD users can access
 *
 * @returns {boolean} True if user can access the route
 *
 * @example
 * // Check if user can access Organizations page (Platform SuperAdmin only)
 * const canAccessOrganizations = canAccessRoute(user, ["SuperAdmin"], true);
 *
 * @example
 * // Check if user can access Users page (SuperAdmin and Admin)
 * const canAccessUsers = canAccessRoute(user, ["SuperAdmin", "Admin"]);
 *
 * @example
 * // Check if user can access HOD-only features
 * const canAccessHodFeatures = canAccessRoute(user, [], false, true);
 *
 * @example
 * // In navigation component
 * {canAccessRoute(user, ["SuperAdmin"], true) && (
 *   <NavItem to="/organizations">Organizations</NavItem>
 * )}
 */
export const canAccessRoute = (
  user,
  allowedRoles = [],
  requirePlatformUser = false,
  requireHod = false
) => {
  // No user = no access
  if (!user) return false;

  // Check if user has required role
  // Empty allowedRoles array means all roles are allowed
  const hasRequiredRole =
    allowedRoles.length === 0 || allowedRoles.includes(user.role);

  // Check if user is platform user (if required)
  const isPlatformUserValid = !requirePlatformUser || user.isPlatformUser;

  // Check if user is HOD (if required)
  // HOD users are SuperAdmin or Admin roles, or have isHod flag set
  const isHodValid =
    !requireHod ||
    user.isHod ||
    user.role === USER_ROLES.SUPER_ADMIN ||
    user.role === USER_ROLES.ADMIN;

  return hasRequiredRole && isPlatformUserValid && isHodValid;
};

/**
 * Check if user is Platform SuperAdmin
 *
 * Platform SuperAdmin has crossOrg scope and can manage all organizations.
 *
 * @param {Object} user - Current user object
 * @returns {boolean} True if user is Platform SuperAdmin
 *
 * @example
 * if (isPlatformSuperAdmin(user)) {
 *   // Show organization management features
 * }
 */
export const isPlatformSuperAdmin = (user) => {
  return user?.role === USER_ROLES.SUPER_ADMIN && user?.isPlatformUser === true;
};

/**
 * Check if user is Customer SuperAdmin
 *
 * Customer SuperAdmin has crossDept scope withineir orga
 *
 * @param {Object} user - Current user object
 * @returns {boolean} True if user is Customer SuperAdmin
 *
 * @example
 * if (isCustomerSuperAdmin(user)) {
 *   // Show organization-wide features
 * }
 */
export const isCustomerSuperAdmin = (user) => {
  return (
    user?.role === USER_ROLES.SUPER_ADMIN && user?.isPlatformUser === false
  );
};

/**
 * Check if user is HOD (Head of Department)
 *
 * HOD users have SuperAdmin or Admin roles, or have isHod flag.
 *
 * @param {Object} user - Current user object
 * @returns {boolean} True if user is HOD
 *
 * @example
 * if (isHod(user)) {
 *   // Show HOD-specific features
 * }
 */
export const isHod = (user) => {
  return (
    user?.isHod === true ||
    user?.role === USER_ROLES.SUPER_ADMIN ||
    user?.role === USER_ROLES.ADMIN
  );
};

/**
 * Get redirect path based on user role
 *
 * Returns the appropriate redirect path for a user after login
 * or when accessing unauthorized routes.
 *
 * @param {Object} user - Current user object
 * @returns {string} Redirect path
 *
 * @example
 * const redirectPath = getDefaultRedirectPath(user);
 * navigate(redirectPath);
 */
export const getDefaultRedirectPath = (user) => {
  if (!user) return "/login";
  return "/dashboard";
};
