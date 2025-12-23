import {
  verifyAccessToken,
  verifyRefreshToken,
} from "../utils/generateTokens.js";
import CustomError from "../errorHandler/CustomError.js";
import User from "../models/User.js";
import logger from "../utils/logger.js";

/**
 * Authentication Middleware
 *
 * Verifies JWT tokens from HTTP-only cookies
 * Attaches user object to request
 */

/**
 * Verify JWT access token
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 */
export const verifyJWT = async (req, res, next) => {
  try {
    // Get token from HTTP-only cookie
    const token = req.cookies.access_token;

    if (!token) {
      throw CustomError.authentication("Access token not found. Please login.");
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    // Get user from database with organization and department populated
    const user = await User.findById(decoded.userId)
      .populate("organization", "name isPlatformOrg")
      .populate("department", "name")
      .select("-password -passwordResetToken -passwordResetExpires");

    if (!user) {
      throw CustomError.authentication("User not found. Please login again.");
    }

    // Check if user is soft-deleted
    if (user.isDeleted) {
      throw CustomError.authentication("User account has been deactivated.");
    }

    // Attach user to request
    req.user = user;

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return next(
        CustomError.authentication("Invalid token. Please login again.")
      );
    }
    if (error.name === "TokenExpiredError") {
      return next(
        CustomError.authentication("Token expired. Please login again.")
      );
    }
    next(error);
  }
};

/**
 * Verify JWT refresh token
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 */
export const verifyRefreshTokenMiddleware = async (req, res, next) => {
  try {
    // Get token from HTTP-only cookie
    const token = req.cookies.refresh_token;

    if (!token) {
      throw CustomError.authentication(
        "Refresh token not found. Please login."
      );
    }

    // Verify token
    const decoded = verifyRefreshToken(token);

    // Get user from database
    const user = await User.findById(decoded.userId)
      .populate("organization", "name isPlatformOrg")
      .populate("department", "name")
      .select("-password -passwordResetToken -passwordResetExpires");

    if (!user) {
      throw CustomError.authentication("User not found. Please login again.");
    }

    // Check if user is soft-deleted
    if (user.isDeleted) {
      throw CustomError.authentication("User account has been deactivated.");
    }

    // Attach user to request
    req.user = user;

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return next(
        CustomError.authentication("Invalid refresh token. Please login again.")
      );
    }
    if (error.name === "TokenExpiredError") {
      return next(
        CustomError.authentication("Refresh token expired. Please login again.")
      );
    }
    next(error);
  }
};
