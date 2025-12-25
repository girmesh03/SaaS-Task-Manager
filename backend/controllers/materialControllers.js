import mongoose from "mongoose";
import asyncHandler from "express-async-handler";
import { Material, Department, Organization } from "../models/index.js";
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
 * Material Controllers
 *
 * CRITICAL: Department-scoped resource
 * CRITICAL: All write operations use MongoDB transactions
 * CRITICAL: Socket.IO events emitted AFTER transaction commit
 */

export const getMaterials = asyncHandler(async (req, res) => {
  const {
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
    search,
    category,
    department,
    deleted = "false",
  } = req.query;

  const filter = { organization: req.user.organization._id };

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  if (category) filter.category = category;
  if (department) filter.department = department;

  let query = Material.find(filter);
  if (deleted === "true") query = query.withDeleted();
  else if (deleted === "only") query = query.onlyDeleted();

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort: { createdAt: -1 },
    populate: [
      { path: "department", select: "name" },
      { path: "organization", select: "name" },
      { path: "addedBy", select: "firstName lastName" },
    ],
  };

  const materials = await Material.paginate(query, options);

  paginatedResponse(res, 200, "Materials retrieved successfully", materials.docs, {
    total: materials.totalDocs,
    page: materials.page,
    limit: materials.limit,
    totalPages: materials.totalPages,
    hasNextPage: materials.hasNextPage,
    hasPrevPage: materials.hasPrevPage,
  });
});

export const getMaterial = asyncHandler(async (req, res) => {
  const { resourceId } = req.params;

  const material = await Material.findById(resourceId)
    .populate("department", "name")
    .populate("organization", "name")
    .populate("addedBy", "firstName lastName")
    .lean();

  if (!material) throw CustomError.notFound("Material not found");

  if (
    material.organization._id.toString() !== req.user.organization._id.toString()
  ) {
    throw CustomError.authorization("You are not authorized to view this material");
  }

  okResponse(res, "Material retrieved successfully", material);
});

export const createMaterial = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { name, description, category, unitType, price, department } = req.body;

    const materialData = {
      name,
      description,
      category,
      unitType,
      price,
      department,
      organization: req.user.organization._id,
      addedBy: req.user._id,
    };

    const [material] = await Material.create([materialData], { session });
    await session.commitTransaction();

    emitToRooms(
      [
        `organization:${material.organization}`,
        `department:${material.department}`,
      ],
      "material:created",
      {
        materialId: material._id,
        organizationId: material.organization,
        departmentId: material.department,
      }
    );

    const populatedMaterial = await Material.findById(material._id)
      .populate("department", "name")
      .populate("organization", "name")
      .populate("addedBy", "firstName lastName")
      .lean();

    createdResponse(res, "Material created successfully", populatedMaterial);
  } catch (error) {
    await session.abortTransaction();
    logger.error("Create Material Error:", error);
    throw error;
  } finally {
    session.endSession();
  }
});

export const updateMaterial = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { resourceId } = req.params;
    const updates = req.body;

    const material = await Material.findById(resourceId).session(session);
    if (!material) {
      throw CustomError.notFound("Material not found");
    }

    if (
      material.organization.toString() !== req.user.organization._id.toString()
    ) {
      throw CustomError.authorization(
        "You are not authorized to update this material"
      );
    }

    Object.keys(updates).forEach((key) => {
      if (key !== "organization" && key !== "addedBy") {
        material[key] = updates[key];
      }
    });

    await material.save({ session });
    await session.commitTransaction();

    emitToRooms(
      [
        `organization:${material.organization}`,
        `department:${material.department}`,
      ],
      "material:updated",
      {
        materialId: material._id,
        organizationId: material.organization,
        departmentId: material.department,
      }
    );

    const populatedMaterial = await Material.findById(material._id)
      .populate("department", "name")
      .populate("organization", "name")
      .populate("addedBy", "firstName lastName")
      .lean();

    okResponse(res, "Material updated successfully", populatedMaterial);
  } catch (error) {
    await session.abortTransaction();
    logger.error("Update Material Error:", error);
    throw error;
  } finally {
    session.endSession();
  }
});

export const deleteMaterial = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { resourceId } = req.params;

    const material = await Material.findById(resourceId)
      .withDeleted()
      .session(session);
    if (!material) {
      throw CustomError.notFound("Material not found");
    }

    if (
      material.organization.toString() !== req.user.organization._id.toString()
    ) {
      throw CustomError.authorization(
        "You are not authorized to delete this material"
      );
    }

    if (material.isDeleted) {
      await session.abortTransaction();
      return okResponse(res, "Material is already deleted", {
        materialId: material._id,
      });
    }

    await material.softDelete(req.user._id, { session });
    await session.commitTransaction();

    emitToRooms(
      [
        `organization:${material.organization}`,
        `department:${material.department}`,
      ],
      "material:deleted",
      {
        materialId: material._id,
        organizationId: material.organization,
        departmentId: material.department,
      }
    );

    successResponse(res, 200, "Material deleted successfully", {
      materialId: material._id,
    });
  } catch (error) {
    await session.abortTransaction();
    logger.error("Delete Material Error:", error);
    throw error;
  } finally {
    session.endSession();
  }
});

export const restoreMaterial = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { resourceId } = req.params;

    const material = await Material.findById(resourceId)
      .withDeleted()
      .session(session);
    if (!material) {
      throw CustomError.notFound("Material not found");
    }

    if (
      material.organization.toString() !== req.user.organization._id.toString()
    ) {
      throw CustomError.authorization(
        "You are not authorized to restore this material"
      );
    }

    if (!material.isDeleted) {
      await session.abortTransaction();
      return okResponse(res, "Material is already active", {
        materialId: material._id,
      });
    }

    const organization = await Organization.findById(material.organization)
      .withDeleted()
      .session(session);
    if (!organization || organization.isDeleted) {
      throw CustomError.validation(
        "Cannot restore material. Parent organization is deleted or missing."
      );
    }

    const department = await Department.findById(material.department)
      .withDeleted()
      .session(session);
    if (!department || department.isDeleted) {
      throw CustomError.validation(
        "Cannot restore material. Parent department is deleted or missing."
      );
    }

    await material.restore(req.user._id, { session });
    await session.commitTransaction();

    emitToRooms(
      [
        `organization:${material.organization}`,
        `department:${material.department}`,
      ],
      "material:restored",
      {
        materialId: material._id,
        organizationId: material.organization,
        departmentId: material.department,
      }
    );

    const populatedMaterial = await Material.findById(material._id)
      .populate("department", "name")
      .populate("organization", "name")
      .populate("addedBy", "firstName lastName")
      .lean();

    successResponse(res, 200, "Material restored successfully", populatedMaterial);
  } catch (error) {
    await session.abortTransaction();
    logger.error("Restore Material Error:", error);
    throw error;
  } finally {
    session.endSession();
  }
});
