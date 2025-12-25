import mongoose from "mongoose";
import asyncHandler from "express-async-handler";
import { Department, User, Organization } from "../models/index.js";
import CustomError from "../errorHandler/CustomError.js";
import { emitToRooms } from "../utils/socketEmitter.js";
import { PAGINATION } from "../utils/constants.js";
import logger from "../utils/logger.js";
import {
  createdResponse,
  okResponse,
  paginatedResponse,
  successResponse,
} from "../utils/responseTransform.js";

/**
 * Department Controllers
 *
 * CRITICAL: All write operations use MongoDB transactions
 * CRITICAL: Socket.IO events emitted AFTER transaction commit
 * CRITICAL: Organization scoping for Customer SuperAdmin/Admin
 * CRITICAL: Cascade delete/restore follows docs/softDelete-doc.md policy
 */

/**
 * Get all departments with pagination and filters
 * GET /api/departments
 * Protected route (authorize Department read)
 */
export const getDepartments = asyncHandler(async (req, res) => {
  const user = req.user;
  const allowedScopes = req.allowedScopes;

  // Extract query parameters
  const {
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
    sortBy = PAGINATION.DEFAULT_SORT_BY,
    sortOrder = PAGINATION.DEFAULT_SORT_ORDER,
    search,
    deleted,
  } = req.query;

  // Build query
  let query = {};

  // Organization scoping
  // Customer SuperAdmin/Admin can only see departments in their organization
  query.organization = user.organization._id;

  // Search filter (name, description)
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  // Deleted filter
  if (deleted === "true") {
    query.isDeleted = true;
  } else if (deleted === "false") {
    query.isDeleted = false;
  }
  // If deleted is not specified, default behavior excludes soft-deleted (via plugin)

  // Pagination options
  const options = {
    page: parseInt(page, 10),
    limit: Math.min(parseInt(limit, 10), PAGINATION.MAX_LIMIT),
    sort: { [sortBy]: sortOrder === "asc" ? 1 : -1 },
    populate: [
      { path: "organization", select: "name email" },
      { path: "hod", select: "firstName lastName email role" },
      { path: "createdBy", select: "firstName lastName email" },
    ],
    lean: true,
    leanWithId: false,
  };

  // Use withDeleted() if we want to include deleted records
  let queryBuilder =
    deleted === "true"
      ? Department.find(query).withDeleted()
      : Department.find(query);

  const departments = await Department.paginate(queryBuilder, options);

  logger.info({
    message: "Departments retrieved successfully",
    userId: user._id,
    organizationId: user.organization._id,
    count: departments.docs.length,
    total: departments.totalDocs,
  });

  paginatedResponse(
    res,
    200,
    "Departments retrieved successfully",
    departments.docs,
    {
      total: departments.totalDocs,
      page: departments.page,
      limit: departments.limit,
      totalPages: departments.totalPages,
      hasNextPage: departments.hasNextPage,
      hasPrevPage: departments.hasPrevPage,
    }
  );
});

/**
 * Get single department by ID
 * GET /api/departments/:resourceId
 * Protected route (authorize Department read)
 */
export const getDepartment = asyncHandler(async (req, res) => {
  const user = req.user;
  const { resourceId } = req.params;

  // Find department (use withDeleted to allow viewing soft-deleted departments)
  const department = await Department.findById(resourceId)
    .withDeleted()
    .populate("organization", "name email")
    .populate("hod", "firstName lastName email role")
    .populate("createdBy", "firstName lastName email")
    .lean();

  if (!department) {
    throw CustomError.notFound("Department not found");
  }

  // Check organization access
  if (
    department.organization._id.toString() !== user.organization._id.toString()
  ) {
    throw CustomError.authorization(
      "You do not have permission to access this department"
    );
  }

  logger.info({
    message: "Department retrieved successfully",
    userId: user._id,
    departmentId: department._id,
  });

  okResponse(res, "Department retrieved successfully", department);
});

/**
 * Create new department
 * POST /api/departments
 * Protected route (authorize Department create)
 */
export const createDepartment = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = req.user;
    const { name, description, hod } = req.validated.body;

    // Create department
    const [department] = await Department.create(
      [
        {
          name,
          description,
          hod: hod || null,
          organization: user.organization._id,
          createdBy: user._id,
        },
      ],
      { session }
    );

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    // Populate references for response
    await department.populate([
      { path: "organization", select: "name email" },
      { path: "hod", select: "firstName lastName email role" },
      { path: "createdBy", select: "firstName lastName email" },
    ]);

    // Emit Socket.IO event AFTER transaction commit
    emitToRooms("department:created", department, [
      `organization:${department.organization._id}`,
      `department:${department._id}`,
    ]);

    logger.info({
      message: "Department created successfully",
      userId: user._id,
      departmentId: department._id,
      organizationId: user.organization._id,
    });

    createdResponse(res, "Department created successfully", department);
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    logger.error({
      message: "Create department failed",
      userId: req.user?._id,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
});

/**
 * Update department
 * PUT /api/departments/:resourceId
 * Protected route (authorize Department update)
 */
export const updateDepartment = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = req.user;
    const { resourceId } = req.params;
    const updateData = req.validated.body;

    // Find department
    const department = await Department.findById(resourceId).session(session);

    if (!department) {
      throw CustomError.notFound("Department not found");
    }

    // Check if department is soft-deleted
    if (department.isDeleted) {
      throw CustomError.validation(
        "Cannot update soft-deleted department. Restore it first."
      );
    }

    // Check organization access
    if (
      department.organization.toString() !== user.organization._id.toString()
    ) {
      throw CustomError.authorization(
        "You do not have permission to update this department"
      );
    }

    // Update fields
    Object.keys(updateData).forEach((key) => {
      department[key] = updateData[key];
    });

    await department.save({ session });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    // Populate references for response
    await department.populate([
      { path: "organization", select: "name email" },
      { path: "hod", select: "firstName lastName email role" },
      { path: "createdBy", select: "firstName lastName email" },
    ]);

    // Emit Socket.IO event AFTER transaction commit
    emitToRooms("department:updated", department, [
      `organization:${department.organization}`,
      `department:${department._id}`,
    ]);

    logger.info({
      message: "Department updated successfully",
      userId: user._id,
      departmentId: department._id,
    });

    okResponse(res, "Department updated successfully", department);
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    logger.error({
      message: "Update department failed",
      userId: req.user?._id,
      departmentId: req.params.resourceId,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
});

/**
 * Soft delete department with cascade
 * DELETE /api/departments/:resourceId
 * Protected route (authorize Department delete)
 */
export const deleteDepartment = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = req.user;
    const { resourceId } = req.params;

    // Find department
    const department = await Department.findById(resourceId).session(session);

    if (!department) {
      throw CustomError.notFound("Department not found");
    }

    // Check if already deleted (idempotent per docs/softDelete-doc.md)
    if (department.isDeleted) {
      throw CustomError.validation("Department is already deleted");
    }

    // Check organization access
    if (
      department.organization.toString() !== user.organization._id.toString()
    ) {
      throw CustomError.authorization(
        "You do not have permission to delete this department"
      );
    }

    // Check if this is the last HOD in the department
    // This prevents deletion of the last HOD
    if (department.hod) {
      const hodCount = await User.countDocuments({
        department: department._id,
        isHod: true,
        isDeleted: false,
      }).session(session);

      if (hodCount === 1) {
        throw CustomError.authorization(
          "Cannot delete department with the last HOD. Assign another HOD first."
        );
      }
    }

    // Soft delete department (idempotent - plugin handles this)
    await department.softDelete(user._id, { session });

    // Cascade delete to all children
    await Department.cascadeDelete(department._id, user._id, { session });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    // Emit Socket.IO event AFTER transaction commit
    emitToRooms("department:deleted", { _id: department._id }, [
      `organization:${department.organization}`,
      `department:${department._id}`,
    ]);

    logger.info({
      message: "Department deleted successfully with cascade",
      userId: user._id,
      departmentId: department._id,
    });

    successResponse(res, 200, "Department deleted successfully", {
      _id: department._id,
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    logger.error({
      message: "Delete department failed",
      userId: req.user?._id,
      departmentId: req.params.resourceId,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
});

/**
 * Restore soft-deleted department
 * PATCH /api/departments/:resourceId/restore
 * Protected route (authorize Department update for restore)
 */
export const restoreDepartment = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = req.user;
    const { resourceId } = req.params;

    // Find department (including soft-deleted)
    const department = await Department.findById(resourceId)
      .withDeleted()
      .session(session);

    if (!department) {
      throw CustomError.notFound("Department not found");
    }

    // Check if not deleted
    if (!department.isDeleted) {
      throw CustomError.validation("Department is not deleted");
    }

    // Check organization access
    if (
      department.organization.toString() !== user.organization._id.toString()
    ) {
      throw CustomError.authorization(
        "You do not have permission to restore this department"
      );
    }

    // Strict parent check: organization must be active (per docs/softDelete-doc.md)
    const organization = await Organization.findById(department.organization)
      .withDeleted()
      .session(session);

    if (!organization) {
      throw CustomError.validation(
        "Cannot restore department: organization not found",
        { errorCode: "RESTORE_BLOCKED_PARENT_DELETED" }
      );
    }

    if (organization.isDeleted) {
      throw CustomError.validation(
        "Cannot restore department: organization is deleted",
        { errorCode: "RESTORE_BLOCKED_PARENT_DELETED" }
      );
    }

    // Non-blocking repair: If hod is invalid, set to null (per docs/softDelete-doc.md)
    if (department.hod) {
      const hod = await User.findById(department.hod)
        .withDeleted()
        .session(session);

      if (
        !hod ||
        hod.isDeleted ||
        hod.organization.toString() !== department.organization.toString() ||
        !hod.isHod
      ) {
        department.hod = null;
        logger.warn({
          message: "Department HOD pruned during restore (invalid reference)",
          departmentId: department._id,
          hodId: department.hod,
          event: "DEPT_HOD_PRUNED",
        });
      }
    }

    // Restore department
    await department.restore(user._id, { session });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    // Populate references for response
    await department.populate([
      { path: "organization", select: "name email" },
      { path: "hod", select: "firstName lastName email role" },
      { path: "createdBy", select: "firstName lastName email" },
    ]);

    // Emit Socket.IO event AFTER transaction commit
    emitToRooms("department:restored", department, [
      `organization:${department.organization._id}`,
      `department:${department._id}`,
    ]);

    logger.info({
      message:
        "Department restored successfully (children NOT auto-restored per policy)",
      userId: user._id,
      departmentId: department._id,
    });

    successResponse(
      res,
      200,
      "Department restored successfully. Note: Child resources (users, tasks, materials) must be restored separately.",
      department
    );
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    logger.error({
      message: "Restore department failed",
      userId: req.user?._id,
      departmentId: req.params.resourceId,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
});
