import CustomError from "../../../errorHandler/CustomError.js";

describe("CustomError Utility", () => {
  describe("Static Helper Methods", () => {
    test("validation() should create error with statusCode 400 and code VALIDATION_ERROR", () => {
      const error = CustomError.validation("Validation failed", { field: "email" });

      expect(error).toBeInstanceOf(CustomError);
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe("Validation failed");
      expect(error.statusCode).toBe(400);
      expect(error.errorCode).toBe("VALIDATION_ERROR");
      expect(error.context).toEqual({ field: "email" });
      expect(error.isOperational).toBe(true);
    });

    test("authentication() should create error with statusCode 401 and code AUTHENTICATION_ERROR", () => {
      const error = CustomError.authentication("Invalid credentials");

      expect(error.message).toBe("Invalid credentials");
      expect(error.statusCode).toBe(401);
      expect(error.errorCode).toBe("AUTHENTICATION_ERROR");
      expect(error.isOperational).toBe(true);
    });

    test("authorization() should create error with statusCode 403 and code AUTHORIZATION_ERROR", () => {
      const error = CustomError.authorization("Access denied");

      expect(error.message).toBe("Access denied");
      expect(error.statusCode).toBe(403);
      expect(error.errorCode).toBe("AUTHORIZATION_ERROR");
    });

    test("notFound() should create error with statusCode 404 and code NOT_FOUND_ERROR", () => {
      const error = CustomError.notFound("Resource not found");

      expect(error.message).toBe("Resource not found");
      expect(error.statusCode).toBe(404);
      expect(error.errorCode).toBe("NOT_FOUND_ERROR");
    });

    test("conflict() should create error with statusCode 409 and code CONFLICT_ERROR", () => {
      const error = CustomError.conflict("Resource exists");

      expect(error.message).toBe("Resource exists");
      expect(error.statusCode).toBe(409);
      expect(error.errorCode).toBe("CONFLICT_ERROR");
    });

    test("internal() should create error with statusCode 500 and code INTERNAL_SERVER_ERROR", () => {
      const error = CustomError.internal("Something went wrong");

      expect(error.message).toBe("Something went wrong");
      expect(error.statusCode).toBe(500);
      expect(error.errorCode).toBe("INTERNAL_SERVER_ERROR");
    });
  });

  describe("Constructor and Defaults", () => {
    test("should set default context to empty object if not provided", () => {
      const error = CustomError.validation("Error");
      expect(error.context).toEqual({});
    });

    test("should capture stack trace", () => {
      const error = CustomError.internal("Error");
      expect(error.stack).toBeDefined();
    });
  });
});
