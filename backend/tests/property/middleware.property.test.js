import { jest } from "@jest/globals";
import fc from "fast-check";

const mockGenerateTokens = {
  verifyAccessToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
};

const mockUser = {
  findById: jest.fn().mockReturnThis(),
  populate: jest.fn().mockReturnThis(),
  select: jest.fn(),
};

const mockAuthMatrix = {
  checkPermission: jest.fn(),
  canAccessResource: jest.fn(),
};

const mockLogger = {
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

jest.unstable_mockModule("../../utils/generateTokens.js", () => mockGenerateTokens);
jest.unstable_mockModule("../../utils/logger.js", () => ({
  default: mockLogger,
}));
jest.unstable_mockModule("../../models/User.js", () => ({ default: mockUser }));
jest.unstable_mockModule("../../utils/authorizationMatrix.js", () => mockAuthMatrix);

// Also mock CustomError to be safe
jest.unstable_mockModule("../../errorHandler/CustomError.js", () => ({
  default: {
    authentication: jest.fn((msg) => {
        const err = new Error(msg);
        err.statusCode = 401;
        return err;
    }),
    authorization: jest.fn((msg) => {
        const err = new Error(msg);
        err.statusCode = 403;
        return err;
    }),
  }
}));

const { verifyJWT } = await import("../../middlewares/authMiddleware.js");
const { authorize } = await import("../../middlewares/authorization.js");

describe("Middleware Property-Based Tests", () => {
  describe("Property 9: JWT Authentication Consistency", () => {
    test("should consistently handle authentication based on user status", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // userId
          fc.boolean(), // isUserDeleted
          fc.boolean(), // isOrgDeleted
          fc.boolean(), // isDeptDeleted
          async (userId, isUserDeleted, isOrgDeleted, isDeptDeleted) => {
            jest.clearAllMocks();
            const req = { cookies: { access_token: "token" } };
            const res = {};
            const next = jest.fn();

            mockGenerateTokens.verifyAccessToken.mockReturnValue({ userId });

            const userDoc = {
              _id: userId,
              isDeleted: isUserDeleted,
              organization: { _id: "org1", isDeleted: isOrgDeleted },
              department: { _id: "dept1", isDeleted: isDeptDeleted },
            };

            mockUser.select.mockResolvedValue(userDoc);

            await verifyJWT(req, res, next);

            const shouldFail = isUserDeleted || isOrgDeleted || isDeptDeleted;
            if (shouldFail) {
              expect(next).toHaveBeenCalledWith(expect.any(Error));
              expect(req.user).toBeUndefined();
            } else {
              expect(next).toHaveBeenCalledWith();
              expect(req.user).toEqual(userDoc);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("Property 10: Role Authorization Integrity", () => {
    test("should consistently grant/deny access based on permission matrix", async () => {
      const roles = ["Platform SuperAdmin", "Customer SuperAdmin", "Admin", "Manager", "User"];
      const resources = ["User", "Organization", "Department", "Task", "Material", "Vendor"];
      const operations = ["create", "read", "update", "delete"];

      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...roles),
          fc.constantFrom(...resources),
          fc.constantFrom(...operations),
          fc.boolean(), // hasPermission mock result
          async (role, resource, operation, hasPermission) => {
            jest.clearAllMocks();
            const req = { user: { role } };
            const res = {};
            const next = jest.fn();

            mockAuthMatrix.checkPermission.mockReturnValue({
              hasPermission,
              allowedScopes: hasPermission ? ["crossOrg"] : [],
            });

            const middleware = authorize(resource, operation);
            await middleware(req, res, next);

            if (hasPermission) {
              expect(next).toHaveBeenCalledWith();
              expect(req.allowedScopes).toEqual(["crossOrg"]);
            } else {
              expect(next).toHaveBeenCalledWith(expect.any(Error));
              const error = next.mock.calls[0][0];
              expect(error.statusCode).toBe(403);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
