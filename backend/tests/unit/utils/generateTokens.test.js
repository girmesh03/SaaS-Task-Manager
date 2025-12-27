import { jest } from "@jest/globals";

const mockJwt = {
  sign: jest.fn(),
  verify: jest.fn(),
};

// Use unstable_mockModule for ESM
jest.unstable_mockModule("jsonwebtoken", () => ({
  default: mockJwt,
  sign: mockJwt.sign,
  verify: mockJwt.verify,
}));

// We must use dynamic import after mock
const {
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  setTokenCookies,
  clearTokenCookies,
} = await import("../../../utils/generateTokens.js");
const { JWT } = await import("../../../utils/constants.js");

describe("generateTokens - JWT Token Generation", () => {
  const userId = "testUserId";
  const accessTokenSecret = "access_secret_12345678901234567890123456789012";
  const refreshTokenSecret = "refresh_secret_12345678901234567890123456789012";

  beforeAll(() => {
    process.env.JWT_ACCESS_SECRET = accessTokenSecret;
    process.env.JWT_REFRESH_SECRET = refreshTokenSecret;
    process.env.JWT_ACCESS_EXPIRES_IN = "15m";
    process.env.JWT_REFRESH_EXPIRES_IN = "7d";
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("generateAccessToken", () => {
    test("should sign access token with correct parameters", () => {
      mockJwt.sign.mockReturnValue("mock_access_token");

      const token = generateAccessToken(userId);

      expect(mockJwt.sign).toHaveBeenCalledWith(
        { userId },
        accessTokenSecret,
        { expiresIn: "15m" }
      );
      expect(token).toBe("mock_access_token");
    });
  });

  describe("generateRefreshToken", () => {
    test("should sign refresh token with correct parameters", () => {
      mockJwt.sign.mockReturnValue("mock_refresh_token");

      const token = generateRefreshToken(userId);

      expect(mockJwt.sign).toHaveBeenCalledWith(
        { userId },
        refreshTokenSecret,
        { expiresIn: "7d" }
      );
      expect(token).toBe("mock_refresh_token");
    });
  });

  describe("generateTokens", () => {
    test("should return object with both tokens", () => {
      mockJwt.sign
        .mockReturnValueOnce("access_token")
        .mockReturnValueOnce("refresh_token");

      const tokens = generateTokens(userId);

      expect(tokens).toEqual({
        accessToken: "access_token",
        refreshToken: "refresh_token",
      });
    });
  });

  describe("verifyAccessToken", () => {
    test("should verify with access secret", () => {
      mockJwt.verify.mockReturnValue({ userId });

      const decoded = verifyAccessToken("token");

      expect(mockJwt.verify).toHaveBeenCalledWith("token", accessTokenSecret);
      expect(decoded).toEqual({ userId });
    });
  });

  describe("verifyRefreshToken", () => {
    test("should verify with refresh secret", () => {
      mockJwt.verify.mockReturnValue({ userId });

      const decoded = verifyRefreshToken("token");

      expect(mockJwt.verify).toHaveBeenCalledWith("token", refreshTokenSecret);
      expect(decoded).toEqual({ userId });
    });
  });

  describe("setTokenCookies", () => {
    test("should set cookies with correct options (Development)", () => {
      const res = { cookie: jest.fn() };
      process.env.NODE_ENV = "development";

      setTokenCookies(res, "access", "refresh");

      expect(res.cookie).toHaveBeenCalledWith("access_token", "access", expect.objectContaining({
        httpOnly: true,
        secure: false, // Development
        sameSite: "strict",
        maxAge: JWT.COOKIE_MAX_AGE.ACCESS
      }));

      expect(res.cookie).toHaveBeenCalledWith("refresh_token", "refresh", expect.objectContaining({
        httpOnly: true,
        secure: false, // Development
        sameSite: "strict",
        maxAge: JWT.COOKIE_MAX_AGE.REFRESH
      }));
    });

    test("should set cookies with correct options (Production)", () => {
      const res = { cookie: jest.fn() };
      process.env.NODE_ENV = "production";

      setTokenCookies(res, "access", "refresh");

      expect(res.cookie).toHaveBeenCalledWith("access_token", "access", expect.objectContaining({
        secure: true // Production
      }));
    });
  });

  describe("clearTokenCookies", () => {
    test("should clear both cookies", () => {
      const res = { clearCookie: jest.fn() };

      clearTokenCookies(res);

      expect(res.clearCookie).toHaveBeenCalledWith("access_token");
      expect(res.clearCookie).toHaveBeenCalledWith("refresh_token");
    });
  });
});
