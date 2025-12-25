/**
 * Jest Global Teardown
 *
 * Runs once after all test suites complete
 * Ensures clean shutdown of database connections
 */

import mongoose from "mongoose";

export default async function globalTeardown() {
  try {
    // Close all mongoose connections
    await mongoose.disconnect();

    console.log("✅ Global teardown: All database connections closed");
  } catch (error) {
    console.error("❌ Global teardown failed:", error);
    throw error;
  }
}
