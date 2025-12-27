import { jest } from "@jest/globals";

// Mock generateTokens
const mockVerifyAccessToken = jest.fn();
jest.unstable_mockModule("../../../utils/generateTokens.js", () => ({
  verifyAccessToken: mockVerifyAccessToken,
  verifyRefreshToken: jest.fn(),
}));

// Mock logger
const mockLogger = { error: jest.fn() };
jest.unstable_mockModule("../../../utils/logger.js", () => ({
  default: mockLogger,
}));

// Mock User model
const mockUser = {
  findById: jest.fn().mockReturnThis(),
  populate: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  lean: jest.fn(),
};
jest.unstable_mockModule("../../../models/User.js", () => ({
  default: mockUser,
}));

const { socketAuthMiddleware } = await import("../../../middlewares/socketAuthMiddleware.js");

describe("socketAuthMiddleware", () => {
    let socket;
    let next;

    beforeEach(() => {
        socket = {
            handshake: {
                headers: {},
                auth: {}
            }
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    test("should return error if no cookies provided", async () => {
        await socketAuthMiddleware(socket, next);
        expect(next).toHaveBeenCalledWith(expect.any(Error));
        expect(next.mock.calls[0][0].message).toContain("No cookies found");
    });

    test("should return error if access_token cookie missing", async () => {
        socket.handshake.headers.cookie = "other_cookie=value";
        await socketAuthMiddleware(socket, next);
        expect(next).toHaveBeenCalledWith(expect.any(Error));
        expect(next.mock.calls[0][0].message).toContain("Access token not found");
    });

    test("should authenticate and attach user if token valid", async () => {
        socket.handshake.headers.cookie = "access_token=valid_token";
        const decoded = { userId: "user123" };
        const userData = {
            _id: "user123",
            organization: { _id: "org1", isDeleted: false },
            department: { _id: "dept1", isDeleted: false },
            isDeleted: false
        };

        mockVerifyAccessToken.mockReturnValue(decoded);
        mockUser.lean.mockResolvedValue(userData);

        await socketAuthMiddleware(socket, next);

        expect(mockVerifyAccessToken).toHaveBeenCalledWith("valid_token");
        expect(mockUser.findById).toHaveBeenCalledWith("user123");
        expect(socket.handshake.auth.user).toEqual(userData);
        expect(next).toHaveBeenCalledWith();
    });

    test("should return error if user deactivated", async () => {
        socket.handshake.headers.cookie = "access_token=valid_token";
        mockVerifyAccessToken.mockReturnValue({ userId: "user123" });
        mockUser.lean.mockResolvedValue({ _id: "user123", isDeleted: true });

        await socketAuthMiddleware(socket, next);
        expect(next).toHaveBeenCalledWith(expect.any(Error));
        expect(next.mock.calls[0][0].message).toContain("User account deactivated");
    });

    test("should return error if token invalid", async () => {
        socket.handshake.headers.cookie = "access_token=invalid_token";
        mockVerifyAccessToken.mockImplementation(() => { throw new Error("Invalid token"); });

        await socketAuthMiddleware(socket, next);
        expect(next).toHaveBeenCalledWith(expect.any(Error));
        expect(next.mock.calls[0][0].message).toContain("Invalid token");
    });
});
