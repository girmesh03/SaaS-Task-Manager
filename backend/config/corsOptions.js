import allowedOrigins from "./allowedOrigins.js";
import logger from "../utils/logger.js";

/**
 * CORS Configuration with Origin Validation
 *
 * Validates request origin against allowed origins list
 * Enables credentials for HTTP-only cookies
 * Configures allowed methods, headers, and exposed headers
 */

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // Enable HTTP-only cookies
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: [
    "X-Request-ID",
    "X-RateLimit-Limit",
    "X-RateLimit-Remaining",
    "X-RateLimit-Reset",
  ],
  maxAge: 86400, // 24 hours - how long browser can cache preflight response
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
};

export default corsOptions;
