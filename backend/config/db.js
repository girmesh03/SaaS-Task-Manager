import mongoose from "mongoose";
import logger from "../utils/logger.js";

/**
 * Connect to MongoDB with retry logic and connection pooling
 * @returns {Promise<void>}
 */
export const connectDB = async () => {
  const maxRetries = 5;
  const retryDelay = 5000; // 5 seconds

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        minPoolSize: 2,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4, // Use IPv4, skip trying IPv6
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

      // Handle process termination
      process.on("SIGINT", async () => {
        await disconnectDB();
        process.exit(0);
      });

      process.on("SIGTERM", async () => {
        await disconnectDB();
        process.exit(0);
      });

      return;
    } catch (error) {
      logger.error(
        `MongoDB connection attempt ${attempt} failed: ${error.message}`
      );

      if (attempt === maxRetries) {
        logger.error("Max retries reached. Could not connect to MongoDB.");
        logger.error(
          "Please ensure MongoDB is running and the connection string is correct."
        );
        process.exit(1);
      }

      logger.info(`Retrying in ${retryDelay / 1000} seconds...`);
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
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
