import mongoose from "mongoose";
import { Organization, Department, User } from "../models/index.js";
import CustomError from "../errorHandler/CustomError.js";
import {
  generateTokens,
  setTokenCookies,
  clearTokenCookies,
} from "../utils/generateTokens.js";
import {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordResetConfirmation,
} from "../services/emailService.js";
import { emitToRooms } from "../utils/socketEmitter.js";
import { USER_STATUS } from "../utils/constants.js";
import logger from "../utils/logger.js";

/**
 * Authentication Controllers
 *
 * CRITICAL: All write operations use MongoDB transactions
 * CRITICAL: Socket.IO events emitted AFTER transaction commit
 * CRITICAL: Email sending is async and non-blocking
 */

/**
 * Register new organization, department, and user
 * POST /api/auth/register
 * Public route with rate limiting (5/15min)
 */
export const register = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      organization: orgData,
      department: deptData,
      user: userData,
    } = req.validated.body;

    // 1. Create organization
    const [organization] = await Organization.create(
      [
        {
          name: orgData.name,
          description: orgData.description,
          email: orgData.email,
          phone: orgData.phone,
          address: orgData.address,
          industry: orgData.industry,
          isPlatformOrg: false, // Customer organization
        },
      ],
      { session }
    );

    // 2. Create department
    const [department] = await Department.create(
      [
        {
          name: deptData.name,
          description: deptData.description,
          organization: organization._id,
        },
      ],
      { session }
    );

    // 3. Create user (first user is SuperAdmin and HOD)
    const [user] = await User.create(
      [
        {
          firstName: userData.firstName,
          lastName: userData.lastName,
          position: userData.position,
          role: "SuperAdmin", // First user is always SuperAdmin
          email: userData.email,
          password: userData.password,
          organization: organization._id,
          department: department._id,
          employeeId: userData.employeeId,
          dateOfBirth: userData.dateOfBirth,
          joinedAt: userData.joinedAt,
          isPlatformUser: false, // Auto-set in pre-save hook
          isHod: true, // Auto-set in pre-save hook
        },
      ],
      { session }
    );

    // 4. Update department with HOD
    department.hod = user._id;
    department.createdBy = user._id;
    await department.save({ session });

    // 5. Update organization with createdBy
    organization.createdBy = user._id;
    await organization.save({ session });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    // Populate user for response
    await user.populate("organization", "_id name isPlatformOrg isDeleted");
    await user.populate("department", "_id name isDeleted");

    // Send welcome email (async, non-blocking)
    sendWelcomeEmail(user);

    // Emit Socket.IO events
    emitToRooms("organization:created", organization, [
      `organization:${organization._id}`,
    ]);
    emitToRooms("department:created", department, [
      `organization:${organization._id}`,
      `department:${department._id}`,
    ]);
    emitToRooms("user:created", user, [
      `organization:${organization._id}`,
      `department:${department._id}`,
    ]);

    logger.info({
      message: "User registered successfully",
      userId: user._id,
      organizationId: organization._id,
      departmentId: department._id,
    });

    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: {
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          organization: user.organization,
          department: user.department,
          isHod: user.isHod,
          isPlatformUser: user.isPlatformUser,
        },
        organization: {
          _id: organization._id,
          name: organization.name,
          email: organization.email,
        },
        department: {
          _id: department._id,
          name: department.name,
        },
      },
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    logger.error({
      message: "Registration failed",
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

/**
 * Login user
 * POST /api/auth/login
 * Public route with rate limiting (5/15min)
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.validated.body;

    // Dynamically import User model
    const { default: User } = await import("../models/User.js");

    // Find user by email with password field
    const user = await User.findOne({ email })
      .select("+password")
      .populate("organization", "_id name isPlatformOrg isDeleted")
      .populate("department", "_id name isDeleted");

    if (!user) {
      throw CustomError.authentication("Invalid email or password");
    }

    // Check if user is soft-deleted
    if (user.isDeleted) {
      throw CustomError.authentication("User account has been deactivated");
    }

    // Check if organization is soft-deleted
    if (!user.organization || user.organization.isDeleted) {
      throw CustomError.authentication("Organization has been deactivated");
    }

    // Check if department is soft-deleted
    if (!user.department || user.department.isDeleted) {
      throw CustomError.authentication("Department has been deactivated");
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw CustomError.authentication("Invalid email or password");
    }

    // Generate JWT tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Set HTTP-only cookies
    setTokenCookies(res, accessToken, refreshToken);

    // Update lastLogin
    user.lastLogin = new Date();
    await user.save();

    // Remove password from response
    user.password = undefined;

    // Emit user:online event
    emitToRooms(
      "user:online",
      { userId: user._id, status: USER_STATUS.ONLINE },
      [
        `user:${user._id}`,
        `department:${user.department._id}`,
        `organization:${user.organization._id}`,
      ]
    );

    logger.info({
      message: "User logged in successfully",
      userId: user._id,
      email: user.email,
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          organization: user.organization,
          department: user.department,
          isHod: user.isHod,
          isPlatformUser: user.isPlatformUser,
          lastLogin: user.lastLogin,
        },
      },
    });
  } catch (error) {
    logger.error({
      message: "Login failed",
      email: req.validated.body.email,
      error: error.message,
    });
    next(error);
  }
};

/**
 * Logout user
 * DELETE /api/auth/logout
 * Protected route with rate limiting (5/15min)
 */
export const logout = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const departmentId = req.user.department._id;
    const organizationId = req.user.organization._id;

    // Clear HTTP-only cookies
    clearTokenCookies(res);

    // Emit user:offline event
    emitToRooms("user:offline", { userId, status: USER_STATUS.OFFLINE }, [
      `user:${userId}`,
      `department:${departmentId}`,
      `organization:${organizationId}`,
    ]);

    logger.info({
      message: "User logged out successfully",
      userId,
    });

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    logger.error({
      message: "Logout failed",
      userId: req.user?._id,
      error: error.message,
    });
    next(error);
  }
};

/**
 * Refresh access token
 * GET /api/auth/refresh-token
 * Protected route with rate limiting (5/15min)
 */
export const refreshToken = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Generate new tokens (token rotation)
    const { accessToken, refreshToken: newRefreshToken } =
      generateTokens(userId);

    // Set new HTTP-only cookies
    setTokenCookies(res, accessToken, newRefreshToken);

    logger.info({
      message: "Token refreshed successfully",
      userId,
    });

    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
    });
  } catch (error) {
    logger.error({
      message: "Token refresh failed",
      userId: req.user?._id,
      error: error.message,
    });
    next(error);
  }
};

/**
 * Forgot password - send reset email
 * POST /api/auth/forgot-password
 * Public route with rate limiting (5/15min)
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.validated.body;

    // Dynamically import User model
    const { default: User } = await import("../models/User.js");

    // Find user by email
    const user = await User.findOne({ email });

    // CRITICAL: Always return success to prevent email enumeration
    // Even if user doesn't exist, return success message
    if (!user || user.isDeleted) {
      logger.info({
        message: "Password reset requested for non-existent/deleted user",
        email,
      });

      return res.status(200).json({
        success: true,
        message:
          "If an account with that email exists, a password reset link has been sent",
      });
    }

    // Generate reset token
    const resetToken = await user.generatePasswordResetToken();
    await user.save();

    // Send password reset email (async, non-blocking)
    sendPasswordResetEmail(user, resetToken);

    logger.info({
      message: "Password reset email sent",
      userId: user._id,
      email: user.email,
    });

    res.status(200).json({
      success: true,
      message:
        "If an account with that email exists, a password reset link has been sent",
    });
  } catch (error) {
    logger.error({
      message: "Forgot password failed",
      email: req.validated.body.email,
      error: error.message,
    });
    next(error);
  }
};

/**
 * Reset password with token
 * POST /api/auth/reset-password
 * Public route with rate limiting (5/15min)
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.validated.body;

    // Dynamically import User model
    const { default: User } = await import("../models/User.js");

    // Find user with valid reset token
    const user = await User.findOne({
      passwordResetExpires: { $gt: new Date() },
    }).select("+passwordResetToken +passwordResetExpires");

    if (!user) {
      throw CustomError.validation("Invalid or expired reset token");
    }

    // Verify reset token
    const isTokenValid = await user.verifyPasswordResetToken(token);
    if (!isTokenValid) {
      throw CustomError.validation("Invalid or expired reset token");
    }

    // Update password
    user.password = password;
    user.clearPasswordResetToken();
    await user.save();

    // Send confirmation email (async, non-blocking)
    sendPasswordResetConfirmation(user);

    logger.info({
      message: "Password reset successful",
      userId: user._id,
      email: user.email,
    });

    res.status(200).json({
      success: true,
      message:
        "Password reset successful. You can now login with your new password",
    });
  } catch (error) {
    logger.error({
      message: "Password reset failed",
      error: error.message,
    });
    next(error);
  }
};
