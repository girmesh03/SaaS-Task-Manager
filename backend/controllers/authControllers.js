import mongoose from "mongoose";
import asyncHandler from "express-async-handler";
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
import { USER_ROLES, USER_STATUS } from "../utils/constants.js";
import logger from "../utils/logger.js";
import {
  createdResponse,
  successResponse,
} from "../utils/responseTransform.js";

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
export const register = asyncHandler(async (req, res) => {
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
          logo: orgData.logo,
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
          role: USER_ROLES.SUPER_ADMIN, // First user is always SuperAdmin
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

    // Side effects AFTER commit
    await user.populate(
      "organization",
      "_id name email industry logo isPlatformOrg isDeleted"
    );
    await user.populate("department", "_id name hod isDeleted");

    const welcomeResult = await sendWelcomeEmail(user);
    if (!welcomeResult.success) {
      logger.error({ message: "Failed to send welcome email", userId: user._id, error: welcomeResult.error });
    }

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
    });

    createdResponse(res, "Registration successful", user);
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    logger.error({
      message: "Registration failed",
      error: error.message,
      stack: error.stack,
    });
    throw error;
  } finally {
    session.endSession();
  }
});

/**
 * Login user
 * POST /api/auth/login
 * Public route with rate limiting (5/15min)
 */
export const login = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { email, password } = req.validated.body;

    const user = await User.findOne({ email })
      .session(session)
      .select("+password")
      .populate(
        "organization",
        "_id name email industry logo isPlatformOrg isDeleted"
      )
      .populate("department", "_id name hod isDeleted");

    if (!user) {
      throw CustomError.authentication("Invalid email or password");
    }

    if (user.isDeleted) {
      throw CustomError.authentication("User account has been deactivated");
    }

    if (!user.organization || user.organization.isDeleted) {
      throw CustomError.authentication("Organization has been deactivated");
    }

    if (!user.department || user.department.isDeleted) {
      throw CustomError.authentication("Department has been deactivated");
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw CustomError.authentication("Invalid email or password");
    }

    user.lastLogin = new Date();
    await user.save({ session });

    await session.commitTransaction();

    // Side effects AFTER commit
    const { accessToken, refreshToken } = generateTokens(user._id);
    setTokenCookies(res, accessToken, refreshToken);

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
    });

    successResponse(res, 200, "Login successful", {
      user,
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    throw error;
  } finally {
    session.endSession();
  }
});

/**
 * Logout user
 * DELETE /api/auth/logout
 */
export const logout = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const departmentId = req.user.department._id;
  const organizationId = req.user.organization._id;

  clearTokenCookies(res);

  emitToRooms("user:offline", { userId, status: USER_STATUS.OFFLINE }, [
    `user:${userId}`,
    `department:${departmentId}`,
    `organization:${organizationId}`,
  ]);

  logger.info({ message: "User logged out successfully", userId });
  successResponse(res, 200, "Logout successful");
});

/**
 * Refresh access token
 * GET /api/auth/refresh-token
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { accessToken, refreshToken: newRefreshToken } = generateTokens(userId);
  setTokenCookies(res, accessToken, newRefreshToken);

  logger.info({ message: "Token refreshed successfully", userId });
  successResponse(res, 200, "Token refreshed successfully");
});

/**
 * Forgot password - send reset email
 * POST /api/auth/forgot-password
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { email } = req.validated.body;
    const user = await User.findOne({ email }).session(session);

    if (!user || user.isDeleted) {
      await session.abortTransaction();
      logger.info({ message: "Forgot password requested for non-existent user", email });
      return successResponse(res, 200, "If an account with that email exists, a password reset link has been sent");
    }

    const resetToken = await user.generatePasswordResetToken();
    await user.save({ session });

    await session.commitTransaction();

    const emailResult = await sendPasswordResetEmail(user, resetToken);

    if (emailResult.success) {
      logger.info({ message: "Password reset email sent", userId: user._id });
      return successResponse(res, 200, "If an account with that email exists, a password reset link has been sent");
    } else {
      logger.error({ message: "Failed to send password reset email", userId: user._id, error: emailResult.error });
      // Still return success message to prevent enumeration, but include debug info if env is development
      return successResponse(res, 200,
        process.env.NODE_ENV === 'development'
          ? `Debug: Email failed - ${emailResult.error}`
          : "If an account with that email exists, a password reset link has been sent"
      );
    }
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    throw error;
  } finally {
    session.endSession();
  }
});

/**
 * Reset password with token
 * POST /api/auth/reset-password/:token
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { token } = req.params;
    const { password } = req.validated.body;

    const user = await User.findByResetToken(token, { session });
    if (!user) {
      throw CustomError.validation("Invalid or expired reset token");
    }

    const isTokenValid = await user.verifyPasswordResetToken(token);
    if (!isTokenValid) {
      throw CustomError.validation("Invalid or expired reset token");
    }

    user.password = password;
    user.clearPasswordResetToken();
    await user.save({ session });

    await session.commitTransaction();

    const confirmationResult = await sendPasswordResetConfirmation(user);
    if (!confirmationResult.success) {
      logger.error({ message: "Failed to send password reset confirmation email", userId: user._id, error: confirmationResult.error });
    }
    logger.info({ message: "Password reset successful", userId: user._id });

    successResponse(res, 200, "Password reset successful. You can now login with your new password");
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    throw error;
  } finally {
    session.endSession();
  }
});
