import {
  checkPermission,
  canAccessResource,
} from "../utils/authorizationMatrix.js";
import CustomError from "../errorHandler/CustomError.js";
import logger from "../utils/logger.js";

/**
 * Role-Based Authorization Middleware
 *
 * Checks if user has permission to perform operation on resource
 * Uses authorizationMatrix.json as single source of truth
 */

/**
 * Authorize user for operation on resource
 * @param {string} resource - Resource name (e.g., 'Task', 'User')
 * @param {string} operation - Operation name (e.g., 'create', 'read', 'update', 'delete')
 * @returns {function} Express middleware function
 */
export const authorize = (resource, operation) => {
  return async (req, res, next) => {
    try {
      const user = req.user;

      if (!user) {
        throw CustomError.authentication("User not authenticated");
      }

      // Check permission
      const { hasPermission, allowedScopes } = checkPermission(
        user,
        resource,
        operation
      );

      if (!hasPermission) {
        logger.warn({
          message: "Authorization failed",
          userId: user._id,
          role: user.role,
          resource,
          operation,
        });

        throw CustomError.authorization(
          `Insufficient permissions to ${operation} ${resource}`,
          {
            resource,
            operation,
            role: user.role,
            requiredPermission: `${resource}.${operation}`,
          }
        );
      }

      // Attach allowed scopes to request for use in controllers
      req.allowedScopes = allowedScopes;

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user can access specific resource instance
 * Used in controllers after fetching resource
 * @param {object} user - Authenticated user
 * @param {object} resourceDoc - Resource document
 * @param {string} operation - Operation name
 * @param {string} resourceType - Resource type name
 * @throws {CustomError} If user cannot access resource
 */
export const checkResourceAccess = (
  user,
  resourceDoc,
  operation,
  resourceType
) => {
  const canAccess = canAccessResource(
    user,
    resourceDoc,
    operation,
    resourceType
  );

  if (!canAccess) {
    logger.warn({
      message: "Resource access denied",
      userId: user._id,
      role: user.role,
      resourceType,
      resourceId: resourceDoc._id,
      operation,
    });

    throw CustomError.authorization(
      `You do not have permission to ${operation} this ${resourceType}`,
      {
        resourceType,
        resourceId: resourceDoc._id,
        operation,
        role: user.role,
      }
    );
  }
};

export default authorize;
