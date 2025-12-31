import mongoose from "mongoose";
import logger from "../utils/logger.js";
import { DATABASE_CONFIG } from "../utils/constants.js";

/**
 * Connect to MongoDB with retry logic and connection pooling
 * @returns {Promise<void>}
 */
export const connectDB = async () => {
  for (
    let attempt = 1;
    attempt <= DATABASE_CONFIG.MAX_RETRIES;
    attempt++
  ) {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        minPoolSize: DATABASE_CONFIG.MIN_POOL_SIZE,
        maxPoolSize: DATABASE_CONFIG.MAX_POOL_SIZE,
        serverSelectionTimeoutMS: DATABASE_CONFIG.SERVER_SELECTION_TIMEOUT_MS,
        socketTimeoutMS: DATABASE_CONFIG.SOCKET_TIMEOUT_MS,
        family: DATABASE_CONFIG.FAMILY,
      });

      logger.info(`MongoDB Connected: ${conn.connection.host}`);
      logger.info(`Database: ${conn.connection.name}`);
      logger.info(
        `Connection Pool: min=${conn.connection.minPoolSize}, max=${conn.connection.maxPoolSize}`
      );

      // Connection event handlers
      mongoose.connection.on("error", (err) => {
        logger.error(`MongoDB connection error: ${err.message}`);
      });

      mongoose.connection.on("disconnected", () => {
        logger.warn("MongoDB disconnected. Attempting to reconnect...");
      });

      mongoose.connection.on("reconnected", () => {
        logger.info("MongoDB reconnected successfully");
      });

      mongoose.connection.on("close", () => {
        logger.info("MongoDB connection closed");
      });

      return;
    } catch (error) {
      logger.error(
        `MongoDB connection attempt ${attempt} failed: ${error.message}`
      );

      if (attempt === DATABASE_CONFIG.MAX_RETRIES) {
        logger.error("Max retries reached. Could not connect to MongoDB.");
        logger.error(
          "Please ensure MongoDB is running and the connection string is correct."
        );
        process.exit(1);
      }

      logger.info(`Retrying in ${DATABASE_CONFIG.RETRY_DELAY / 1000} seconds...`);
      await new Promise((resolve) =>
        setTimeout(resolve, DATABASE_CONFIG.RETRY_DELAY)
      );
    }
  }
};

/**
 * Gracefully close MongoDB connection
 * @returns {Promise<void>}
 */
export const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    logger.info("MongoDB connection closed gracefully");
  } catch (error) {
    logger.error(`Error closing MongoDB connection: ${error.message}`);
    throw error;
  }
};

/**
 * Check MongoDB connection status
 * @returns {boolean} True if connected
 */
export const isConnected = () => {
  return mongoose.connection.readyState === 1;
};

/**
 * Get MongoDB connection state
 * @returns {string} Connection state
 */
export const getConnectionState = () => {
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };
  return states[mongoose.connection.readyState] || "unknown";
};
