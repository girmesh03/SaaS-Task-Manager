import mongoose from "mongoose";
import asyncHandler from "express-async-handler";
import { Vendor, Organization } from "../models/index.js";
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
 * Vendor Controllers
 *
 * CRITICAL: All write operations use MongoDB transactions
 * CRITICAL: Socket.IO events emitted AFTER transaction commit
 * CRITICAL: Organization scoping (NOT department scoped - vendors are org-level)
 *
 * CASCADE DELETE/RESTORE (per docs/softDelete-doc.md):
 *
 * PARENTS:
 * - Organization
 *
 * CHILDREN:
 * - None (Vendor has no owned children)
 *
 * WEAK REFERENCES:
 * - createdBy → User (audit, non-blocking)
 * - ProjectTask.vendor → Vendor (critical dependency for ProjectTask)
 *
 * CRITICAL DEPENDENCIES:
 * - None
 *
 * RESTORE PREREQUISITES:
 * - organization.isDeleted === false
 *
 * LINKING/UNLINKING:
 * - Vendor is referenced by ProjectTask (critical dependency)
 * - Deletion does NOT cascade to ProjectTasks
 * - Admin must reassign ProjectTasks before deletion or handle orphaned tasks
 *
 * DELETION CASCADE POLICY:
 * - deletionCascadePolicy.idempotent: true
 * - deletionCascadePolicy.scope: No children to cascade to
 * - Must warn about linked ProjectTasks
 *
 * RESTORE POLICY:
 * - restorePolicy.strictParentCheck: true (organization must be active)
 * - restorePolicy.topDown: true
 * - restorePolicy.childrenNotAutoRestored: N/A (no children)
 */

/**
 * Get all vendors with pagination and filters
 * GET /api/vendors
 * Protected route (authorize Vendor read)
 */
export const getVendors = asyncHandler(async (req, res) => {
  const {
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
    search,
    deleted = "false", // Show only active vendors by default
  } = req.validated.query;

  // Build filter query (organization scoped, NOT department)
  const filter = {
    organization: req.user.organization._id,
  };

  // Search by name, contact person, email, or phone
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { contactPerson: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }

  // Build query
  let query = Vendor.find(filter);

  // Include deleted vendors if requested
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
      { path: "organization", select: "name isPlatformOrg isDeleted" },
      { path: "createdBy", select: "firstName lastName" },
    ],
  };

  const vendors = await Vendor.paginate(query, options);

  paginatedResponse(res, 200, "Vendors retrieved successfully", vendors.docs, {
    total: vendors.totalDocs,
    page: vendors.page,
    limit: vendors.limit,
    totalPages: vendors.totalPages,
    hasNextPage: vendors.hasNextPage,
    hasPrevPage: vendors.hasPrevPage,
  });
});

/**
 * Get single vendor by ID
 * GET /api/vendors/:resourceId
 * Protected route (authorize Vendor read)
 */
export const getVendor = asyncHandler(async (req, res) => {
  const { vendorId } = req.validated.params;

  const vendor = await Vendor.findById(vendorId)
    .populate("organization", "name email isPlatformOrg isDeleted")
    .populate("createdBy", "firstName lastName")
    .lean();

  if (!vendor) {
    throw CustomError.notFound("Vendor", vendorId);
  }

  // Organization scoping
  if (
    vendor.organization._id.toString() !== req.user.organization._id.toString()
  ) {
    throw CustomError.authorization("You are not authorized to view this vendor");
  }

  // Get linked ProjectTasks count
  const ProjectTask = mongoose.model("ProjectTask");
  const linkedTasksCount = await ProjectTask.countDocuments({
    vendor: vendorId,
    isDeleted: false,
  });

  okResponse(res, "Vendor retrieved successfully", {
    ...vendor,
    linkedTasksCount,
  });
});

/**
 * Create new vendor
 * POST /api/vendors
 * Protected route (authorize Vendor create)
 *
 * CRITICAL: Emit Socket.IO event after transaction commit
 */
export const createVendor = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { name, description, contactPerson, email, phone, address } =
      req.validated.body;

    // Create vendor (organization is automatically set from req.user)
    const vendorData = {
      name,
      description,
      contactPerson,
      email,
      phone,
      address,
      organization: req.user.organization._id,
      createdBy: req.user._id,
    };

    const [vendor] = await Vendor.create([vendorData], { session });

    // Commit transaction
    await session.commitTransaction();

    // Emit Socket.IO event AFTER commit
    emitToRooms(
      "vendor:created",
      {
        vendorId: vendor._id,
        organizationId: vendor.organization,
      },
      [`organization:${vendor.organization}`]
    );

    // Fetch populated vendor
    const populatedVendor = await Vendor.findById(vendor._id)
      .populate("organization", "name isPlatformOrg isDeleted")
      .populate("createdBy", "firstName lastName")
      .lean();

    createdResponse(res, "Vendor created successfully", populatedVendor);
  } catch (error) {
    await session.abortTransaction();
    logger.error("Create Vendor Error:", error);

    if (error.code === 11000) {
      throw CustomError.conflict("Vendor with this name already exists");
    }
    throw error;
  } finally {
    session.endSession();
  }
});

/**
 * Update vendor
 * PUT /api/vendors/:resourceId
 * Protected route (authorize Vendor update)
 *
 * CRITICAL: Emit Socket.IO event after transaction commit
 */
export const updateVendor = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { vendorId } = req.validated.params;
    const updates = req.validated.body;

    const vendor = await Vendor.findById(vendorId).session(session);

    if (!vendor) {
      throw CustomError.notFound("Vendor", vendorId);
    }

    // Organization scoping
    if (
      vendor.organization.toString() !== req.user.organization._id.toString()
    ) {
      throw CustomError.authorization(
        "You are not authorized to update this vendor"
      );
    }

    // Apply updates
    Object.keys(updates).forEach((key) => {
      // Prevent updating immutable fields
      if (key !== "organization" && key !== "createdBy") {
        vendor[key] = updates[key];
      }
    });

    await vendor.save({ session });

    // Commit transaction
    await session.commitTransaction();

    // Emit Socket.IO event AFTER commit
    emitToRooms(
      "vendor:updated",
      {
        vendorId: vendor._id,
        organizationId: vendor.organization,
      },
      [`organization:${vendor.organization}`]
    );

    // Fetch populated vendor
    const populatedVendor = await Vendor.findById(vendor._id)
      .populate("organization", "name isPlatformOrg isDeleted")
      .populate("createdBy", "firstName lastName")
      .lean();

    okResponse(res, "Vendor updated successfully", populatedVendor);
  } catch (error) {
    await session.abortTransaction();
    logger.error("Update Vendor Error:", error);

    if (error.code === 11000) {
      throw CustomError.conflict("Vendor with this name already exists");
    }
    throw error;
  } finally {
    session.endSession();
  }
});

/**
 * Soft delete vendor
 * DELETE /api/vendors/:resourceId
 * Protected route (authorize Vendor delete)
 *
 * CRITICAL: Warn about linked ProjectTasks (vendor deletion does NOT cascade to tasks)
 * CRITICAL: Admin must handle ProjectTask reassignment
 * CRITICAL: Emit Socket.IO event after transaction commit
 *
 * Implements cascade deletion per docs/softDelete-doc.md:
 * - Idempotent: Skip if already deleted, preserve original deletedBy/deletedAt
 * - No children to cascade (Vendor has no owned children)
 * - Check for linked ProjectTasks and warn
 * - Transaction: All operations in single transaction
 */
export const deleteVendor = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { vendorId } = req.validated.params;

    const vendor = await Vendor.findById(vendorId)
      .withDeleted()
      .session(session);

    if (!vendor) {
      throw CustomError.notFound("Vendor", vendorId);
    }

    // Organization scoping
    if (
      vendor.organization.toString() !== req.user.organization._id.toString()
    ) {
      throw CustomError.authorization(
        "You are not authorized to delete this vendor"
      );
    }

    // Idempotent: Skip if already deleted
    if (vendor.isDeleted) {
      await session.abortTransaction();
      return okResponse(res, "Vendor is already deleted", {
        vendorId: vendor._id,
      });
    }

    // Check for linked ProjectTasks
    const ProjectTask = mongoose.model("ProjectTask");
    const linkedTasks = await ProjectTask.find({
      vendor: vendorId,
      isDeleted: false,
    })
      .session(session)
      .select("_id")
      .lean();

    if (linkedTasks.length > 0) {
      throw CustomError.validation(
        `Cannot delete vendor. ${linkedTasks.length} active ProjectTask(s) are linked to this vendor. Please reassign or complete these tasks first.`,
        {
          linkedTasksCount: linkedTasks.length,
          linkedTaskIds: linkedTasks.map((t) => t._id),
        }
      );
    }

    // Soft delete vendor
    await vendor.softDelete(req.user._id, { session });

    // Commit transaction
    await session.commitTransaction();

    // Emit Socket.IO event AFTER commit
    emitToRooms(
      "vendor:deleted",
      {
        vendorId: vendor._id,
        organizationId: vendor.organization,
      },
      [`organization:${vendor.organization}`]
    );

    successResponse(res, 200, "Vendor deleted successfully", {
      vendorId: vendor._id,
    });
  } catch (error) {
    await session.abortTransaction();
    logger.error("Delete Vendor Error:", error);
    throw error;
  } finally {
    session.endSession();
  }
});

/**
 * Restore soft-deleted vendor
 * PATCH /api/vendors/:resourceId/restore
 * Protected route (authorize Vendor update for restore)
 *
 * Implements restoration per docs/softDelete-doc.md:
 * - Strict mode: Parent integrity check (organization must be active)
 * - No critical dependencies to validate
 * - No weak refs to prune
 * - No children to auto-restore (Vendor has no owned children)
 * - Restore prerequisites: organization.isDeleted === false
 */
export const restoreVendor = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { vendorId } = req.validated.params;

    const vendor = await Vendor.findById(vendorId)
      .withDeleted()
      .session(session);

    if (!vendor) {
      throw CustomError.notFound("Vendor", vendorId);
    }

    // Organization scoping
    if (
      vendor.organization.toString() !== req.user.organization._id.toString()
    ) {
      throw CustomError.authorization(
        "You are not authorized to restore this vendor"
      );
    }

    // Check if already active
    if (!vendor.isDeleted) {
      await session.abortTransaction();
      return okResponse(res, "Vendor is already active", {
        vendorId: vendor._id,
      });
    }

    // Restore vendor (idempotent - plugin handles this, including hooks for parent checks)
    await vendor.restore(req.user._id, { session });

    // Commit transaction
    await session.commitTransaction();

    // Emit Socket.IO event AFTER commit
    emitToRooms(
      "vendor:restored",
      {
        vendorId: vendor._id,
        organizationId: vendor.organization,
      },
      [`organization:${vendor.organization}`]
    );

    // Fetch populated vendor
    const populatedVendor = await Vendor.findById(vendor._id)
      .populate("organization", "name isPlatformOrg isDeleted")
      .populate("createdBy", "firstName lastName")
      .lean();

    successResponse(res, 200, "Vendor restored successfully", populatedVendor);
  } catch (error) {
    await session.abortTransaction();
    logger.error("Restore Vendor Error:", error);
    throw error;
  } finally {
    session.endSession();
  }
});
