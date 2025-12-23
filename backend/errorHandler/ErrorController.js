import logger from "../utils/logger.js";

/**
 * Global Error Handler Middleware
 *
 * Handles all errors thrown in the application
 * Formats error responses consistently
 * Logs errors with appropriate severity
 * Hides internal error details in production
 *
 * Requirements: 17.1, 17.2, 17.3, 17.4, 17.5
 */

const errorHandler = (err, req, res, next) => {
  // Default to 500 if no status code set
  const statusCode = err.statusCode || 500;
  const errorCode = err.errorCode || "INTERNAL_SERVER_ERROR";

  // Log error with appropriate severity
  if (statusCode >= 500) {
    logger.error({
      message: err.message,
      errorCode,
      statusCode,
      stack: err.stack,
      context: err.context,
      path: req.path,
      method: req.method,
      ip: req.ip,
      user: req.user?._id,
    });
  } else if (statusCode >= 400) {
    logger.warn({
      message: err.message,
      errorCode,
      statusCode,
      context: err.context,
      path: req.path,
      method: req.method,
      user: req.user?._id,
    });
  }

  // Prepare error response
  const errorResponse = {
    success: false,
    statusCode,
    errorCode,
    // For 500 errors, return generic message to user without exposing internal details (Requirement 17.5)
    // For operational errors (4xx), return the actual error message
    message:
      statusCode >= 500 && process.env.NODE_ENV === "production"
        ? "An unexpected error occurred. Please try again later."
        : err.message || "An unexpected error occurred",
    context: err.context || {},
  };

  // Include stack trace only in development (Requirement 17.5)
  if (process.env.NODE_ENV === "development") {
    errorResponse.stack = err.stack;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

export default errorHandler;
