import logger from "../utils/logger.js";
import CustomError from "./CustomError.js";

/**
 * Global Error Handler Middleware
 *
 * Handles all errors thrown in the application
 * Formats error responses consistently
 * Logs errors with appropriate severity
 * Hides internal error details in production
 *
 * Handles: CustomError, ValidationError, CastError, MongoError, JWT errors
 */

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;
  error.name = err.name;
  error.code = err.code;

  // 1. Mongoose Validation Error
  if (error.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((el) => el.message)
      .join(", ");
    error = CustomError.validation(`Validation failed: ${message}`, err.errors);
  }

  // 2. Mongoose Cast Error (e.g., invalid ObjectId)
  if (error.name === "CastError") {
    error = CustomError.validation(`Invalid ${err.path}: ${err.value}`);
  }

  // 3. Mongo Duplicate Key Error
  if (error.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    const value = err.keyValue ? err.keyValue[field] : "unknown";
    error = CustomError.conflict(
      `Duplicate value for ${field}: ${value}. Please use another value.`,
      err.keyValue
    );
  }

  // 4. JWT Errors
  if (error.name === "JsonWebTokenError") {
    error = CustomError.authentication("Invalid token. Please log in again.");
  }
  if (error.name === "TokenExpiredError") {
    error = CustomError.authentication(
      "Your token has expired. Please log in again."
    );
  }

  const statusCode = error.statusCode || 500;
  const errorCode = error.errorCode || "INTERNAL_SERVER_ERROR";

  // Log error with appropriate severity
  if (statusCode >= 500) {
    logger.error({
      message: error.message,
      errorCode,
      statusCode,
      stack: error.stack,
      details: error.details,
      path: req.path,
      method: req.method,
      ip: req.ip,
      user: req.user?._id,
    });
  } else {
    logger.warn({
      message: error.message,
      errorCode,
      statusCode,
      details: error.details,
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
    // For 500 errors in production, return generic message
    message:
      statusCode >= 500 && process.env.NODE_ENV === "production"
        ? "An unexpected error occurred. Please try again later."
        : error.message || "An unexpected error occurred",
    details: error.details || {},
  };

  // Include stack trace only in development
  if (process.env.NODE_ENV === "development") {
    errorResponse.stack = error.stack;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

export default errorHandler;
