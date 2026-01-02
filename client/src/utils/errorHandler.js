/**
 * Error Handler Utility - Frontend Error Processing
 *
 * Handles RTK Query errors and converts them to user-friendly messages.
 * Maps HTTP status codes to appropriate error messages.
 * Extracts field-specific validation errors.
 *
 * Requirements: 22.1, 22.2, 22.3, 22.4, 22.5, 22.6, 22.7, 22.8
 */

/**
 * Handle API errors from RTK Query
 *
 * Parses RTK Query error objects and returns user-friendly error messages.
 * Handles different error types: HTTP errors, network errors, validation errors.
 *
 * @param {Object} error - RTK Query error object
 * @param {Object} error.status - HTTP status code or error type
 * @param {Object} error.data - Error response data from backend
 * @param {string} error.error - Error message for network errors
 *
 * @returns {Object} Parsed error object
 * @returns {string} return.message - User-friendly error message
 * @returns {Object} return.fieldErrors - Field-specific validation errors (if any)
 * @returns {number} return.status - HTTP status code (if available)
 *
 * @example
 * // HTTP error with validation
 * const error = {
 *   status: 400,
 *   data: {
 *     message: "Validation failed",
 *     errors: [
 *       { field: "email", message: "Email is required" },
 *       { field: "password", message: "Password must be at least 8 characters" }
 *     ]
 *   }
 * };
 * const parsed = handleApiError(error);
 * // Returns: {
 * //   message: "Validation failed",
 * //   fieldErrors: {
 * //     email: "Email is required",
 * //     password: "Password must be at least 8 characters"
 * //   },
 * //   status: 400
 * // }
 *
 * @example
 * // Network error
 * const error = { status: "FETCH_ERROR", error: "Failed to fetch" };
 * const parsed = handleApiError(error);
 * // Returns: {
 * //   message: "Network error. Please check your connection and try again.",
 * //   fieldErrors: {},
 * //   status: null
 * // }
 *
 * @example
 * // Authentication error
 * const error = { status: 401, data: { message: "Invalid credentials" } };
 * const parsed = handleApiError(error);
 * // Returns: {
 * //   message: "Invalid credentials",
 * //   fieldErrors: {},
 * //   status: 401
 * // }
 */
export const handleApiError = (error) => {
  // Default error response
  const errorResponse = {
    message: "An unexpected error occurred. Please try again.",
    fieldErrors: {},
    status: null,
  };

  // Handle network errors (no response from server)
  if (error?.status === "FETCH_ERROR" || error?.status === "PARSING_ERROR") {
    errorResponse.message =
      "Network error. Please check your connection and try again.";
    return errorResponse;
  }

  // Handle timeout errors
  if (error?.status === "TIMEOUT_ERROR") {
    errorResponse.message = "Request timed out. Please try again.";
    return errorResponse;
  }

  // Handle custom error types
  if (error?.status === "CUSTOM_ERROR") {
    errorResponse.message = error?.error || errorResponse.message;
    return errorResponse;
  }

  // Extract status code
  const status = error?.status;
  errorResponse.status = status;

  // Extract error data from response
  const errorData = error?.data;

  // Map HTTP status codes to user-friendly messages
  switch (status) {
    case 400:
      // Bad Request - Validation errors
      errorResponse.message =
        errorData?.message || "Invalid request. Please check your input.";

      // Extract field-specific validation errors
      if (errorData?.errors && Array.isArray(errorData.errors)) {
        errorData.errors.forEach((err) => {
          if (err.field && err.message) {
            errorResponse.fieldErrors[err.field] = err.message;
          }
        });
      }
      break;

    case 401:
      // Unauthorized - Authentication required
      errorResponse.message =
        errorData?.message || "Authentication required. Please login.";
      break;

    case 403:
      // Forbidden - Insufficient permissions
      errorResponse.message =
        errorData?.message ||
        "You don't have permission to perform this action.";
      break;

    case 404:
      // Not Found - Resource doesn't exist
      errorResponse.message =
        errorData?.message || "The requested resource was not found.";
      break;

    case 409:
      // Conflict - Duplicate resource or constraint violation
      errorResponse.message =
        errorData?.message ||
        "A conflict occurred. The resource may already exist.";

      // Extract field-specific conflict errors (e.g., duplicate email)
      if (errorData?.errors && Array.y(errorData.errors)) {
        errorData.errors.forEach((err) => {
          if (err.field && err.message) {
            errorResponse.fieldErrors[err.field] = err.message;
          }
        });
      }
      break;

    case 429:
      // Too Many Requests - Rate limit exceeded
      errorResponse.message =
        errorData?.message || "Too many requests. Please try again later.";
      break;

    case 500:
      // Internal Server Error
      errorResponse.message =
        errorData?.message || "Server error. Please try again later.";
      break;

    case 502:
      // Bad Gateway
      errorResponse.message =
        "Service temporarily unavailable. Please try again later.";
      break;

    case 503:
      // Service Unavailable
      errorResponse.message =
        "Service temporarily unavailable. Please try again later.";
      break;

    case 504:
      // Gateway Timeout
      errorResponse.message = "Request timed out. Please try again.";
      break;

    default:
      // Unknown error
      errorResponse.message = errorData?.message || errorResponse.message;

      // Try to extract field erroror unknown status codes
      if (errorData?.errors && Array.isArray(errorData.errors)) {
        errorData.errors.forEach((err) => {
          if (err.field && err.message) {
            errorResponse.fieldErrors[err.field] = err.message;
          }
        });
      }
  }

  return errorResponse;
};

/**
 * Get field error message
 *
 * Extracts error message for a specific field from field errors object.
 * Useful for displaying validation errors next to form fields.
 *
 * @param {Object} fieldErrors - Field errors object from handleApiError
 * @param {string} fieldName - Name of the field
 * @returns {string|null} Error message for the field, or null if no error
 *
 * @example
 * const fieldErrors = {
 *   email: "Email is required",
 *   password: "Password must be at least 8 characters"
 * };
 * const emailError = getFieldError(fieldErrors, "email");
 * // Returns: "Email is required"
 *
 * @example
 * const usernameError = getFieldError(fieldErrors, "username");
 * // Returns: null (no error for username)
 */
export const getFieldError = (fieldErrors, fieldName) => {
  return fieldErrors?.[fieldName] || null;
};

/**
 * Check if field has error
 *
 * Checks if a specific field has a validation error.
 * Useful for conditional styling of form fields.
 *
 * @param {Object} fieldErrors - Field errors object from handleApiError
 * @param {string} fieldName - Name of the field
 * @returns {boolean} True if field has error
 *
 * @example
 * const fieldErrors = { email: "Email is required" };
 * const hasError = hasFieldError(fieldErrors, "email");
 * // Returns: true
 *
 * @example
 * const hasError = hasFieldError(fieldErrors, "username");
 * // Returns: false
 */
export const hasFieldError = (fieldErrors, fieldName) => {
  return Boolean(fieldErrors?.[fieldName]);
};

/**
 * Format error message for display
 *
 * Formats error message with optional field errors for display in UI.
 * Combines main error message with field-specific errors.
 *
 * @param {string} message - Main error message
 * @param {Object} fieldErrors - Field errors object (optional)
 * @returns {string} Formatted error message
 *
 * @example
 * // Main message only
 * const formatted = formatErrorMessage("Validation failed");
 * // Returns: "Validation failed"
 *
 * @example
 * // With field errors
 * const formatted = formatErrorMessage("Validation failed", {
 *   email: "Email is required",
 *   password: "Password too short"
 * });
 * // Returns: "Validation failed\n• Email is required\n• Password too short"
 */
export const formatErrorMessage = (message, fieldErrors = {}) => {
  if (!message) return "";

  const fieldErrorMessages = Object.values(fieldErrors).filter(Boolean);

  if (fieldErrorMessages.length === 0) {
    return message;
  }

  return `${message}\n${fieldErrorMessages
    .map((msg) => `• ${msg}`)
    .join("\n")}`;
};

/**
 * Check if error is authentication error
 *
 * Checks if error is an authentication error (401).
 * Useful for triggering logout or redirect to login.
 *
 * @param {Object} error - RTK Query error object
 * @returns {boolean} True if authentication error
 *
 * @example
 * const error = { status: 401, data: { message: "Token expired" } };
 * const isAuthError = isAuthenticationError(error);
 * // Returns: true
 */
export const isAuthenticationError = (error) => {
  return error?.status === 401;
};

/**
 * Check if error is authorization error
 *
 * Checks if error is an authorization error (403).
 * Useful for displaying permission denied messages.
 *
 * @param {Object} error - RTK Query error object
 * @returns {boolean} True if authorization error
 *
 * @example
 * const error = { status: 403, data: { message: "Forbidden" } };
 * const isAuthzError = isAuthorizationError(error);
 * // Returns: true
 */
export const isAuthorizationError = (error) => {
  return error?.status === 403;
};

/**
 * Check if error is validation error
 *
 * Checks if error is a validation error (400 with field errors).
 * Useful for handling form validation errors.
 *
 * @param {Object} error - RTK Query error object
 * @returns {boolean} True if validation error
 *
 * @example
 * const error = {
 *   status: 400,
 *   data: {
 *     errors: [{ field: "email", message: "Invalid email" }]
 *   }
 * };
 * const isValidationErr = isValidationError(error);
 * // Returns: true
 */
export const isValidationError = (error) => {
  return (
    error?.status === 400 &&
    error?.data?.errors &&
    Array.isArray(error.data.errors) &&
    error.data.errors.length > 0
  );
};

/**
 * Check if error is network error
 *
 * Checks if error is a network error (no response from server).
 * Useful for displaying offline messages.
 *
 * @param {Object} error - RTK Query error object
 * @returns {boolean} True if network error
 *
 * @example
 * const error = { status: "FETCH_ERROR", error: "Failed to fetch" };
 * const isNetworkErr = isNetworkError(error);
 * // Returns: true
 */
export const isNetworkError = (error) => {
  return (
    error?.status === "FETCH_ERROR" ||
    error?.status === "PARSING_ERROR" ||
    error?.status === "TIMEOUT_ERROR"
  );
};

/**
 * Check if error is server error
 *
 * Checks if error is a server error (5xx status codes).
 * Useful for displaying server error messages.
 *
 * @param {Object} error - RTK Query error object
 * @returns {boolean} True if server error
 *
 * @example
 * const error = { status: 500, data: { message: "Internal server error" } };
 * const isServerErr = isServerError(error);
 * // Returns: true
 */
export const isServerError = (error) => {
  const status = error?.status;
  return typeof status === "number" && status >= 500 && status < 600;
};
