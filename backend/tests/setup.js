/**
 * Jest Setup File
 *
 * CRITICAL: Uses real MongoDB instance (NOT mongodb-memory-server)
 * Runs before each test suite to ensure clean database state
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Set timezone to UTC for consistency
process.env.TZ = "UTC";

// MongoDB test database URI
const MONGODB_URI_TEST =
  process.env.MONGODB_URI_TEST || "mongodb://localhost:27017/task-manager-test";

/**
 * Connect to test database before all tests
 */
beforeAll(async () => {
  try {
    // Close any existing connections
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }

    // Connect to test database
    await mongoose.connect(MONGODB_URI_TEST, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    // Suppress connection log in test output
    // console.log("✅ Connected to test database:", MONGODB_URI_TEST);
  } catch (error) {
    console.error("❌ Failed to connect to test database:", error);
    throw error;
  }
});

/**
 * Clear all collections before each test
 */
beforeEach(async () => {
  try {
    const collections = await mongoose.connection.db.collections();

    for (const collection of collections) {
      await collection.deleteMany({});
    }

    // Suppress clearing log in test output
    // console.log("🧹 Cleared all collections");
  } catch (error) {
    console.error("❌ Failed to clear collections:", error);
    throw error;
  }
});

/**
 * Close database connection after all tests
 */
afterAll(async () => {
  try {
    await mongoose.connection.close();
    // Suppress closing log in test output
    // console.log("✅ Closed test database connection");
  } catch (error) {
    console.error("❌ Failed to close test database connection:", error);
    throw error;
  }
});
