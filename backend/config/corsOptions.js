import allowedOrigins from "./allowedOrigins.js";
import logger from "../utils/logger.js";
import { CORS_CONFIG } from "../utils/constants.js";

/**
 * CORS Configuration Options
 *
 * CRITICAL: Credentials must be true for HTTP-only cookies
 * CRITICAL: Methods and headers must match frontend requirements
 * CRITICAL: Blocked origins are logged for security auditing
 */
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: CORS_CONFIG.METHODS,
  allowedHeaders: CORS_CONFIG.ALLOWED_HEADERS,
  exposedHeaders: CORS_CONFIG.EXPOSED_HEADERS,
  maxAge: CORS_CONFIG.MAX_AGE,
  optionsSuccessStatus: CORS_CONFIG.OPTIONS_SUCCESS_STATUS,
};

export default corsOptions;
