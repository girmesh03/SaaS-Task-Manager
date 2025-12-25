/**
 * Jest Configuration for ES Modules and MongoDB
 *
 * CRITICAL: This configuration is for ES modules with real MongoDB (NOT mongodb-memory-server)
 * Test timeout: 960 seconds (16 minutes) to handle long-running property-based tests
 */

export default {
  // No transformation for ES modules
  transform: {},

  // Node environment for backend testing
  testEnvironment: "node",

  // Test file patterns
  testMatch: ["**/__tests__/**/*.test.js", "**/?(*.)+(spec|test).js"],

  // Coverage collection
  collectCoverageFrom: [
    "**/*.js",
    "!**/node_modules/**",
    "!**/tests/**",
    "!**/coverage/**",
    "!jest.config.js",
    "!server.js",
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80,
    },
  },

  // Test timeout: 960 seconds (16 minutes)
  testTimeout: 960000,

  // Setup files
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],

  // Global teardown
  globalTeardown: "<rootDir>/tests/teardown.js",

  // Run tests serially to avoid database conflicts
  maxWorkers: 1,

  // Detect open handles
  detectOpenHandles: true,

  // Force exit after tests complete
  forceExit: true,

  // Verbose output
  verbose: true,
};
