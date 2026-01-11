// ============================================================================
// CRITICAL: Timezone and Environment Setup - MUST BE FIRST
// ============================================================================
// Load environment variables FIRST before any other operations
// Only load if not already loaded (e.g., by nodemon or other tools)
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file only if NODE_ENV is not already set (prevents double loading)
if (!process.env.NODE_ENV) {
  dotenv.config({ path: join(__dirname, ".env") });
}

// Set timezone from .env or default to UTC
// This MUST happen before any Date operations or dayjs usage
if (!process.env.TZ) {
  process.env.TZ = "UTC"; // Default to UTC if not specified in .env
}

console.log("=".repeat(70));
console.log("INITIALIZATION: app.js - Core Application Setup");
console.log("=".repeat(70));
console.log(`1. Timezone Configuration: ${process.env.TZ}`);

// ============================================================================
// Environment Validation - MUST happen before Express setup
// ============================================================================
import validateEnv from "./utils/validateEnv.js";
import logger from "./utils/logger.js";

try {
  validateEnv();
  logger.info("2. Environment Validation: PASSED ✓");
} catch (error) {
  logger.error("❌ CRITICAL: Environment validation failed!");
  logger.error(`   Error: ${error.message}`);
  logger.error("   Server cannot start. Please check your .env file.");
  process.exit(1);
}

// ============================================================================
// Dayjs Configuration with Timezone Support
// ============================================================================
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

// Verify timezone setup
const currentTime = dayjs().format("YYYY-MM-DD HH:mm:ss");
const currentUTC = dayjs().utc().format("YYYY-MM-DD HH:mm:ss");
logger.info(`3. Dayjs Configuration: LOADED ✓`);
logger.info(`   Current Time (${process.env.TZ}): ${currentTime}`);
logger.info(`   Current Time (UTC): ${currentUTC}`);

// ============================================================================
// Express Application Setup
// ============================================================================
import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
import compression from "compression";
import morgan from "morgan";
import corsOptions from "./config/corsOptions.js";
import errorHandler from "./errorHandler/ErrorController.js";
import { generalRateLimiter } from "./middlewares/rateLimiter.js";
import routes from "./routes/index.js";

const app = express();

logger.info("4. Express App: INITIALIZED ✓");

// ============================================================================
// HTTP Request Logging (Development Only)
// ============================================================================
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
  logger.info("4.1. Morgan HTTP Logger: ENABLED (Development Mode) ✓");
}

// ============================================================================
// Security Middleware Stack (MUST be in this specific order)
// ============================================================================
app.use(helmet()); // Security headers
app.use(express.json({ limit: "10mb" })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: "10mb" })); // Parse URL-encoded bodies
app.use(cookieParser()); // Parse cookies
app.use(cors(corsOptions)); // CORS with validation
app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(compression()); // Compress responses

logger.info("5. Security Middleware: LOADED ✓");

// ============================================================================
// Rate Limiting (Production Only)
// ============================================================================
if (process.env.NODE_ENV === "production") {
  app.use(generalRateLimiter);
  logger.info("6. Rate Limiter: ENABLED (Production Mode) ✓");
} else {
  logger.info("6. Rate Limiter: DISABLED (Development Mode)");
}
// ============================================================================
// Health Check Endpoint
// ============================================================================
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: dayjs().utc().toISOString(),
    timezone: process.env.TZ,
    environment: process.env.NODE_ENV,
  });
});

// ============================================================================
// API Routes
// ============================================================================
app.use("/api", routes);
logger.info("7. API Routes: MOUNTED ✓");

// ============================================================================
// Error Handling Middleware (MUST be last)
// ============================================================================
app.use(errorHandler);
logger.info("8. Error Handler: REGISTERED ✓");

// ============================================================================
// TTL Index Initialization Function
// ============================================================================
/**
 * Initialize TTL indexes for all models
 * MUST be called AFTER database connection is established
 * TTL Configuration per docs/softDelete-doc.md:
 * - Organizations: Never (null)
 * - Departments: 365 days
 * - Users: 365 days
 * - Tasks (all types): 180 days
 * - TaskActivity: 90 days
 * - TaskComment: 90 days
 * - Materials: 180 days
 * - Vendors: 180 days
 * - Attachments: 90 days
 * - Notifications: 30 days
 */
export const ensureTTLIndexes = async () => {
  try {
    logger.info("=".repeat(70));
    logger.info("TTL INDEX CREATION: Starting...");
    logger.info("=".repeat(70));

    // Import all models
    const Organization = (await import("./models/Organization.js")).default;
    const Department = (await import("./models/Department.js")).default;
    const User = (await import("./models/User.js")).default;
    const BaseTask = (await import("./models/BaseTask.js")).default;
    const TaskActivity = (await import("./models/TaskActivity.js")).default;
    const TaskComment = (await import("./models/TaskComment.js")).default;
    const Material = (await import("./models/Material.js")).default;
    const Vendor = (await import("./models/Vendor.js")).default;
    const Attachment = (await import("./models/Attachment.js")).default;
    const Notification = (await import("./models/Notification.js")).default;

    // Create TTL indexes with specified expiration times
    await Organization.ensureTTLIndex(null); // Never expires
    logger.info("  ✓ Organization: TTL=Never (null)");

    await Department.ensureTTLIndex(365 * 24 * 60 * 60); // 365 days
    logger.info("  ✓ Department: TTL=365 days");

    await User.ensureTTLIndex(365 * 24 * 60 * 60); // 365 days
    logger.info("  ✓ User: TTL=365 days");

    await BaseTask.ensureTTLIndex(180 * 24 * 60 * 60); // 180 days
    logger.info("  ✓ BaseTask (All Task Types): TTL=180 days");

    await TaskActivity.ensureTTLIndex(90 * 24 * 60 * 60); // 90 days
    logger.info("  ✓ TaskActivity: TTL=90 days");

    await TaskComment.ensureTTLIndex(90 * 24 * 60 * 60); // 90 days
    logger.info("  ✓ TaskComment: TTL=90 days");

    await Material.ensureTTLIndex(180 * 24 * 60 * 60); // 180 days
    logger.info("  ✓ Material: TTL=180 days");

    await Vendor.ensureTTLIndex(180 * 24 * 60 * 60); // 180 days
    logger.info("  ✓ Vendor: TTL=180 days");

    await Attachment.ensureTTLIndex(90 * 24 * 60 * 60); // 90 days
    logger.info("  ✓ Attachment: TTL=90 days");

    await Notification.ensureTTLIndex(30 * 24 * 60 * 60); // 30 days
    logger.info("  ✓ Notification: TTL=30 days");

    logger.info("=".repeat(70));
    logger.info("TTL INDEX CREATION: COMPLETED ✓");
    logger.info("=".repeat(70));
  } catch (error) {
    logger.error("❌ CRITICAL: TTL Index creation failed!");
    logger.error(`   Error: ${error.message}`);
    throw error;
  }
};

logger.info("=".repeat(70));
logger.info("app.js INITIALIZATION: COMPLETE ✓");
logger.info("=".repeat(70));
logger.info("");

export default app;
