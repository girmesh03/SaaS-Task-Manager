/**
 * Authorization Helper - Frontend Permission Checks
 *
 * Checks user permissions based on role, resource, and operation.
 * Uses authorization matrix matching backend implementation.
 *
 * CRITICAL: This is a CLIENT-SIDE helper for UI display only.
 * Backend ALWAYS enforces authorization - never trust client-side checks alone.
 *
 * Requirements: 21.1, 21.2, 21.3, 21.4, 21.5, 21.6, 21.7, 21.8, 21.9
 */

import { SCOPES } from "./constants";

/**
 * Authorization Matrix
 *
 * MUST match backend/config/authorizationMatrix.json exactly.
 * Defines permissions for each role on each resource.
 *
 * Structure: { Resource: { Role: { operation: [scopes] } } }
 */
const authorizationMatrix = {
  Organization: {
    SuperAdmin: {
      create: [],
      read: ["crossOrg", "own"],
      update: ["crossOrg", "own"],
      delete: ["crossOrg", "own"],
      restore: ["crossOrg", "own"],
    },
    Admin: {
      create: [],
      read: ["own"],
      update: [],
      delete: [],
      restore: [],
    },
    Manager: {
      create: [],
      read: ["own"],
      update: [],
      delete: [],
      restore: [],
    },
    User: {
      create: [],
      read: ["own"],
      update: [],
      delete: [],
      restore: [],
    },
  },
  Department: {
    SuperAdmin: {
      create: ["crossDept"],
      read: ["crossDept"],
      update: ["crossDept"],
      delete: ["crossDept"],
      restore: ["crossDept"],
    },
    Admin: {
      create: ["crossDept"],
      read: ["crossDept"],
      update: ["crossDept"],
      delete: ["crossDept"],
      restore: ["crossDept"],
    },
    Manager: {
      create: [],
      read: ["ownDept"],
      update: [],
      delete: [],
      restore: [],
    },
    User: {
      create: [],
      read: ["ownDept"],
      update: [],
      delete: [],
      restore: [],
    },
  },
  User: {
    SuperAdmin: {
      create: ["crossDept"],
      read: ["crossDept"],
      update: ["crossDept"],
      delete: ["crossDept"],
      restore: ["crossDept"],
    },
    Admin: {
      create: ["crossDept"],
      read: ["crossDept"],
      update: ["crossDept"],
      delete: ["crossDept"],
      restore: ["crossDept"],
    },
    Manager: {
      create: [],
      read: ["ownDept"],
      update: ["own"],
      delete: [],
      restore: [],
    },
    User: {
      create: [],
      read: ["ownDept"],
      update: ["own"],
      delete: [],
      restore: [],
    },
  },
  Vendor: {
    SuperAdmin: {
      create: ["crossDept"],
      read: ["crossDept"],
      update: ["crossDept"],
      delete: ["crossDept"],
      restore: ["crossDept"],
    },
    Admin: {
      create: ["crossDept"],
      read: ["crossDept"],
      update: ["crossDept"],
      delete: ["crossDept"],
      restore: ["crossDept"],
    },
    Manager: {
      create: ["ownDept"],
      read: ["ownDept"],
      update: ["ownDept"],
      delete: ["ownDept"],
      restore: ["ownDept"],
    },
    User: {
      create: [],
      read: ["ownDept"],
      update: [],
      delete: [],
      restore: [],
    },
  },
  Material: {
    SuperAdmin: {
      create: ["crossDept"],
      read: ["crossDept"],
      update: ["crossDept"],
      delete: ["crossDept"],
      restore: ["crossDept"],
    },
    Admin: {
      create: ["crossDept"],
      read: ["crossDept"],
      update: ["crossDept"],
      delete: ["crossDept"],
      restore: ["crossDept"],
    },
    Manager: {
      create: ["ownDept"],
      read: ["ownDept"],
      update: ["ownDept"],
      delete: ["ownDept"],
      restore: ["ownDept"],
    },
    User: {
      create: [],
      read: ["ownDept"],
      update: [],
      delete: [],
      restore: [],
    },
  },
  Task: {
    SuperAdmin: {
      create: ["crossDept"],
      read: ["crossDept"],
      update: ["crossDept"],
      delete: ["crossDept"],
      restore: ["crossDept"],
    },
    Admin: {
      create: ["crossDept"],
      read: ["crossDept"],
      update: ["crossDept"],
      delete: ["crossDept"],
      restore: ["crossDept"],
    },
    Manager: {
      create: ["ownDept"],
      read: ["ownDept"],
      update: ["ownDept"],
      delete: ["ownDept"],
      restore: ["ownDept"],
    },
    User: {
      create: ["ownDept"],
      read: ["ownDept"],
      update: ["own"],
      delete: ["own"],
      restore: ["own"],
    },
  },
  TaskActivity: {
    SuperAdmin: {
      create: ["crossDept"],
      read: ["crossDept"],
      update: ["crossDept"],
      delete: ["crossDept"],
      restore: ["crossDept"],
    },
    Admin: {
      create: ["crossDept"],
      read: ["crossDept"],
      update: ["crossDept"],
      delete: ["crossDept"],
      restore: ["crossDept"],
    },
    Manager: {
      create: ["ownDept"],
      read: ["ownDept"],
      update: ["ownDept"],
      delete: ["ownDept"],
      restore: ["ownDept"],
    },
    User: {
      create: ["ownDept"],
      read: ["ownDept"],
      update: ["own"],
      delete: ["own"],
      restore: ["own"],
    },
  },
  TaskComment: {
    SuperAdmin: {
      create: ["crossDept"],
      read: ["crossDept"],
      update: ["crossDept"],
      delete: ["crossDept"],
      restore: ["crossDept"],
    },
    Admin: {
      create: ["crossDept"],
      read: ["crossDept"],
      update: ["crossDept"],
      delete: ["crossDept"],
      restore: ["crossDept"],
    },
    Manager: {
      create: ["ownDept"],
      read: ["ownDept"],
      update: ["ownDept"],
      delete: ["ownDept"],
      restore: ["ownDept"],
    },
    User: {
      create: ["ownDept"],
      read: ["ownDept"],
      update: ["own"],
      delete: ["own"],
      restore: ["own"],
    },
  },
  Attachment: {
    SuperAdmin: {
      create: ["crossDept"],
      read: ["crossDept"],
      update: ["crossDept"],
      delete: ["crossDept"],
      restore: ["crossDept"],
    },
    Admin: {
      create: ["crossDept"],
      read: ["crossDept"],
      update: ["crossDept"],
      delete: ["crossDept"],
      restore: ["crossDept"],
    },
    Manager: {
      create: ["ownDept"],
      read: ["ownDept"],
      update: ["ownDept"],
      delete: ["ownDept"],
      restore: ["ownDept"],
    },
    User: {
      create: ["ownDept"],
      read: ["ownDept"],
      update: ["own"],
      delete: ["own"],
      restore: ["own"],
    },
  },
  Notification: {
    SuperAdmin: {
      create: [],
      read: ["own"],
      update: ["own"],
      delete: ["own"],
      restore: [],
    },
    Admin: {
      create: [],
      read: ["own"],
      update: ["own"],
      delete: ["own"],
      restore: [],
    },
    Manager: {
      create: [],
      read: ["own"],
      update: ["own"],
      delete: ["own"],
      restore: [],
    },
    User: {
      create: [],
      read: ["own"],
      update: ["own"],
      delete: ["own"],
      restore: [],
    },
  },
};

/**
 * Check if user has permission for operation on resource
 *
 * Checks authorization matrix for user's role and resource.
 * Returns permission status and allowed scopes.
 *
 * @param {Object} user - Authenticated user object
 * @param {string} user.role - User role (SuperAdmin, Admin, Manager, User)
 * @param {boolean} user.isPlatformUser - Whether user belongs to platform organization
 * @param {string} resource - Resource name (Organization, Department, User, Task, etc.)
 * @param {string} operation - Operation name (create, read, update, delete, restore)
 *
 * @returns {Object} Permission check result
 * @returns {boolean} return.hasPermission - Whether user has permission
 * @returns {string[]} return.allowedScopes - Array of allowed scopes
 *
 * @example
 * const user = { role: "Admin", isPlatformUser: false };
 * const result = checkPermission(user, "Task", "create");
 * // Returns: { hasPermission: true, allowedScopes: ["crossDept"] }
 *
 * @example
 * const user = { role: "User", isPlatformUser: false };
 * const result = checkPermission(user, "Organization", "delete");
 * // Returns: { hasPermission: false, allowedScopes: [] }
 */
export const checkPermission = (user, resource, operation) => {
  if (!user || !user.role) {
    return { hasPermission: false, allowedScopes: [] };
  }

  const role = user.role;

  // Check if resource exists in matrix
  if (!authorizationMatrix[resource]) {
    return { hasPermission: false, allowedScopes: [] };
  }

  // Check if role exists for resource
  if (!authorizationMatrix[resource][role]) {
    return { hasPermission: false, allowedScopes: [] };
  }

  // Get allowed scopes for operation
  let allowedScopes = authorizationMatrix[resource][role][operation] || [];

  // CRITICAL: Only Platform Users can have crossOrg scope
  if (!user.isPlatformUser) {
    allowedScopes = allowedScopes.filter((scope) => scope !== SCOPES.CROSS_ORG);
  }

  return {
    hasPermission: allowedScopes.length > 0,
    allowedScopes,
  };
};

/**
 * Check if user can perform action on resource
 *
 * Simplified permission check that returns boolean.
 * Useful for conditional rendering in UI.
 *
 * @param {Object} user - Authenticated user object
 * @param {string} resource - Resource name
 * @param {string} action - Action name (create, read, update, delete, restore)
 *
 * @returns {boolean} True if user can perform action
 *
 * @example
 * const user = { role: "Manager", isPlatformUser: false };
 * const canCreate = canPerformAction(user, "Task", "create");
 * // Returns: true
 *
 * @example
 * // In component
 * {canPerformAction(user, "Task", "delete") && (
 *   <Button onClick={handleDelete}>Delete</Button>
 * )}
 */
export const canPerformAction = (user, resource, action) => {
  const { hasPermission } = checkPermission(user, resource, action);
  return hasPermission;
};

/**
 * Get highest scope for user on resource operation
 *
 * Returns the highest scope user has for an operation.
 * Scope hierarchy: crossOrg > crossDept > ownDept > own
 *
 * @param {Object} user - Authenticated user object
 * @param {string} resource - Resource name
 * @param {string} operation - Operation name
 *
 * @returns {string|null} Highest scope or null if no permission
 *
 * @example
 * const user = { role: "SuperAdmin", isPlatformUser: true };
 * const scope = getHighestScope(user, "Organization", "read");
 * // Returns: "crossOrg"
 *
 * @example
 * const user = { role: "Manager", isPlatformUser: false };
 * const scope = getHighestScope(user, "Task", "update");
 * // Returns: "ownDept"
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
 *
 * Checks if user can access a specific resource based on scope rules.
 * Considers organization, department, and ownership.
 *
 * @param {Object} user - Authenticated user object
 * @param {Object} user.organization - User's organization object with _id
 * @param {Object} user.department - User's department object with _id
 * @param {string} user._id - User's ID
 * @param {Object} resourceDoc - Resource document to check access for
 * @param {string} operation - Operation name (read, update, delete, restore)
 * @param {string} resourceType - Resource type name
 *
 * @returns {boolean} True if user can access resource
 *
 * @example
 * const user = {
 *   _id: "user123",
 *   role: "Manager",
 *   organization: { _id: "org123" },
 *   department: { _id: "dept123" },
 *   isPlatformUser: false
 * };
 * const task = {
 *   _id: "task123",
 *   organization: "org123",
 *   department: "dept123",
 *   createdBy: "user456"
 * };
 * const canAccess = canAccessResource(user, task, "read", "Task");
 * // Returns: true (Manager can read tasks in own department)
 */
export const canAccessResource = (
  user,
  resourceDoc,
  operation,
  resourceType
) => {
  if (!user || !resourceDoc) {
    return false;
  }

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
        // Platform SuperAdmin can access across organizations
        if (user.isPlatformUser && user.role === "SuperAdmin") {
          return true;
        }

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
          resourceType === "User" &&
          resourceDoc._id.toString() === user._id.toString()
        ) {
          return true;
        }
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
 *
 * Returns complete permission map for user across all resources.
 * Useful for debugging or displaying user capabilities.
 *
 * @param {Object} user - Authenticated user object
 *
 * @returns {Object} Object with all permissions
 * @returns {Object} return[resource] - Permissions for each resource
 * @returns {Object} return[resource][operation] - Permission details for each operation
 * @returns {boolean} return[resource][operation].hasPermission - Whether user has permission
 * @returns {string[]} return[resource][operation].allowedScopes - Allowed scopes
 *
 * @example
 * const user = { role: "Manager", isPlatformUser: false };
 * const permissions = getAllPermissions(user);
 * // Returns: {
 * //   Task: {
 * //     create: { hasPermission: true, allowedScopes: ["ownDept"] },
 * //     read: { hasPermission: true, allowedScopes: ["ownDept"] },
 * //     update: { hasPermission: true, allowedScopes: ["ownDept"] },
 * //     delete: { hasPermission: true, allowedScopes: ["ownDept"] },
 * //     restore: { hasPermission: true, allowedScopes: ["ownDept"] }
 * //   },
 * //   ...
 * // }
 */
export const getAllPermissions = (user) => {
  if (!user) {
    return {};
  }

  const permissions = {};

  Object.keys(authorizationMatrix).forEach((resource) => {
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

/**
 * Check if user is Platform SuperAdmin
 *
 * Platform SuperAdmin has crossOrg scope and can manage all organizations.
 *
 * @param {Object} user - Authenticated user object
 * @returns {boolean} True if user is Platform SuperAdmin
 *
 * @example
 * const user = { role: "SuperAdmin", isPlatformUser: true };
 * const isPlatformSuperAdmin = isPlatformSuperAdmin(user);
 * // Returns: true
 */
export const isPlatformSuperAdmin = (user) => {
  return user?.role === "SuperAdmin" && user?.isPlatformUser === true;
};

/**
 * Check if user is Customer SuperAdmin
 *
 * Customer SuperAdmin has crossDept scope within their organization.
 *
 * @param {Object} user - Authenticated user object
 * @returns {boolean} True if user is Customer SuperAdmin
 *
 * @example
 * const user = { role: "SuperAdmin", isPlatformUser: false };
 * const isCustomerSuperAdmin = isCustomerSuperAdmin(user);
 * // Returns: true
 */
export const isCustomerSuperAdmin = (user) => {
  return user?.role === "SuperAdmin" && user?.isPlatformUser === false;
};

/**
 * Check if user is HOD (Head of Department)
 *
 * HOD users have SuperAdmin or Admin roles.
 *
 * @param {Object} user - Authenticated user object
 * @returns {boolean} True if user is HOD
 *
 * @example
 * const user = { role: "Admin", isHod: true };
 * const isHOD = isHOD(user);
 * // Returns: true
 */
export const isHOD = (user) => {
  return (
    user?.isHod === true ||
    user?.role === "SuperAdmin" ||
    user?.role === "Admin"
  );
};
