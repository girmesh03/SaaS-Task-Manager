/**
 * Custom Error Class with Static Helper Methods
 *
 * CRITICAL: ONLY use static helper methods (validation, authentication, authorization, notFound, conflict, internal)
 * NEVER use constructor directly
 *
 * Error Codes:
 * - VALIDATION_ERROR (400): Invalid input data
 * - AUTHENTICATION_ERROR (401): Invalid credentials, triggers logout on frontend
 * - AUTHORIZATION_ERROR (403): Insufficient permissions
 * - NOT_FOUND_ERROR (404): Resource not found
 * - CONFLICT_ERROR (409): Duplicate resources
 * - INTERNAL_SERVER_ERROR (500): Unexpected errors
 */

const SECRET_KEY = Symbol("CustomErrorSecret");

class CustomError extends Error {
  constructor(message, statusCode, errorCode, details = {}, secret) {
    if (secret !== SECRET_KEY) {
      throw new Error(
        "CustomError constructor is private. Use static helper methods (validation, authentication, authorization, notFound, conflict, internal)."
      );
    }
    super(message);
    this.name = "CustomError";
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true; // Distinguish operational errors from programming errors
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Validation Error (400)
   * @param {string} message - Descriptive error message
   * @param {object} details - Additional context (field details, constraints)
   * @returns {CustomError}
   */
  static validation(message, details = {}) {
    return new CustomError(message, 400, "VALIDATION_ERROR", details, SECRET_KEY);
  }

  /**
   * Authentication Error (401)
   * Triggers automatic logout on frontend
   * @param {string} message - Descriptive error message
   * @returns {CustomError}
   */
  static authentication(message) {
    return new CustomError(
      message,
      401,
      "AUTHENTICATION_ERROR",
      {},
      SECRET_KEY
    );
  }

  /**
   * Authorization Error (403)
   * @param {string} message - Descriptive error message
   * @param {object} details - Additional context (required role/scope)
   * @returns {CustomError}
   */
  static authorization(message, details = {}) {
    return new CustomError(
      message,
      403,
      "AUTHORIZATION_ERROR",
      details,
      SECRET_KEY
    );
  }

  /**
   * Not Found Error (404)
   * @param {string} resource - Resource name
   * @param {string} identifier - Resource identifier
   * @returns {CustomError}
   */
  static notFound(resource, identifier) {
    const message = `${resource} with identifier ${identifier} not found`;
    return new CustomError(
      message,
      404,
      "NOT_FOUND_ERROR",
      { resource, identifier },
      SECRET_KEY
    );
  }

  /**
   * Conflict Error (409)
   * @param {string} message - Descriptive error message
   * @param {object} details - Additional context (conflicting field, value)
   * @returns {CustomError}
   */
  static conflict(message, details = {}) {
    return new CustomError(message, 409, "CONFLICT_ERROR", details, SECRET_KEY);
  }

  /**
   * Internal Server Error (500)
   * @param {string} message - Generic error message for user
   * @param {object} details - Additional context (original error details)
   * @returns {CustomError}
   */
  static internal(message, details = {}) {
    return new CustomError(
      message,
      500,
      "INTERNAL_SERVER_ERROR",
      details,
      SECRET_KEY
    );
  }
}

export default CustomError;
