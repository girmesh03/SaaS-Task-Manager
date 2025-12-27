import cookie from "cookie";
import { verifyAccessToken } from "../utils/generateTokens.js";
import logger from "../utils/logger.js";

/**
 * Socket.IO Authentication Middleware
 *
 * Verifies JWT token from HTTP-only cookies in socket handshake
 * Attaches user object to socket.handshake.auth
 */
export const socketAuthMiddleware = async (socket, next) => {
  try {
    const cookies = socket.handshake.headers.cookie;

    if (!cookies) {
      return next(new Error("Authentication error: No cookies found"));
    }

    const parsedCookies = cookie.parse(cookies);
    const token = parsedCookies.access_token;

    if (!token) {
      return next(new Error("Authentication error: Access token not found"));
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    // Dynamically import User model
    const { default: User } = await import("../models/User.js");

    // Get user with organization and department
    const user = await User.findById(decoded.userId)
      .populate("organization", "_id name isPlatformOrg isDeleted")
      .populate("department", "_id name isDeleted")
      .select("-password -passwordResetToken -passwordResetExpires")
      .lean();

    if (!user) {
      return next(new Error("Authentication error: User not found"));
    }

    if (user.isDeleted) {
      return next(new Error("Authentication error: User account deactivated"));
    }

    if (!user.organization || user.organization.isDeleted) {
      return next(new Error("Authentication error: Organization deactivated"));
    }

    if (!user.department || user.department.isDeleted) {
      return next(new Error("Authentication error: Department deactivated"));
    }

    // Attach user to handshake auth
    socket.handshake.auth.user = user;

    next();
  } catch (error) {
    logger.error(`Socket auth failed: ${error.message}`);
    next(new Error("Authentication error: Invalid token"));
  }
};

export default socketAuthMiddleware;
