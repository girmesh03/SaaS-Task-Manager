import { jest } from "@jest/globals";

const mockLogger = {
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

jest.unstable_mockModule("../../../utils/logger.js", () => ({
  default: mockLogger,
}));

const { default: errorHandler } = await import("../../../errorHandler/ErrorController.js");
const { default: CustomError } = await import("../../../errorHandler/CustomError.js");
const { default: logger } = await import("../../../utils/logger.js");

describe("ErrorController Middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      path: "/test",
      method: "GET",
      ip: "127.0.0.1",
      user: { _id: "user123" },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
    process.env.NODE_ENV = "development";
  });

  test("should handle CustomError correctly", () => {
    const error = CustomError.validation("Validation failed", { field: "email" });

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      statusCode: 400,
      errorCode: "VALIDATION_ERROR",
      message: "Validation failed",
      context: { field: "email" },
      stack: expect.any(String),
    });

    expect(logger.warn).toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  test("should handle operational error (4xx) logging as warning", () => {
    const error = CustomError.notFound("Not found");

    errorHandler(error, req, res, next);

    expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({
      message: "Not found",
      statusCode: 404,
      path: "/test",
    }));
  });

  test("should handle server error (5xx) logging as error", () => {
    const error = CustomError.internal("Server crash");

    errorHandler(error, req, res, next);

    expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({
      message: "Server crash",
      statusCode: 500,
      path: "/test",
    }));
  });

  test("should handle non-CustomError (unexpected errors) as 500", () => {
    const error = new Error("Unexpected crash");

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      statusCode: 500,
      errorCode: "INTERNAL_SERVER_ERROR",
      message: "Unexpected crash",
    }));

    expect(logger.error).toHaveBeenCalled();
  });

  test("should hide error details in production", () => {
    process.env.NODE_ENV = "production";
    const error = new Error("Sensitive info");

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      statusCode: 500,
      errorCode: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred. Please try again later.",
      context: {},
    });

    expect(res.json).not.toHaveBeenCalledWith(expect.objectContaining({
      stack: expect.any(String),
    }));
  });

  test("should show error message for operational errors even in production", () => {
    process.env.NODE_ENV = "production";
    const error = CustomError.validation("Invalid input");

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: "Invalid input",
    }));
  });
});
