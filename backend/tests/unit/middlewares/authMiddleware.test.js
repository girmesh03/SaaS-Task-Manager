import { jest } from "@jest/globals";

const mockLogger = {
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

const mockGenerateTokens = {
  verifyAccessToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
};

const mockUser = {
  findById: jest.fn().mockReturnThis(),
  populate: jest.fn().mockReturnThis(),
  select: jest.fn(),
};

jest.unstable_mockModule("../../../utils/logger.js", () => ({
  default: mockLogger,
}));

jest.unstable_mockModule("../../../utils/generateTokens.js", () => mockGenerateTokens);

jest.unstable_mockModule("../../../models/User.js", () => ({
  default: mockUser,
}));

// Import after mocking
const { verifyJWT, verifyRefreshTokenMiddleware } = await import("../../../middlewares/authMiddleware.js");
const { default: CustomError } = await import("../../../errorHandler/CustomError.js");

describe("authMiddleware - Authentication Middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      cookies: {},
      user: null,
    };
    res = {};
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe("verifyJWT", () => {
    test("should pass authentication if token is valid and user/org/dept are active", async () => {
      req.cookies.access_token = "valid_token";
      const userId = "user123";
      mockGenerateTokens.verifyAccessToken.mockReturnValue({ userId });

      const activeUser = {
        _id: userId,
        isDeleted: false,
        organization: { _id: "org123", isDeleted: false },
        department: { _id: "dept123", isDeleted: false },
      };

      mockUser.select.mockResolvedValue(activeUser);

      await verifyJWT(req, res, next);

      expect(mockGenerateTokens.verifyAccessToken).toHaveBeenCalledWith("valid_token");
      expect(mockUser.findById).toHaveBeenCalledWith(userId);
      expect(req.user).toEqual(activeUser);
      expect(next).toHaveBeenCalledWith();
    });

    test("should throw authentication error if token is missing", async () => {
      await verifyJWT(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(401);
      expect(error.message).toContain("Access token not found");
    });

    test("should handle JsonWebTokenError", async () => {
      req.cookies.access_token = "invalid_token";
      const jwtError = new Error("Invalid token");
      jwtError.name = "JsonWebTokenError";
      mockGenerateTokens.verifyAccessToken.mockImplementation(() => {
        throw jwtError;
      });

      await verifyJWT(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 401,
        message: "Invalid token. Please login again."
      }));
    });

    test("should throw error if user is not found", async () => {
      req.cookies.access_token = "valid_token";
      mockGenerateTokens.verifyAccessToken.mockReturnValue({ userId: "nonexistent" });
      mockUser.select.mockResolvedValue(null);

      await verifyJWT(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 401,
        message: "User not found. Please login again."
      }));
    });

    test("should throw error if user is soft-deleted", async () => {
      req.cookies.access_token = "valid_token";
      mockGenerateTokens.verifyAccessToken.mockReturnValue({ userId: "deleted_user" });
      mockUser.select.mockResolvedValue({ isDeleted: true });

      await verifyJWT(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 401,
        message: "User account has been deactivated."
      }));
    });

    test("should throw error if organization is missing or deleted", async () => {
      req.cookies.access_token = "valid_token";
      mockGenerateTokens.verifyAccessToken.mockReturnValue({ userId: "user_no_org" });

      // Missing organization
      mockUser.select.mockResolvedValue({ isDeleted: false, organization: null });
      await verifyJWT(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: "Organization not found. Please contact administrator."
      }));

      // Deleted organization
      mockUser.select.mockResolvedValue({
        isDeleted: false,
        organization: { isDeleted: true }
      });
      await verifyJWT(req, res, next);
      expect(next).toHaveBeenLastCalledWith(expect.objectContaining({
        message: "Organization has been deactivated."
      }));
    });

    test("should throw error if department is missing or deleted", async () => {
        req.cookies.access_token = "valid_token";
        mockGenerateTokens.verifyAccessToken.mockReturnValue({ userId: "user_no_dept" });

        // Missing department
        mockUser.select.mockResolvedValue({
          isDeleted: false,
          organization: { isDeleted: false },
          department: null
        });
        await verifyJWT(req, res, next);
        expect(next).toHaveBeenCalledWith(expect.objectContaining({
          message: "Department not found. Please contact administrator."
        }));

        // Deleted department
        mockUser.select.mockResolvedValue({
          isDeleted: false,
          organization: { isDeleted: false },
          department: { isDeleted: true }
        });
        await verifyJWT(req, res, next);
        expect(next).toHaveBeenLastCalledWith(expect.objectContaining({
          message: "Department has been deactivated."
        }));
      });

      test("should handle TokenExpiredError", async () => {
      req.cookies.access_token = "expired_token";
      const jwtError = new Error("Token expired");
      jwtError.name = "TokenExpiredError";
      mockGenerateTokens.verifyAccessToken.mockImplementation(() => {
        throw jwtError;
      });

      await verifyJWT(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 401,
        message: "Token expired. Please login again."
      }));
    });
  });

  describe("verifyRefreshTokenMiddleware", () => {
    test("should pass if refresh token is valid", async () => {
      req.cookies.refresh_token = "valid_refresh";
      const userId = "user123";
      mockGenerateTokens.verifyRefreshToken.mockReturnValue({ userId });

      const activeUser = {
        _id: userId,
        isDeleted: false,
        organization: { _id: "org123", isDeleted: false },
        department: { _id: "dept123", isDeleted: false },
      };

      mockUser.select.mockResolvedValue(activeUser);

      await verifyRefreshTokenMiddleware(req, res, next);

      expect(mockGenerateTokens.verifyRefreshToken).toHaveBeenCalledWith("valid_refresh");
      expect(req.user).toEqual(activeUser);
      expect(next).toHaveBeenCalledWith();
    });

    test("should throw error if refresh token is missing", async () => {
        await verifyRefreshTokenMiddleware(req, res, next);
        expect(next).toHaveBeenCalledWith(expect.objectContaining({
            statusCode: 401,
            message: "Refresh token not found. Please login."
        }));
    });

    test("should handle refresh token errors", async () => {
        req.cookies.refresh_token = "invalid_refresh";
        const jwtError = new Error("Invalid token");
        jwtError.name = "JsonWebTokenError";
        mockGenerateTokens.verifyRefreshToken.mockImplementation(() => { throw jwtError; });

        await verifyRefreshTokenMiddleware(req, res, next);
        expect(next).toHaveBeenCalledWith(expect.objectContaining({
            message: "Invalid refresh token. Please login again."
        }));

        const expireError = new Error("Expired");
        expireError.name = "TokenExpiredError";
        mockGenerateTokens.verifyRefreshToken.mockImplementation(() => { throw expireError; });
        await verifyRefreshTokenMiddleware(req, res, next);
        expect(next).toHaveBeenLastCalledWith(expect.objectContaining({
            message: "Refresh token expired. Please login again."
        }));
    });

    test("should throw error if user/org/dept deleted on refresh", async () => {
        req.cookies.refresh_token = "valid_refresh";
        mockGenerateTokens.verifyRefreshToken.mockReturnValue({ userId: "u1" });

        // User deleted
        mockUser.select.mockResolvedValue({ isDeleted: true });
        await verifyRefreshTokenMiddleware(req, res, next);
        expect(next).toHaveBeenCalledWith(expect.objectContaining({
            message: "User account has been deactivated."
        }));

        // User not found
        mockUser.select.mockResolvedValue(null);
        await verifyRefreshTokenMiddleware(req, res, next);
        expect(next).toHaveBeenLastCalledWith(expect.objectContaining({
            message: "User not found. Please login again."
        }));

        // Org deleted
        mockUser.select.mockResolvedValue({ isDeleted: false, organization: { isDeleted: true } });
        await verifyRefreshTokenMiddleware(req, res, next);
        expect(next).toHaveBeenLastCalledWith(expect.objectContaining({
            message: "Organization has been deactivated."
        }));

        // Dept deleted
        mockUser.select.mockResolvedValue({
            isDeleted: false,
            organization: { isDeleted: false },
            department: { isDeleted: true }
        });
        await verifyRefreshTokenMiddleware(req, res, next);
        expect(next).toHaveBeenLastCalledWith(expect.objectContaining({
            message: "Department has been deactivated."
        }));
    });
  });
});
