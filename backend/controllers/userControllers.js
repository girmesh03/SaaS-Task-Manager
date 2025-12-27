import mongoose from "mongoose";
import asyncHandler from "express-async-handler";
import { User, Department, Organization, BaseTask } from "../models/index.js";
import CustomError from "../errorHandler/CustomError.js";
import { emitToRooms } from "../utils/socketEmitter.js";
import { PAGINATION, USER_ROLES } from "../utils/constants.js";
import { sendEmail } from "../services/emailService.js";
import { welcomeEmailTemplate } from "../templates/emailTemplates.js";
import logger from "../utils/logger.js";
import {
  createdResponse,
  okResponse,
  paginatedResponse,
  successResponse,
} from "../utils/responseTransform.js";

/**
 * User Controllers
 *
 * CRITICAL: All write operations use MongoDB transactions
 * CRITICAL: Socket.IO events emitted AFTER transaction commit
 * CRITICAL: Organization scoping for Customer SuperAdmin/Admin
 * CRITICAL: Prevent last SuperAdmin/HOD deletion
 * CRITICAL: Remove user from task watchers, assignees, and mentions on deletion
 */

/**
 * Get all users with pagination and filters
 * GET /api/users
 * Protected route (authorize User read)
 */
export const getUsers = asyncHandler(async (req, res) => {
  const {
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
    search,
    role,
    department,
    deleted = "false", // Show only active users by default
  } = req.query;

  // Build filter query
  const filter = {
    organization: req.user.organization._id,
  };

  // Search by name or email
  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { employeeId: { $regex: search, $options: "i" } },
    ];
  }

  // Filter by role
  if (role) {
    filter.role = role;
  }

  // Filter by department
  if (department) {
    filter.department = department;
  }

  // Build query
  let query = User.find(filter);

  // Include deleted users if requested
  if (deleted === "true") {
    query = query.withDeleted();
  } else if (deleted === "only") {
    query = query.onlyDeleted();
  }

  // Pagination options
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort: { createdAt: -1 },
    populate: [
      { path: "organization", select: "name" },
      { path: "department", select: "name" },
    ],
    select: "-password -passwordResetToken -passwordResetExpires",
  };

  const users = await User.paginate(query, options);

  paginatedResponse(res, 200, "Users retrieved successfully", users.docs, {
    total: users.totalDocs,
    page: users.page,
    limit: users.limit,
    totalPages: users.totalPages,
    hasNextPage: users.hasNextPage,
    hasPrevPage: users.hasPrevPage,
  });
});

/**
 * Get single user by ID
 * GET /api/users/:userId
 * Protected route (authorize User read)
 */
export const getUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId)
    .populate("organization", "name email")
    .populate("department", "name")
    .select("-password -passwordResetToken -passwordResetExpires")
    .lean();

  if (!user) {
    throw CustomError.notFound("User not found");
  }

  // Organization scoping
  if (
    user.organization._id.toString() !== req.user.organization._id.toString()
  ) {
    throw CustomError.authorization("You are not authorized to view this user");
  }

  okResponse(res, "User retrieved successfully", user);
});

/**
 * Create new user
 * POST /api/users
 * Protected route (authorize User create)
 */
export const createUser = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      firstName,
      lastName,
      position,
      role,
      email,
      password,
      department,
      employeeId,
      dateOfBirth,
      joinedAt,
      skills,
      profilePicture,
    } = req.body;

    // Create user (organization is automatically set from req.user)
    const userData = {
      firstName,
      lastName,
      position,
      role: role || USER_ROLES.USER,
      email,
      password,
      organization: req.user.organization._id,
      department,
      employeeId,
      dateOfBirth,
      joinedAt,
      skills,
      profilePicture,
    };

    const [user] = await User.create([userData], { session });

    // Commit transaction
    await session.commitTransaction();

    // Fetch populated user for email
    const populatedUserForEmail = await User.findById(user._id)
      .populate("organization", "name")
      .populate("department", "name")
      .lean();

    // Send welcome email AFTER commit
    try {
      await sendEmail({
        to: user.email,
        subject: "Welcome to the Team!",
        html: welcomeEmailTemplate(populatedUserForEmail),
      });
    } catch (emailError) {
      logger.error("Welcome Email Error:", emailError);
      // Don't fail the request if email fails
    }

    // Emit Socket.IO event AFTER commit
    emitToRooms(
      "user:created",
      {
        userId: user._id,
        organizationId: user.organization,
        departmentId: user.department,
      },
      [`organization:${user.organization}`, `department:${user.department}`]
    );

    // Fetch populated user
    const populatedUser = await User.findById(user._id)
      .populate("organization", "name email")
      .populate("department", "name")
      .select("-password -passwordResetToken -passwordResetExpires")
      .lean();

    createdResponse(res, "User created successfully", populatedUser);
  } catch (error) {
    await session.abortTransaction();
    logger.error("Create User Error:", error);

    if (error.code === 11000) {
      throw CustomError.conflict(
        "User with this email or employee ID already exists"
      );
    }
    throw error;
  } finally {
    session.endSession();
  }
});

/**
 * Update user
 * PUT /api/users/:userId
 * Protected route (authorize User update)
 */
export const updateUser = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { userId } = req.params;
    const updates = req.body;

    const user = await User.findById(userId).session(session);

    if (!user) {
      throw CustomError.notFound("User not found");
    }

    // Organization scoping
    if (
      user.organization.toString() !== req.user.organization._id.toString()
    ) {
      throw CustomError.authorization(
        "You are not authorized to update this user"
      );
    }

    // Apply updates
    Object.keys(updates).forEach((key) => {
      // Prevent updating immutable fields
      if (key !== "organization" && key !== "isPlatformUser") {
        user[key] = updates[key];
      }
    });

    await user.save({ session });

    // Commit transaction
    await session.commitTransaction();

    // Emit Socket.IO event AFTER commit
    emitToRooms(
      "user:updated",
      {
        userId: user._id,
        organizationId: user.organization,
        departmentId: user.department,
      },
      [
        `organization:${user.organization}`,
        `department:${user.department}`,
        `user:${user._id}`,
      ]
    );

    // Fetch populated user
    const populatedUser = await User.findById(user._id)
      .populate("organization", "name email")
      .populate("department", "name")
      .select("-password -passwordResetToken -passwordResetExpires")
      .lean();

    okResponse(res, "User updated successfully", populatedUser);
  } catch (error) {
    await session.abortTransaction();
    logger.error("Update User Error:", error);

    if (error.code === 11000) {
      throw CustomError.conflict(
        "User with this email or employee ID already exists"
      );
    }
    throw error;
  } finally {
    session.endSession();
  }
});

/**
 * Update own profile
 * PUT /api/users/:userId/profile
 * Protected route (authorize User update own)
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { userId } = req.params;

    // Verify user is updating their own profile
    if (userId !== req.user._id.toString()) {
      throw CustomError.authorization("You can only update your own profile");
    }

    const user = await User.findById(userId).session(session);

    if (!user) {
      throw CustomError.notFound("User not found");
    }

    // Allowed fields for profile update
    const allowedFields = [
      "firstName",
      "lastName",
      "position",
      "skills",
      "profilePicture",
      "emailPreferences",
      "dateOfBirth",
      "password",
    ];

    // Apply updates only for allowed fields
    Object.keys(req.body).forEach((key) => {
      if (allowedFields.includes(key)) {
        user[key] = req.body[key];
      }
    });

    await user.save({ session });

    // Commit transaction
    await session.commitTransaction();

    // Emit Socket.IO event AFTER commit
    emitToRooms("user:updated", {
      userId: user._id,
      organizationId: user.organization,
      departmentId: user.department,
    }, [`user:${user._id}`]);

    // Fetch populated user
    const populatedUser = await User.findById(user._id)
      .populate("organization", "name email")
      .populate("department", "name")
      .select("-password -passwordResetToken -passwordResetExpires")
      .lean();

    okResponse(res, "Profile updated successfully", populatedUser);
  } catch (error) {
    await session.abortTransaction();
    logger.error("Update Profile Error:", error);
    throw error;
  } finally {
    session.endSession();
  }
});

/**
 * Get current user's account information
 * GET /api/users/:userId/account
 * Protected route (authorize User read own)
 */
export const getAccount = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // Verify user is accessing their own account
  if (userId !== req.user._id.toString()) {
    throw CustomError.authorization("You can only access your own account");
  }

  const user = await User.findById(userId)
    .populate("organization", "name email phone address industry logoUrl")
    .populate("department", "name description")
    .select("-password -passwordResetToken -passwordResetExpires")
    .lean();

  if (!user) {
    throw CustomError.notFound("User not found");
  }

  okResponse(res, "Account information retrieved successfully", user);
});

/**
 * Get current user's profile and dashboard data
 * GET /api/users/:userId/profile
 * Protected route (authorize User read own)
 */
export const getProfile = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // Verify user is accessing their own profile
  if (userId !== req.user._id.toString()) {
    throw CustomError.authorization("You can only access your own profile");
  }

  const user = await User.findById(userId)
    .populate("organization", "name")
    .populate("department", "name")
    .select("-password -passwordResetToken -passwordResetExpires")
    .lean();

  if (!user) {
    throw CustomError.notFound("User not found");
  }

  // Get dashboard stats
  const taskStats = await BaseTask.aggregate([
    {
      $match: {
        $or: [
          { createdBy: mongoose.Types.ObjectId.createFromHexString(userId) },
          { watchers: mongoose.Types.ObjectId.createFromHexString(userId) },
        ],
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  okResponse(res, "Profile retrieved successfully", {
    user,
    stats: {
      tasks: taskStats,
    },
  });
});

/**
 * Soft delete user with cascade
 * DELETE /api/users/:userId
 * Protected route (authorize User delete)
 */
export const deleteUser = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .withDeleted()
      .session(session);

    if (!user) {
      throw CustomError.notFound("User not found");
    }

    // Organization scoping
    if (
      user.organization.toString() !== req.user.organization._id.toString()
    ) {
      throw CustomError.authorization("You are not authorized to delete this user");
    }

    // Idempotent: Skip if already deleted
    if (user.isDeleted) {
      await session.abortTransaction();
      return okResponse(res, "User is already deleted", { userId: user._id });
    }

    // Prevent last SuperAdmin deletion
    if (user.role === USER_ROLES.SUPER_ADMIN) {
      const superAdminCount = await User.countDocuments({
        organization: user.organization,
        role: USER_ROLES.SUPER_ADMIN,
        isDeleted: false,
      }).session(session);

      if (superAdminCount <= 1) {
        throw CustomError.validation(
          "Cannot delete the last SuperAdmin in the organization"
        );
      }
    }

    // Check if user is HOD
    const department = await Department.findOne({
      _id: user.department,
      hod: user._id,
    }).session(session);

    if (department) {
      // Nullify department.hod
      department.hod = null;
      await department.save({ session });

      // Emit HOD pruned event
      emitToRooms(
        "department:hod_pruned",
        {
          departmentId: department._id,
          userId: user._id,
          reason: "User deleted",
        },
        [`department:${department._id}`]
      );
    }

    // Soft delete user
    await user.softDelete(req.user._id, { session });

    // Cascade delete: Remove from weak refs and cascade to created resources
    await User.cascadeDelete(user._id, req.user._id, { session });

    // Commit transaction
    await session.commitTransaction();

    // Emit Socket.IO event AFTER commit
    emitToRooms(
      "user:deleted",
      {
        userId: user._id,
        organizationId: user.organization,
        departmentId: user.department,
      },
      [
        `organization:${user.organization}`,
        `department:${user.department}`,
      ]
    );

    successResponse(res, 200, "User deleted successfully", {
      userId: user._id,
    });
  } catch (error) {
    await session.abortTransaction();
    logger.error("Delete User Error:", error);
    throw error;
  } finally {
    session.endSession();
  }
});

/**
 * Restore soft-deleted user
 * PATCH /api/users/:userId/restore
 * Protected route (authorize User update for restore)
 */
export const restoreUser = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .withDeleted()
      .session(session);

    if (!user) {
      throw CustomError.notFound("User not found");
    }

    // Organization scoping
    if (
      user.organization.toString() !== req.user.organization._id.toString()
    ) {
      throw CustomError.authorization(
        "You are not authorized to restore this user"
      );
    }

    // Check if already active
    if (!user.isDeleted) {
      await session.abortTransaction();
      return okResponse(res, "User is already active", { userId: user._id });
    }

    // Strict parent check: organization must be active
    const organization = await Organization.findById(user.organization)
      .withDeleted()
      .session(session);

    if (!organization || organization.isDeleted) {
      throw CustomError.validation(
        "Cannot restore user. Parent organization is deleted or missing."
      );
    }

    // Strict parent check: department must be active
    const department = await Department.findById(user.department)
      .withDeleted()
      .session(session);

    if (!department || department.isDeleted) {
      throw CustomError.validation(
        "Cannot restore user. Parent department is deleted or missing."
      );
    }

    // Restore user
    await user.restore(req.user._id, { session });

    // Commit transaction
    await session.commitTransaction();

    // Emit Socket.IO event AFTER commit
    emitToRooms(
      "user:restored",
      {
        userId: user._id,
        organizationId: user.organization,
        departmentId: user.department,
      },
      [
        `organization:${user.organization}`,
        `department:${user.department}`,
      ]
    );

    // Fetch populated user
    const populatedUser = await User.findById(user._id)
      .populate("organization", "name email")
      .populate("department", "name")
      .select("-password -passwordResetToken -passwordResetExpires")
      .lean();

    successResponse(res, 200, "User restored successfully", populatedUser);
  } catch (error) {
    await session.abortTransaction();
    logger.error("Restore User Error:", error);
    throw error;
  } finally {
    session.endSession();
  }
});
