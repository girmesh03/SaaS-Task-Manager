import mongoose from "mongoose";
import { Organization } from "../models/index.js";
import CustomError from "../errorHandler/CustomError.js";
import { emitToRooms } from "../utils/socketEmitter.js";
import { PAGINATION } from "../utils/constants.js";
import logger from "../utils/logger.js";

/**
 * Organization Controllers
 *
 * CRITICAL: All write operations use MongoDB transactions
 * CRITICAL: Socket.IO events emitted AFTER transaction commit
 * CRITICAL: Platform organization CANNOT be deleted
 * CRITICAL: Platform SuperAdmin can access all organizations (crossOrg scope)
 * CRITICAL: Customer SuperAdmin/Admin can only access own organization
 * CRITICAL: Cascade delete/restore follows docs/softDelete-doc.md policy
 *
 * Cascade Policy for Organization (per docs/softDelete-doc.md):
 * ============================================================
 *
 * DELETION CASCADE:
 * - Parents: None (Organization is root)
 * - Owned Children: Department, User, Vendor, Material, Notification, and all tasks
 * - Cascade Order: Organization → Department → User → Tasks → Activities → Comments → Attachments → Materials → Vendors → Notifications
 * - Weak Refs: None (Organization is root)
 * - Critical Dependencies: None (Organization is root)
 * - Idempotent: Skip if already deleted, preserve original deletedBy/deletedAt
 * - Organization Boundary: All cascades scoped to organizationId
 * - Transaction: All operations in single transaction
 *
 * RESTORATION POLICY:
 * - Strict Mode: Parent integrity check (Organization is root, no parents to check)
 * - Critical Dependencies: None (Organization is root)
 * - Weak Refs: None (Organization is root)
 * - Non-blocking Repairs: None (Organization is root)
 * - Children: NOT auto-restored (top-down orchestration only, per docs/softDelete-doc.md)
 * - Restore Prerequisites: None (Organization is root)
 *
 * LINKING/UNLINKING:
 * - No weak refs to manage (Organization is root)
 * - Children maintain organization reference (not unlinked on delete)
 *
 * DELETION CASCADE POLICY:
 * - deletionCascadePolicy.idempotent: true
 * - deletionCascadePolicy.scope: All documents with organization == this._id
 * - deletionCascadePolicy.order: [Organization, Department, User, ProjectTask, RoutineTask, AssignedTask, TaskActivity, TaskComment, Attachment, Material, Vendor, Notification]
 *
 * RESTORE POLICY:
 * - restorePolicy.strictParentCheck: true (but Organization has no parents)
 * - restorePolicy.topDown: true
 * - restorePolicy.childrenNotAutoRestored: true
 */

/**
 * Get all organizations with pagination and filters
 * GET /api/organizations
 * Protected route (authorize Organization read)
 */
export const getOrganizations = async (req, res, next) => {
  try {
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
    } = req.query;

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

    res.status(200).json({
      success: true,
      message: "Organizations retrieved successfully",
      data: organizations.docs,
      pagination: {
        total: organizations.totalDocs,
        page: organizations.page,
        limit: organizations.limit,
        totalPages: organizations.totalPages,
        hasNextPage: organizations.hasNextPage,
        hasPrevPage: organizations.hasPrevPage,
      },
    });
  } catch (error) {
    logger.error({
      message: "Get organizations failed",
      userId: req.user?._id,
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

/**
 * Get single organization by ID
 * GET /api/organizations/:resourceId
 * Protected route (authorize Organization read)
 */
export const getOrganization = async (req, res, next) => {
  try {
    const user = req.user;
    const allowedScopes = req.allowedScopes;
    const { resourceId } = req.params;

    // Find organization (use withDeleted to allow viewing soft-deleted orgs)
    const organization = await Organization.findById(resourceId)
      .withDeleted()
      .lean();

    if (!organization) {
      throw CustomError.notFound("Organization not found");
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

    res.status(200).json({
      success: true,
      message: "Organization retrieved successfully",
      data: organization,
    });
  } catch (error) {
    logger.error({
      message: "Get organization failed",
      userId: req.user?._id,
      organizationId: req.params.resourceId,
      error: error.message,
    });
    next(error);
  }
};

/**
 * Update organization
 * PUT /api/organizations/:resourceId
 * Protected route (authorize Organization update)
 */
export const updateOrganization = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = req.user;
    const allowedScopes = req.allowedScopes;
    const { resourceId } = req.params;
    const updateData = req.validated.body;

    // Find organization
    const organization = await Organization.findById(resourceId).session(
      session
    );

    if (!organization) {
      throw CustomError.notFound("Organization not found");
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

    // Emit Socket.IO event
    emitToRooms("organization:updated", organization, [
      `organization:${organization._id}`,
    ]);

    logger.info({
      message: "Organization updated successfully",
      userId: user._id,
      organizationId: organization._id,
    });

    res.status(200).json({
      success: true,
      message: "Organization updated successfully",
      data: organization,
    });
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
    next(error);
  }
};

/**
 * Soft delete organization with cascade
 * DELETE /api/organizations/:resourceId
 * Protected route (authorize Organization delete)
 *
 * Implements cascade deletion per docs/softDelete-doc.md:
 * - Idempotent: Skip if already deleted, preserve original deletedBy/deletedAt
 * - Cascade order: Organization → Department → User → Tasks → Activities → Comments → Attachments → Materials → Vendors → Notifications
 * - Organization boundary: All cascades scoped to organizationId
 * - Transaction: All operations in single transaction
 * - Weak refs: None (Organization is root)
 */
export const deleteOrganization = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = req.user;
    const allowedScopes = req.allowedScopes;
    const { resourceId } = req.params;

    // Find organization
    const organization = await Organization.findById(resourceId).session(
      session
    );

    if (!organization) {
      throw CustomError.notFound("Organization not found");
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
    // Platform SuperAdmin with crossOrg can delete any organization
    // Others can only delete their own organization
    if (!allowedScopes.includes("crossOrg")) {
      if (organization._id.toString() !== user.organization._id.toString()) {
        throw CustomError.authorization(
          "You do not have permission to delete this organization"
        );
      }
    }

    // Soft delete organization (idempotent - plugin handles this)
    await organization.softDelete(user._id, { session });

    // Cascade delete to all children (per docs/softDelete-doc.md)
    // This follows the deletion order and organization boundary rules
    // Order: Organization → Department → User → Tasks → Activities → Comments → Attachments → Materials → Vendors → Notifications
    await Organization.cascadeDelete(organization._id, user._id, { session });

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

    res.status(200).json({
      success: true,
      message: "Organization deleted successfully",
      data: { _id: organization._id },
    });
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
    next(error);
  }
};

/**
 * Restore soft-deleted organization
 * PATCH /api/organizations/:resourceId/restore
 * Protected route (authorize Organization update for restore)
 *
 * Implements restoration per docs/softDelete-doc.md:
 * - Strict mode: Parent integrity check (Organization is root, no parents to check)
 * - Critical dependencies: None (Organization is root)
 * - Weak refs: None (Organization is root)
 * - Non-blocking repairs: None (Organization is root)
 * - Children: NOT auto-restored (top-down orchestration only)
 * - Restore prerequisites: None (Organization is root)
 */
export const restoreOrganization = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = req.user;
    const allowedScopes = req.allowedScopes;
    const { resourceId } = req.params;

    // Find organization (including soft-deleted)
    const organization = await Organization.findById(resourceId)
      .withDeleted()
      .session(session);

    if (!organization) {
      throw CustomError.notFound("Organization not found");
    }

    // Check if not deleted
    if (!organization.isDeleted) {
      throw CustomError.validation("Organization is not deleted");
    }

    // Check access based on scope
    // Platform SuperAdmin with crossOrg can restore any organization
    // Others can only restore their own organization
    if (!allowedScopes.includes("crossOrg")) {
      if (organization._id.toString() !== user.organization._id.toString()) {
        throw CustomError.authorization(
          "You do not have permission to restore this organization"
        );
      }
    }

    // Strict parent check: Organization is root, no parents to check (per docs/softDelete-doc.md)
    // Critical dependencies: None (Organization is root)
    // Weak refs: None (Organization is root)
    // Non-blocking repairs: None (Organization is root)

    // Restore organization
    await organization.restore(user._id, { session });

    // IMPORTANT: Children are NOT auto-restored (per docs/softDelete-doc.md)
    // Departments, Users, Tasks, etc. must be restored explicitly in top-down order
    // This is by design to allow selective restoration
    // restorePolicy.childrenNotAutoRestored: true

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

    res.status(200).json({
      success: true,
      message:
        "Organization restored successfully. Note: Child resources (departments, users, tasks) must be restored separately.",
      data: organization,
    });
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
    next(error);
  }
};
