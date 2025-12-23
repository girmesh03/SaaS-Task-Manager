// CRITICAL: Force UTC timezone - MUST BE FIRST LINE
process.env.TZ = "UTC";

import "dotenv/config";
import http from "http";
import app from "./app.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { initializeSocket } from "./utils/socketInstance.js";
import setupSocketHandlers from "./utils/socket.js";
import validateEnv from "./utils/validateEnv.js";
import logger from "./utils/logger.js";
import dayjs from "dayjs";

// Verify UTC timezone
console.log("=".repeat(50));
console.log(`Server Timezone: ${process.env.TZ}`);
console.log(`Current UTC Time: ${dayjs().utc().format("YYYY-MM-DD HH:mm:ss")}`);
console.log("=".repeat(50));

// Validate environment variables
try {
  validateEnv();
} catch (error) {
  logger.error("Environment validation failed");
  process.exit(1);
}

const PORT = process.env.PORT || 4000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = initializeSocket(server);
setupSocketHandlers();

logger.info("Socket.IO initialized");

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start listening
    server.listen(PORT, () => {
      logger.info(
        `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
      );
      logger.info(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  // Close server
  server.close(async () => {
    logger.info("HTTP server closed");

    // Close database connection
    await disconnectDB();

    logger.info("Graceful shutdown complete");
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
};

// Handle process signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error(`Uncaught Exception: ${error.message}`);
  logger.error(error.stack);
  gracefulShutdown("uncaughtException");
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise);
  logger.error("Reason:", reason);
  gracefulShutdown("unhandledRejection");
});

// Start the server
startServer();
