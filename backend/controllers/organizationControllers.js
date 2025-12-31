import mongoose from "mongoose";
import asyncHandler from "express-async-handler";
import { Organization } from "../models/index.js";
import CustomError from "../errorHandler/CustomError.js";
import { emitToRooms } from "../utils/socketEmitter.js";
import { PAGINATION } from "../utils/constants.js";
import logger from "../utils/logger.js";
import {
  okResponse,
  paginatedResponse,
  successResponse,
} from "../utils/responseTransform.js";

/**
 * Organization Controllers
 *
 * CRITICAL: All write operations use MongoDB transactions
 * CRITICAL: Socket.IO events emitted AFTER transaction commit
 * CRITICAL: Platform organization CANNOT be deleted
 * CRITICAL: Platform SuperAdmin can access all organizations (crossOrg scope)
 * CRITICAL: Customer SuperAdmin/Admin can only access own organization
 * CRITICAL: Cascade delete/restore follows docs/softDelete-doc.md policy
 */

/**
 * Get all organizations with pagination and filters
 * GET /api/organizations
 * Protected route (authorize Organization read)
 */
export const getOrganizations = asyncHandler(async (req, res) => {
  const user = req.user;
  const allowedScopes = req.allowedScopes;

  // Extract query parameters
  const {
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
    sortBy = PAGINATION.DEFAULT_SORT_BY,
    sortOrder = PAGINATION.DEFAULT_SORT_ORDER,
    search,
    industry,
    deleted,
  } = req.validated.query;

  // Build query
  let query = {};

  // Scope filtering based on role
  // Platform SuperAdmin with crossOrg scope can see all organizations
  // Others can only see their own organization
  if (!allowedScopes.includes("crossOrg")) {
    query._id = user.organization._id;
  }

  // Search filter (name, email, phone)
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }

  // Industry filter
  if (industry) {
    query.industry = industry;
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
    lean: true,
    leanWithId: false,
    populate: [
      {
        path: "createdBy",
        select:
          "_id fullName firstName lastName position role email profilePicture isPlatformUser isHod lastLogin isDeleted",
      },
    ],
  };

  // Use withDeleted() if we want to include deleted records
  let queryBuilder =
    deleted === "true"
      ? Organization.find(query).withDeleted()
      : Organization.find(query);

  const organizations = await Organization.paginate(queryBuilder, options);

  logger.info({
    message: "Organizations retrieved successfully",
    userId: user._id,
    count: organizations.docs.length,
    total: organizations.totalDocs,
  });

  paginatedResponse(
    res,
    200,
    "Organizations retrieved successfully",
    organizations.docs,
    {
      total: organizations.totalDocs,
      page: organizations.page,
      limit: organizations.limit,
      totalPages: organizations.totalPages,
      hasNextPage: organizations.hasNextPage,
      hasPrevPage: organizations.hasPrevPage,
    }
  );
});

/**
 * Get single organization by ID
 * GET /api/organizations/:resourceId
 * Protected route (authorize Organization read)
 */
export const getOrganization = asyncHandler(async (req, res) => {
  const user = req.user;
  const allowedScopes = req.allowedScopes;
  const { organizationId } = req.validated.params;

  // Find organization (use withDeleted to allow viewing soft-deleted orgs)
  const organization = await Organization.findById(organizationId)
    .populate(
      "createdBy",
      "_id fullName firstName lastName position role email profilePicture isPlatformUser isHod lastLogin isDeleted"
    )
    .withDeleted()
    .lean();

  if (!organization) {
      throw CustomError.notFound("Organization", organizationId);
  }

  // Check access based on scope
  // Platform SuperAdmin with crossOrg can access any organization
  // Others can only access their own organization
  if (!allowedScopes.includes("crossOrg")) {
    if (organization._id.toString() !== user.organization._id.toString()) {
      throw CustomError.authorization(
        "You do not have permission to access this organization"
      );
    }
  }

  logger.info({
    message: "Organization retrieved successfully",
    userId: user._id,
    organizationId: organization._id,
  });

  okResponse(res, "Organization retrieved successfully", organization);
});

/**
 * Update organization
 * PUT /api/organizations/:resourceId
 * Protected route (authorize Organization update)
 */
export const updateOrganization = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = req.user;
    const allowedScopes = req.allowedScopes;
    const { organizationId } = req.validated.params;
    const updateData = req.validated.body;

    // Find organization
    const organization = await Organization.findById(organizationId).session(
      session
    );

    if (!organization) {
        throw CustomError.notFound("Organization", organizationId);
    }

    // Check if organization is soft-deleted
    if (organization.isDeleted) {
      throw CustomError.validation(
        "Cannot update soft-deleted organization. Restore it first."
      );
    }

    // Check access based on scope
    // Platform SuperAdmin with crossOrg can update any organization
    // Others can only update their own organization
    if (!allowedScopes.includes("crossOrg")) {
      if (organization._id.toString() !== user.organization._id.toString()) {
        throw CustomError.authorization(
          "You do not have permission to update this organization"
        );
      }
    }

    // Update fields
    Object.keys(updateData).forEach((key) => {
      if (key === "logo" && updateData.logo) {
        organization.logo = {
          url: updateData.logo.url || organization.logo?.url,
          publicId: updateData.logo.publicId || organization.logo?.publicId,
        };
      } else {
        organization[key] = updateData[key];
      }
    });

    await organization.save({ session });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    const populatedOrganization = await Organization.findById(organization._id)
      .populate(
        "createdBy",
        "_id fullName firstName lastName position role email profilePicture isPlatformUser isHod lastLogin isDeleted"
      )
      .session(session);

    // Emit Socket.IO event
    emitToRooms("organization:updated", populatedOrganization, [
      `organization:${organization._id}`,
    ]);

    logger.info({
      message: "Organization updated successfully",
      userId: user._id,
      organizationId: organization._id,
    });

    okResponse(res, "Organization updated successfully", populatedOrganization);
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    logger.error({
      message: "Update organization failed",
      userId: req.user?._id,
      organizationId: req.params.resourceId,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
});

/**
 * Soft delete organization with cascade
 * DELETE /api/organizations/:resourceId
 * Protected route (authorize Organization delete)
 */
export const deleteOrganization = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = req.user;
    const allowedScopes = req.allowedScopes;
    const { organizationId } = req.validated.params;

    // Find organization
    const organization = await Organization.findById(organizationId).session(
      session
    );

    if (!organization) {
        throw CustomError.notFound("Organization", organizationId);
    }

    // Check if already deleted (idempotent per docs/softDelete-doc.md)
    if (organization.isDeleted) {
      throw CustomError.validation("Organization is already deleted");
    }

    // CRITICAL: Prevent platform organization deletion
    if (organization.isPlatformOrg) {
      throw CustomError.authorization(
        "Platform organization cannot be deleted",
        {
          organizationId: organization._id,
          isPlatformOrg: true,
        }
      );
    }

    // Check access based on scope
    if (!allowedScopes.includes("crossOrg")) {
      if (organization._id.toString() !== user.organization._id.toString()) {
        throw CustomError.authorization(
          "You do not have permission to delete this organization"
        );
      }
    }

    // Soft delete organization (idempotent - plugin handles this and automatic cascade)
    await organization.softDelete(user._id, { session });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    // Emit Socket.IO event AFTER transaction commit
    emitToRooms("organization:deleted", { _id: organization._id }, [
      `organization:${organization._id}`,
    ]);

    logger.info({
      message: "Organization deleted successfully with cascade",
      userId: user._id,
      organizationId: organization._id,
    });

    const deletedOrganization = await Organization.findById(organizationId)
      .populate(
        "createdBy",
        "_id fullName firstName lastName position role email profilePicture isPlatformUser isHod lastLogin isDeleted"
      )
      .withDeleted()
      .lean();

    successResponse(res, 200, "Organization deleted successfully", deletedOrganization);
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    logger.error({
      message: "Delete organization failed",
      userId: req.user?._id,
      organizationId: req.params.resourceId,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
});

/**
 * Restore soft-deleted organization
 * PATCH /api/organizations/:resourceId/restore
 * Protected route (authorize Organization update for restore)
 */
export const restoreOrganization = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = req.user;
    const allowedScopes = req.allowedScopes;
    const { organizationId } = req.validated.params;

    // Find organization (including soft-deleted)
    const organization = await Organization.findById(organizationId)
      .populate(
        "createdBy",
        "_id fullName firstName lastName position role email profilePicture isPlatformUser isHod lastLogin isDeleted"
      )
      .withDeleted()
      .session(session);

    if (!organization) {
        throw CustomError.notFound("Organization", organizationId);
    }

    // Check if not deleted
    if (!organization.isDeleted) {
      throw CustomError.validation("Organization is not deleted");
    }

    // Check access based on scope
    if (!allowedScopes.includes("crossOrg")) {
      if (organization._id.toString() !== user.organization._id.toString()) {
        throw CustomError.authorization(
          "You do not have permission to restore this organization"
        );
      }
    }

    // Restore organization
    await organization.restore(user._id, { session });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    // Emit Socket.IO event AFTER transaction commit
    emitToRooms("organization:restored", organization, [
      `organization:${organization._id}`,
    ]);

    logger.info({
      message:
        "Organization restored successfully (children NOT auto-restored per policy)",
      userId: user._id,
      organizationId: organization._id,
    });

    successResponse(
      res,
      200,
      "Organization restored successfully. Note: Child resources (departments, users, tasks) must be restored separately.",
      organization
    );
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    logger.error({
      message: "Restore organization failed",
      userId: req.user?._id,
      organizationId: req.params.resourceId,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
});
