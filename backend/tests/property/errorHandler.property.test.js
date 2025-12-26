import { jest } from "@jest/globals";
import fc from "fast-check";

const mockLogger = {
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

jest.unstable_mockModule("../../utils/logger.js", () => ({
  default: mockLogger,
}));

const { default: CustomError } = await import("../../errorHandler/CustomError.js");
const { default: errorHandler } = await import("../../errorHandler/ErrorController.js");
const { default: logger } = await import("../../utils/logger.js");

describe("Property Tests: Error Handling", () => {
  // Clear mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = "development";
  });

  test("Property 4: CustomError Creation - For any error message and context object, static methods should create valid error", () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.object(),
        (message, context) => {
          const methods = [
            { name: 'validation', code: 'VALIDATION_ERROR', status: 400 },
            { name: 'authentication', code:  'AUTHENTICATION_ERROR', status: 401 },
            { name: 'authorization', code: 'AUTHORIZATION_ERROR', status: 403 },
            { name: 'notFound', code: 'NOT_FOUND_ERROR', status: 404 },
            { name: 'conflict', code: 'CONFLICT_ERROR', status: 409 },
            { name: 'internal', code: 'INTERNAL_SERVER_ERROR', status: 500 },
          ];

          methods.forEach(({ name, code, status }) => {
            const error = CustomError[name](message, context);

            expect(error).toBeInstanceOf(CustomError);
            expect(error.message).toBe(message);
            expect(error.statusCode).toBe(status);
            expect(error.errorCode).toBe(code);
            expect(error.context).toEqual(context);
            expect(error.isOperational).toBe(true);
            expect(error.stack).toBeDefined();
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 5: Error Controller Handling - For any CustomError, ErrorController should return correct response", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.constantFrom(
          { status: 400, code: 'VALIDATION_ERROR' },
          { status: 401, code: 'AUTHENTICATION_ERROR' },
          { status: 403, code: 'AUTHORIZATION_ERROR' },
          { status: 404, code: 'NOT_FOUND_ERROR' },
          { status: 409, code: 'CONFLICT_ERROR' },
          { status: 500, code: 'INTERNAL_SERVER_ERROR' }
        ),
        fc.object(),
        (message, { status: statusCode, code: errorCode }, context) => {
          const error = new CustomError(message, statusCode, errorCode, context);

          const req = {
            path: "/test",
            method: "GET",
            ip: "127.0.0.1",
            user: { _id: "user123" }
          };

          const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
          };

          const next = jest.fn();

          errorHandler(error, req, res, next);

          expect(res.status).toHaveBeenCalledWith(statusCode);
          expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            statusCode,
            errorCode,
            message,
            context
          }));
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Add Test Tags for verification
/**
 * **Feature: saas-task-manager-mvp, Property 4: CustomError Creation**
 * **Validates: Requirements 17.1, 17.2**
 *
 * **Feature: saas-task-manager-mvp, Property 5: Error Controller Handling**
 * **Validates: Requirements 17.3, 17.4**
 */
