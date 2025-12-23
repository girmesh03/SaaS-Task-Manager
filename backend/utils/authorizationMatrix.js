import authMatrix from "../config/authorizationMatrix.json" assert { type: "json" };
import { SCOPES } from "./constants.js";

/**
 * Authorization Matrix Helper Functions
 *
 * Checks permissions based on role, resource, and operation
 * Uses authorizationMatrix.json as single source of truth
 */

/**
 * Check if user has permission for operation on resource
 * @param {object} user - Authenticated user
 * @param {string} resource - Resource name (e.g., 'Task', 'User')
 * @param {string} operation - Operation name (e.g., 'create', 'read', 'update', 'delete')
 * @returns {object} { hasPermission: boolean, allowedScopes: array }
 */
export const checkPermission = (user, resource, operation) => {
  const role = user.role;

  // Check if resource exists in matrix
  if (!authMatrix[resource]) {
    return { hasPermission: false, allowedScopes: [] };
  }

  // Check if role exists for resource
  if (!authMatrix[resource][role]) {
    return { hasPermission: false, allowedScopes: [] };
  }

  // Get allowed scopes for operation
  const allowedScopes = authMatrix[resource][role][operation] || [];

  return {
    hasPermission: allowedScopes.length > 0,
    allowedScopes,
  };
};

/**
 * Get highest scope for user on resource operation
 * @param {object} user - Authenticated user
 * @param {string} resource - Resource name
 * @param {string} operation - Operation name
 * @returns {string|null} Highest scope or null if no permission
 */
export const getHighestScope = (user, resource, operation) => {
  const { hasPermission, allowedScopes } = checkPermission(
    user,
    resource,
    operation
  );

  if (!hasPermission) {
    return null;
  }

  // Scope hierarchy: crossOrg > crossDept > ownDept > own
  if (allowedScopes.includes(SCOPES.CROSS_ORG)) {
    return SCOPES.CROSS_ORG;
  }
  if (allowedScopes.includes(SCOPES.CROSS_DEPT)) {
    return SCOPES.CROSS_DEPT;
  }
  if (allowedScopes.includes(SCOPES.OWN_DEPT)) {
    return SCOPES.OWN_DEPT;
  }
  if (allowedScopes.includes(SCOPES.OWN)) {
    return SCOPES.OWN;
  }

  return null;
};

/**
 * Check if user can access specific resource instance
 * @param {object} user - Authenticated user
 * @param {object} resourceDoc - Resource document
 * @param {string} operation - Operation name
 * @param {string} resourceType - Resource type name
 * @returns {boolean} True if user can access resource
 */
export const canAccessResource = (
  user,
  resourceDoc,
  operation,
  resourceType
) => {
  const { hasPermission, allowedScopes } = checkPermission(
    user,
    resourceType,
    operation
  );

  if (!hasPermission) {
    return false;
  }

  // Check scope-based access
  for (const scope of allowedScopes) {
    switch (scope) {
      case SCOPES.CROSS_ORG:
        // Platform SuperAdmin can access all organizations
        return true;

      case SCOPES.CROSS_DEPT:
        // SuperAdmin/Admin can access all departments in their organization
        if (
          resourceDoc.organization &&
          resourceDoc.organization.toString() ===
            user.organization._id.toString()
        ) {
          return true;
        }
        break;

      case SCOPES.OWN_DEPT:
        // Manager/User can access resources in their department
        if (
          resourceDoc.organization &&
          resourceDoc.organization.toString() ===
            user.organization._id.toString() &&
          resourceDoc.department &&
          resourceDoc.department.toString() === user.department._id.toString()
        ) {
          return true;
        }
        break;

      case SCOPES.OWN:
        // User can access their own resources
        if (
          resourceDoc.createdBy &&
          resourceDoc.createdBy.toString() === user._id.toString()
        ) {
          return true;
        }
        // Check other ownership fields
        if (
          resourceDoc.addedBy &&
          resourceDoc.addedBy.toString() === user._id.toString()
        ) {
          return true;
        }
        if (
          resourceDoc.uploadedBy &&
          resourceDoc.uploadedBy.toString() === user._id.toString()
        ) {
          return true;
        }
        if (
          resourceDoc.recipient &&
          resourceDoc.recipient.toString() === user._id.toString()
        ) {
          return true;
        }
        // Check if user is in assignees array
        if (resourceDoc.assignees) {
          const assignees = Array.isArray(resourceDoc.assignees)
            ? resourceDoc.assignees
            : [resourceDoc.assignees];
          if (assignees.some((a) => a.toString() === user._id.toString())) {
            return true;
          }
        }
        // Check if user is in watchers array
        if (
          resourceDoc.watchers &&
          resourceDoc.watchers.some((w) => w.toString() === user._id.toString())
        ) {
          return true;
        }
        // Check if user is in mentions array
        if (
          resourceDoc.mentions &&
          resourceDoc.mentions.some((m) => m.toString() === user._id.toString())
        ) {
          return true;
        }
        break;
    }
  }

  return false;
};

/**
 * Get all permissions for user
 * @param {object} user - Authenticated user
 * @returns {object} Object with all permissions
 */
export const getAllPermissions = (user) => {
  const permissions = {};

  Object.keys(authMatrix).forEach((resource) => {
    permissions[resource] = {};

    ["create", "read", "update", "delete", "restore"].forEach((operation) => {
      const { hasPermission, allowedScopes } = checkPermission(
        user,
        resource,
        operation
      );
      permissions[resource][operation] = {
        hasPermission,
        allowedScopes,
      };
    });
  });

  return permissions;
};
