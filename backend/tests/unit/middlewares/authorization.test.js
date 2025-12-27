import { jest } from "@jest/globals";

const mockLogger = {
  warn: jest.fn(),
  info: jest.fn(),
};

const mockAuthMatrix = {
  checkPermission: jest.fn(),
  canAccessResource: jest.fn(),
};

jest.unstable_mockModule("../../../utils/logger.js", () => ({
  default: mockLogger,
}));

jest.unstable_mockModule("../../../utils/authorizationMatrix.js", () => mockAuthMatrix);

const { authorize, checkResourceAccess } = await import("../../../middlewares/authorization.js");
const { default: CustomError } = await import("../../../errorHandler/CustomError.js");

describe("authorization Middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: { _id: "user123", role: "Manager" },
    };
    res = {};
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe("authorize", () => {
    test("should call next if user has permission", async () => {
      mockAuthMatrix.checkPermission.mockReturnValue({
        hasPermission: true,
        allowedScopes: ["ownDept"],
      });

      const middleware = authorize("Task", "read");
      await middleware(req, res, next);

      expect(mockAuthMatrix.checkPermission).toHaveBeenCalledWith(req.user, "Task", "read");
      expect(req.allowedScopes).toEqual(["ownDept"]);
      expect(next).toHaveBeenCalledWith();
    });

    test("should throw authorization error if user does not have permission", async () => {
      mockAuthMatrix.checkPermission.mockReturnValue({
        hasPermission: false,
        allowedScopes: [],
      });

      const middleware = authorize("Organization", "delete");
      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(403);
      expect(error.message).toContain("Insufficient permissions");
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    test("should throw authentication error if user is not in request", async () => {
      req.user = null;
      const middleware = authorize("Task", "read");
      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 401,
        message: "User not authenticated"
      }));
    });
  });

  describe("checkResourceAccess", () => {
    const user = { _id: "user123", role: "User" };
    const resourceDoc = { _id: "res123", createdBy: "user123" };

    test("should return normally if access is granted", () => {
      mockAuthMatrix.canAccessResource.mockReturnValue(true);

      expect(() =>
        checkResourceAccess(user, resourceDoc, "update", "Task")
      ).not.toThrow();

      expect(mockAuthMatrix.canAccessResource).toHaveBeenCalledWith(user, resourceDoc, "update", "Task");
    });

    test("should throw authorization error if access is denied", () => {
      mockAuthMatrix.canAccessResource.mockReturnValue(false);

      expect(() =>
        checkResourceAccess(user, resourceDoc, "delete", "Task")
      ).toThrow(expect.objectContaining({
        statusCode: 403,
        message: "You do not have permission to delete this Task"
      }));

      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });
});
