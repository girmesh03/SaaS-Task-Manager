import {
  verifyAccessToken,
  verifyRefreshToken,
} from "../utils/generateTokens.js";
import CustomError from "../errorHandler/CustomError.js";
import logger from "../utils/logger.js";

/**
 * Authentication Middleware
 *
 * Verifies JWT tokens from HTTP-only cookies
 * Attaches user object to request
 *
 * CRITICAL: Checks user, organization, and department isDeleted status
 * Populates organization and department with _id and isDeleted accessible
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

    // Dynamically import User model to avoid circular dependency
    const { default: User } = await import("../models/User.js");

    // Get user from database with organization and department populated
    // CRITICAL: Populate with _id, name, isPlatformOrg, and isDeleted
    const user = await User.findById(decoded.userId)
      .populate("organization", "_id name isPlatformOrg isDeleted")
      .populate("department", "_id name isDeleted hod")
      .select("-password -passwordResetToken -passwordResetExpires");

    if (!user) {
      throw CustomError.authentication("User not found. Please login again.");
    }

    // Check if user is soft-deleted
    if (user.isDeleted) {
      throw CustomError.authentication("User account has been deactivated.");
    }

    // Check if organization is soft-deleted
    if (!user.organization) {
      throw CustomError.authentication(
        "Organization not found. Please contact administrator."
      );
    }
    if (user.organization.isDeleted) {
      throw CustomError.authentication("Organization has been deactivated.");
    }

    // Check if department is soft-deleted
    if (!user.department) {
      throw CustomError.authentication(
        "Department not found. Please contact administrator."
      );
    }
    if (user.department.isDeleted) {
      throw CustomError.authentication("Department has been deactivated.");
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

    // Dynamically import User model to avoid circular dependency
    const { default: User } = await import("../models/User.js");

    // Get user from database with organization and department populated
    // CRITICAL: Populate with _id, name, isPlatformOrg, and isDeleted
    const user = await User.findById(decoded.userId)
      .populate("organization", "_id name isPlatformOrg isDeleted")
      .populate("department", "_id name isDeleted hod")
      .select("-password -passwordResetToken -passwordResetExpires");

    if (!user) {
      throw CustomError.authentication("User not found. Please login again.");
    }

    // Check if user is soft-deleted
    if (user.isDeleted) {
      throw CustomError.authentication("User account has been deactivated.");
    }

    // Check if organization is soft-deleted
    if (!user.organization) {
      throw CustomError.authentication(
        "Organization not found. Please contact administrator."
      );
    }
    if (user.organization.isDeleted) {
      throw CustomError.authentication("Organization has been deactivated.");
    }

    // Check if department is soft-deleted
    if (!user.department) {
      throw CustomError.authentication(
        "Department not found. Please contact administrator."
      );
    }
    if (user.department.isDeleted) {
      throw CustomError.authentication("Department has been deactivated.");
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
