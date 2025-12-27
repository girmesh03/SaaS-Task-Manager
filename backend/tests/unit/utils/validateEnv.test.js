import { jest } from "@jest/globals";
import logger from "../../../utils/logger.js";
import { validateEnv } from "../../../utils/validateEnv.js";

describe("validateEnv", () => {
  let originalEnv;

  beforeEach(() => {
    jest.clearAllMocks();
    originalEnv = { ...process.env };

    // Spy on logger methods
    jest.spyOn(logger, "error").mockImplementation(() => {});
    jest.spyOn(logger, "warn").mockImplementation(() => {});
    jest.spyOn(logger, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore process.env
    Object.keys(process.env).forEach(key => {
      delete process.env[key];
    });
    Object.assign(process.env, originalEnv);
    jest.restoreAllMocks();
  });

  const setEnv = (envs) => {
    // Clear current env and set new ones
    Object.keys(process.env).forEach(key => {
      delete process.env[key];
    });
    Object.assign(process.env, envs);
  };

  test("should pass validation with all required variables", () => {
    setEnv({
      NODE_ENV: "test",
      PORT: "4000",
      MONGODB_URI: "mongodb://localhost:27017/test",
      JWT_ACCESS_SECRET: "12345678901234567890123456789012", // 32 chars
      JWT_REFRESH_SECRET: "12345678901234567890123456789012", // 32 chars
      EMAIL_USER: "user",
      EMAIL_PASSWORD: "password",
      CLIENT_URL: "http://localhost:3000",
      // Optional vars to avoid warnings
      MONGODB_URI_TEST: "uri",
      JWT_ACCESS_EXPIRES_IN: "1h",
      JWT_REFRESH_EXPIRES_IN: "7d",
      ALLOWED_ORIGINS: "*",
      CLOUDINARY_CLOUD_NAME: "name",
      CLOUDINARY_API_KEY: "key",
      CLOUDINARY_API_SECRET: "secret",
      RATE_LIMIT_WINDOW_MS: "1000",
      RATE_LIMIT_MAX_REQUESTS: "10",
      RATE_LIMIT_AUTH_MAX_REQUESTS: "5"
    });

    validateEnv();

    expect(logger.error).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith("Environment variables validated successfully");
  });

  test("should throw error if required variable is missing", () => {
    setEnv({
      NODE_ENV: "test",
      // PORT missing
      MONGODB_URI: "uri",
      JWT_ACCESS_SECRET: "s".repeat(32),
      JWT_REFRESH_SECRET: "s".repeat(32),
      EMAIL_USER: "u",
      EMAIL_PASSWORD: "p",
      CLIENT_URL: "u"
    });

    expect(() => validateEnv()).toThrow("Missing required environment variables");
    expect(logger.error).toHaveBeenCalled();
  });

  test("should warn if optional variable is missing", () => {
    setEnv({
      NODE_ENV: "test",
      PORT: "4000",
      MONGODB_URI: "uri",
      JWT_ACCESS_SECRET: "s".repeat(32),
      JWT_REFRESH_SECRET: "s".repeat(32),
      EMAIL_USER: "u",
      EMAIL_PASSWORD: "p",
      CLIENT_URL: "u",
      // Missing some optional vars
    });

    validateEnv();

    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("Missing optional environment variables"));
  });

  test("should warn if JWT secrets are too short", () => {
    setEnv({
      NODE_ENV: "test",
      PORT: "4000",
      MONGODB_URI: "uri",
      JWT_ACCESS_SECRET: "short",
      JWT_REFRESH_SECRET: "short",
      EMAIL_USER: "u",
      EMAIL_PASSWORD: "p",
      CLIENT_URL: "u",
      // Add optional vars to avoid that warning
      MONGODB_URI_TEST: "uri",
      JWT_ACCESS_EXPIRES_IN: "1h",
      JWT_REFRESH_EXPIRES_IN: "7d",
      ALLOWED_ORIGINS: "*",
      CLOUDINARY_CLOUD_NAME: "name",
      CLOUDINARY_API_KEY: "key",
      CLOUDINARY_API_SECRET: "secret",
      RATE_LIMIT_WINDOW_MS: "1000",
      RATE_LIMIT_MAX_REQUESTS: "10",
      RATE_LIMIT_AUTH_MAX_REQUESTS: "5"
    });

    validateEnv();

    expect(logger.warn).toHaveBeenCalledWith("JWT_ACCESS_SECRET should be at least 32 characters long");
    expect(logger.warn).toHaveBeenCalledWith("JWT_REFRESH_SECRET should be at least 32 characters long");
  });
});
