import { jest } from "@jest/globals";

const mockLogger = {
  warn: jest.fn(),
};

jest.unstable_mockModule("../../../utils/logger.js", () => ({
  default: mockLogger,
}));

describe("rateLimiter Middleware", () => {
  let originalEnv;

  beforeEach(() => {
    jest.resetModules();
    originalEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    jest.restoreAllMocks();
  });

  test("should pass through in development environment", async () => {
    process.env.NODE_ENV = "development";
    const { authRateLimiter, generalRateLimiter } = await import("../../../middlewares/rateLimiter.js");

    const req = {};
    const res = {};
    const next = jest.fn();

    authRateLimiter(req, res, next);
    expect(next).toHaveBeenCalled();

    next.mockClear();
    generalRateLimiter(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  // Testing production behavior is harder because it relies on express-rate-limit
  // which we might not want to test the internals of, but we can verify it returns a function
  test("should return rate limiter functions in production environment", async () => {
    process.env.NODE_ENV = "production";
    const { authRateLimiter, generalRateLimiter } = await import("../../../middlewares/rateLimiter.js");

    expect(typeof authRateLimiter).toBe("function");
    expect(typeof generalRateLimiter).toBe("function");
    // Since it's production, these are real middleware from express-rate-limit
    expect(authRateLimiter.name).not.toBe("next");
  });
});
