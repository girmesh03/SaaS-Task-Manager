import logger from "./logger.js";

/**
 * Environment Variable Validation
 *
 * Validates that all required environment variables are set
 * Exits process if critical variables are missing
 */

const requiredEnvVars = [
  "NODE_ENV",
  "PORT",
  "MONGODB_URI",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "EMAIL_USER",
  "EMAIL_PASSWORD",
  "EMAIL_FROM",
  "CLIENT_URL",
];

const optionalEnvVars = [
  "MONGODB_URI_TEST",
  "JWT_ACCESS_EXPIRES_IN",
  "JWT_REFRESH_EXPIRES_IN",
  "ALLOWED_ORIGINS",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "RATE_LIMIT_WINDOW_MS",
  "RATE_LIMIT_MAX_REQUESTS",
  "RATE_LIMIT_AUTH_MAX_REQUESTS",
];

/**
 * Validate environment variables
 * @throws {Error} If required variables are missing
 */
export const validateEnv = () => {
  const missing = [];

  // Check required variables
  requiredEnvVars.forEach((varName) => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  if (missing.length > 0) {
    logger.error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }

  // Warn about missing optional variables
  const missingOptional = [];
  optionalEnvVars.forEach((varName) => {
    if (!process.env[varName]) {
      missingOptional.push(varName);
    }
  });

  if (missingOptional.length > 0) {
    logger.warn(
      `Missing optional environment variables: ${missingOptional.join(", ")}`
    );
  }

  // Validate JWT secrets length (minimum 32 characters)
  if (process.env.JWT_ACCESS_SECRET.length < 32) {
    logger.warn("JWT_ACCESS_SECRET should be at least 32 characters long");
  }

  if (process.env.JWT_REFRESH_SECRET.length < 32) {
    logger.warn("JWT_REFRESH_SECRET should be at least 32 characters long");
  }

  logger.info("Environment variables validated successfully");
};

export default validateEnv;
