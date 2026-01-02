/**
 * useAuthorization Hook - Authorization Hook
 *
 * Custom hook for authorization checks.
 * Provides permission check functions for UI display.
 *
 * CRITICAL: This is CLIENT-SIDE only for UI display.
 * Backend ALWAYS enforces authorization - never trust client-side checks alone.
 *
 * Returns:
 * - canView: Function to check if user can view resource
 * - canCreate: Function to check if user can create resource
 * - canEdit: Function to check if user can edit resource
 * - canDelete: Function to check if user can delete resource
 * - canRestore: Function to check if user can restore resource
 *
 * Requirements: 21.1, 21.2, 21.3, 21.4, 21.5
 */

import { useSelector } from "react-redux";
import { selectCurrentUser } from "../redux/features/authSlice";
import {
  canPerformAction,
  canAccessResource,
  checkPermission,
  getHighestScope,
} from "../utils/authorizationHelper";

/**
 * useAuthorization hook
 *
 * @param {string} resource - Resource name (Organization, Department, User, Task, etc.)
 * @param {Object} resourceDoc - Optional resource document for instance-level checks
 *
 * @returns {Object} Authorization functions
 * @returns {Function} return.canView - Check if user can view resource
 * @returns {Function} return.canCreate - Check if user can create resource
 * @returns {Function} return.canEdit - Check if user can edit resource
 * @returns {Function} return.canDelete - Check if user can delete resource
 * @returns {Function} return.canRestore - Check if user can restore resource
 * @returns {Function} return.checkPermission - Check permission with scopes
 * @returns {Function} return.getHighestScope - Get highest scope for operation
 * @returns {Function} return.canAccessResource - Check if user can access specific resource
 *
 * @example
 * // Basic usage
 * const { canView, canCreate, canEdit, canDelete } = useAuthorization("Task");
 *
 * // Conditional rendering
 * {canCreate() && <Button onClick={handleCreate}>Create Task</Button>}
 * {canEdit() && <Button onClick={handleEdit}>Edit</Button>}
 * {canDelete() && <Button onClick={handleDelete}>Delete</Button>}
 *
 * @example
 * // Instance-level check
 * const task = { _id: "task123", createdBy: "user123", ... };
 * const { canEdit, canDelete } = useAuthorization("Task", task);
 *
 * // Check if user can edit this specific task
 * {canEdit() && <Button onClick={handleEdit}>Edit</Button>}
 *
 * @example
 * // Get permission details
 * const { checkPermission } = useAuthorization("Task");
 * const { hasPermission, allowedScopes } = checkPermission("create");
 * console.log("Can create task:", hasPermission);
 * console.log("Allowed scopes:", allowedScopes);
 */
const useAuthorization = (resource, resourceDoc = null) => {
  // Get current authenticated user from Redux store
  const user = useSelector(selectCurrentUser);

  /**
   * Check if user can view resource
   *
   * @returns {boolean} True if user can view resource
   */
  const canView = () => {
    if (!user) return false;

    // If resourceDoc provided, check instance-level access
    if (resourceDoc) {
      return canAccessResource(user, resourceDoc, "read", resource);
    }

    // Otherwise, check general permission
    return canPerformAction(user, resource, "read");
  };

  /**
   * Check if user can create resource
   *
   * @returns {boolean} True if user can create resource
   */
  const canCreate = () => {
    if (!user) return false;
    return canPerformAction(user, resource, "create");
  };

  /**
   * Check if user can edit resource
   *
   * @returns {boolean} True if user can edit resource
   */
  const canEdit = () => {
    if (!user) return false;

    // If resourceDoc provided, check instance-level access
    if (resourceDoc) {
      return canAccessResource(user, resourceDoc, "update", resource);
    }

    // Otherwise, check general permission
    return canPerformAction(user, resource, "update");
  };

  /**
   * Check if user can delete resource
   *
   * @returns {boolean} True if user can delete resource
   */
  const canDelete = () => {
    if (!user) return false;

    // If resourceDoc provided, check instance-level access
    if (resourceDoc) {
      return canAccessResource(user, resourceDoc, "delete", resource);
    }

    // Otherwise, check general permission
    return canPerformAction(user, resource, "delete");
  };

  /**
   * Check if user can restore resource
   *
   * @returns {boolean} True if user can restore resource
   */
  const canRestore = () => {
    if (!user) return false;

    // If resourceDoc provided, check instance-level access
    if (resourceDoc) {
      return canAccessResource(user, resourceDoc, "restore", resource);
    }

    // Otherwise, check general permission
    return canPerformAction(user, resource, "restore");
  };

  /**
   * Check permission with detailed scope information
   *
   * @param {string} operation - Operation name (create, read, update, delete, restore)
   *
   * @returns {Object} Permission check result
   * @returns {boolean} return.hasPermission - Whether user has permission
   * @returns {string[]} return.allowedScopes - Array of allowed scopes
   */
  const checkPermissionWithScopes = (operation) => {
    if (!user) {
      return { hasPermission: false, allowedScopes: [] };
    }
    return checkPermission(user, resource, operation);
  };

  /**
   * Get highest scope for operation
   *
   * @param {string} operation - Operation name (create, read, update, delete, restore)
   *
   * @returns {string|null} Highest scope or null if no permission
   */
  const getHighestScopeForOperation = (operation) => {
    if (!user) return null;
    return getHighestScope(user, resource, operation);
  };

  /**
   * Check if user can access specific resource instance
   *
   * @param {Object} doc - Resource document to check
   * @param {string} operation - Operation name (read, update, delete, restore)
   *
   * @returns {boolean} True if user can access resource
   */
  const canAccessResourceInstance = (doc, operation) => {
    if (!user || !doc) return false;
    return canAccessResource(user, doc, operation, resource);
  };

  return {
    canView,
    canCreate,
    canEdit,
    canDelete,
    canRestore,
    checkPermission: checkPermissionWithScopes,
    getHighestScope: getHighestScopeForOperation,
    canAccessResource: canAccessResourceInstance,
  };
};

export default useAuthorization;
