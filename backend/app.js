// CRITICAL: Force UTC timezone - MUST BE FIRST LINE
process.env.TZ = "UTC";

import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
import compression from "compression";
import corsOptions from "./config/corsOptions.js";
import errorHandler from "./errorHandler/ErrorController.js";
import { generalRateLimiter } from "./middlewares/rateLimiter.js";
import logger from "./utils/logger.js";

// Initialize dayjs with UTC plugin
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

// Verify UTC timezone
logger.info(`Server timezone: ${process.env.TZ}`);
logger.info(`Current UTC time: ${dayjs().utc().format()}`);

const app = express();

// Security middleware (MUST be in this order)
app.use(helmet()); // Security headers
app.use(cors(corsOptions)); // CORS with validation
app.use(cookieParser()); // Parse cookies
app.use(express.json({ limit: "10mb" })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: "10mb" })); // Parse URL-encoded bodies
app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(compression()); // Compress responses

// Rate limiting (production only)
if (process.env.NODE_ENV === "production") {
  app.use(generalRateLimiter);
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: dayjs().utc().toISOString(),
    timezone: process.env.TZ,
  });
});

// API routes will be added here
// app.use('/api', routes);

// Error handling middleware (MUST be last)
app.use(errorHandler);

export default app;
