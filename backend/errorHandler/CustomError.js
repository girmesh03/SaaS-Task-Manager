/**
 * Custom Error Class with Static Helper Methods
 *
 * CRITICAL: ONLY use static helper methods (validation, authentication, authorization, notFound, conflict, internal)
 * NEVER use consctor d

 * Error Codes:
 * - VALIDATION_ERROR (400): Invalid input data
 * - AUTHENTICATION_ERROR (401): Invalid credentials, triggers logout on frontend
 * - AUTHORIZATION_ERROR (403): Insufficient permissions
 * - NOT_FOUND_ERROR (404): Resource not found
 * - CONFLICT_ERROR (409): Duplicate resources
 * - INTERNAL_SERVER_ERROR (500): Unexpected errors
 */

class CustomError extends Error {
  constructor(message, statusCode, errorCode, context = {}) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.context = context;
    this.isOperational = true; // Distinguish operational errors from programming errors
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Validation Error (400)
   * @param {string} message - Descriptive error message
   * @param {object} context - Additional context (field details, constraints)
   * @returns {CustomError}
   */
  static validation(message, context = {}) {
    return new CustomError(message, 400, "VALIDATION_ERROR", context);
  }

  /**
   * Authentication Error (401)
   * Triggers automatic logout on frontend
   * @param {string} message - Descriptive error message
   * @param {object} context - Additional context
   * @returns {CustomError}
   */
  static authentication(message, context = {}) {
    return new CustomError(message, 401, "AUTHENTICATION_ERROR", context);
  }

  /**
   * Authorization Error (403)
   * @param {string} message - Descriptive error message
   * @param {object} context - Additional context (required role/scope)
   * @returns {CustomError}
   */
  static authorization(message, context = {}) {
    return new CustomError(message, 403, "AUTHORIZATION_ERROR", context);
  }

  /**
   * Not Found Error (404)
   * @param {string} message - Descriptive error message
   * @param {object} context - Additional context (resource type, ID)
   * @returns {CustomError}
   */
  static notFound(message, context = {}) {
    return new CustomError(message, 404, "NOT_FOUND_ERROR", context);
  }

  /**
   * Conflict Error (409)
   * @param {string} message - Descriptive error message
   * @param {object} context - Additional context (conflicting field, value)
   * @returns {CustomError}
   */
  static conflict(message, context = {}) {
    return new CustomError(message, 409, "CONFLICT_ERROR", context);
  }

  /**
   * Internal Server Error (500)
   * @param {string} message - Generic error message for user
   * @param {object} context - Additional context (original error details)
   * @returns {CustomError}
   */
  static internal(message, context = {}) {
    return new CustomError(message, 500, "INTERNAL_SERVER_ERROR", context);
  }
}

export default CustomError;
