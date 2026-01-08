// ============================================================================
// Server Entry Point - Multi-Tenant SaaS Task Manager
// ============================================================================
// NOTE: app.js handles all initial setup:
//   - TZ configuration from .env (defaults to UTC if not set)
//   - Environment variable validation (validateEnv)
//   - Dayjs plugin configuration (UTC + timezone)
//   - Express app with middleware stack
//   - TTL index initialization function export
// ============================================================================

import http from "http";
import app, { ensureTTLIndexes } from "./app.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { initializeSocket } from "./utils/socketInstance.js";
import setupSocketHandlers from "./utils/socket.js";
import logger from "./utils/logger.js";
import dayjs from "dayjs";
import cleanSeedSetup from "./mock/cleanSeedSetup.js";

const PORT = process.env.PORT || 4000;

// ============================================================================
// HTTP Server Creation
// ============================================================================
const server = http.createServer(app);

// Tracking connections for aggressive shutdown
const connections = new Set();
server.on("connection", (socket) => {
  connections.add(socket);
  socket.on("close", () => connections.delete(socket));
});

// ============================================================================
// Optimized Server Initialization Flow
// ============================================================================
/**
 * Logical Order:
 * 1. Connect to MongoDB (Core requirement)
 * 2. Initialize TTL Indexes (Depends on DB)
 * 3. Initialize Socket.IO (Depends on Server object)
 * 4. Start HTTP Server Listening (Final step - accepts traffic)
 */
const startServer = async () => {
  try {
    logger.info("=".repeat(70));
    logger.info("INITIALIZATION: server.js - Startup Sequence");
    logger.info("=".repeat(70));
    logger.info(`   Port: ${PORT}`);
    logger.info(`   Environment: ${process.env.NODE_ENV}`);
    logger.info(`   Timezone: ${process.env.TZ}`);
    logger.info("   Current Time: " + dayjs().format("YYYY-MM-DD HH:mm:ss"));
    logger.info("=".repeat(70));

    // ========================================================================
    // PHASE 1: Database & Persistence
    // ========================================================================
    logger.info("");
    logger.info("1. DATABASE: Initiating Connection...");
    await connectDB();
    logger.info("✓ DATABASE: Connected successfully");

    // ========================================================================
    // PHASE 2: Schema & Maintenance
    // ========================================================================
    logger.info("");
    logger.info("2. TTL INDEXES: Synchronizing...");
    await ensureTTLIndexes();
    logger.info("✓ TTL INDEXES: Initialization complete");

    // ========================================================================
    // PHASE 2.5: Seed Data (Conditional)
    // ========================================================================
    if (process.env.INITIALIZE_SEED_DATA === "true") {
      logger.info("");
      logger.info("2.5. SEED DATA: Initializing...");
      logger.warn("⚠️  INITIALIZE_SEED_DATA=true - This will WIPE all data!");
      await cleanSeedSetup();
      logger.info("✓ SEED DATA: Database seeded successfully");
    }

    // ========================================================================
    // PHASE 3: Communications (Socket.io)
    // ========================================================================
    logger.info("");
    logger.info("3. SOCKET.IO: Configuring Handlers...");
    initializeSocket(server);
    setupSocketHandlers();
    logger.info("✓ SOCKET.IO: Initialized and configured");

    // ========================================================================
    // PHASE 4: Network (HTTP Listener)
    // ========================================================================
    logger.info("");
    logger.info("4. HTTP SERVER: Starting Listener...");

    let bindAttempts = 0;
    const MAX_BIND_ATTEMPTS = 3;
    const BIND_RETRY_DELAY = 1000;

    const startListening = async () => {
      return new Promise((resolve, reject) => {
        const startupErrorHandler = async (err) => {
          if (err.code === "EADDRINUSE") {
            bindAttempts++;
            if (bindAttempts < MAX_BIND_ATTEMPTS) {
              logger.warn(
                `Port ${PORT} is busy (Attempt ${bindAttempts}/${MAX_BIND_ATTEMPTS}). Retrying in ${BIND_RETRY_DELAY}ms...`
              );
              server.close(); // Ensure handles are cleaned up before retry
              setTimeout(async () => {
                try {
                  await startListening();
                  resolve();
                } catch (retryErr) {
                  reject(retryErr);
                }
              }, BIND_RETRY_DELAY);
              return;
            }

            logger.error("=".repeat(70));
            logger.error("❌ PORT ALREADY IN USE");
            logger.error("=".repeat(70));
            logger.error(
              `   Port ${PORT} is still busy after ${MAX_BIND_ATTEMPTS} attempts.`
            );
            logger.error("");
            logger.error("   To fix this issue (Windows):");
            logger.error(`   1. Find PID:  netstat -ano | findstr :${PORT}`);
            logger.error("   2. Kill it:   taskkill //PID <PID> //F");
            logger.error("");
            logger.error("   Or simply restart your development environment.");
            logger.error("=".repeat(70));
          }
          reject(err);
        };

        server.once("error", startupErrorHandler);

        server.listen(PORT, () => {
          server.removeListener("error", startupErrorHandler);
          resolve();
        });
      });
    };

    await startListening();

    logger.info("=".repeat(70));
    logger.info("🚀 SERVER STARTUP: SUCCESSFUL");
    logger.info("=".repeat(70));
    logger.info(`   Status: RUNNING`);
    logger.info(`   URL: http://localhost:${PORT}`);
    logger.info(`   Health: http://localhost:${PORT}/health`);
    logger.info("=".repeat(70));
    logger.info("");
  } catch (error) {
    logger.error("=".repeat(70));
    logger.error("❌ FATAL ERROR: Server initialization failed!");
    logger.error("=".repeat(70));
    logger.error(`   Message: ${error.message}`);
    logger.error(`   Stack: ${error.stack}`);
    logger.error("=".repeat(70));

    // Exit with code 1 for startup failure
    await gracefulShutdown("STARTUP_ERROR", 1);
  }
};

// ============================================================================
// Enhanced Graceful Shutdown Handler
// ============================================================================
/**
 * @param {string} signal - The signal or event that triggered shutdown
 * @param {number} exitCode - The process exit code (0 for success, 1 for error)
 */
const gracefulShutdown = async (signal, exitCode = 0) => {
  logger.info("");
  logger.info("=".repeat(70));
  logger.info(`SHUTDOWN: ${signal} sequence started...`);
  logger.info("=".repeat(70));

  // 1. Close Socket.IO (to disconnect clients and stop engine)
  try {
    const { getIO } = await import("./utils/socketInstance.js");
    const io = getIO();
    if (io) {
      await new Promise((resolve) => {
        io.close(() => {
          logger.info("✓ Socket.IO: CLOSED");
          resolve();
        });
      });
    }
  } catch (error) {
    // Socket.io likely not initialized or threw during getIO, ignore
  }

  // 2. Close HTTP Server (Stop accepting new connections)
  if (server.listening) {
    // Aggressively destroy existing connections to release port immediately
    if (connections.size > 0) {
      logger.info(`✓ Closing ${connections.size} active connections...`);
      for (const socket of connections) {
        socket.destroy();
      }
      connections.clear();
    }

    await new Promise((resolve) => {
      server.close(() => {
        logger.info("✓ HTTP Server: CLOSED");
        resolve();
      });
    });
  }

  // 2. Disconnect from Database
  try {
    await disconnectDB();
    logger.info("✓ Database: DISCONNECTED");
  } catch (error) {
    logger.error(`✗ Database disconnect failed: ${error.message}`);
  }

  logger.info("=".repeat(70));
  logger.info(`SHUTDOWN: COMPLETE (Exit Code: ${exitCode})`);
  logger.info("=".repeat(70));

  // Flush logs and exit
  process.exit(exitCode);
};

// ============================================================================
// Process Event Handlers
// ============================================================================

// OS Signals - Successful terminations
process.on("SIGTERM", () => gracefulShutdown("SIGTERM", 0));
process.on("SIGINT", () => gracefulShutdown("SIGINT", 0));

// Nodemon signal
process.once("SIGUSR2", () => gracefulShutdown("SIGUSR2", 0));

// Internal Errors - Fatal terminations
process.on("uncaughtException", (error) => {
  logger.error("=".repeat(70));
  logger.error("❌ UNCAUGHT EXCEPTION");
  logger.error("=".repeat(70));
  logger.error(error.stack || error.message);
  gracefulShutdown("uncaughtException", 1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("=".repeat(70));
  logger.error("❌ UNHANDLED PROMISE REJECTION");
  logger.error("=".repeat(70));
  logger.error(`Reason: ${reason}`);
  gracefulShutdown("unhandledRejection", 1);
});

// Start the initialization
startServer();
