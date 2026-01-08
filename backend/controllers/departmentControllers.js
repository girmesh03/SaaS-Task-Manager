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
 */

export const getDepartments = asyncHandler(async (req, res) => {
  const user = req.user;
  const {
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
    sortBy = PAGINATION.DEFAULT_SORT_BY,
    sortOrder = PAGINATION.DEFAULT_SORT_ORDER,
    search,
    deleted,
  } = req.validated.query;

  let query = { organization: user.organization._id };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  if (deleted === "true") {
    query.isDeleted = true;
  } else if (deleted === "false") {
    query.isDeleted = false;
  }

  const options = {
    page: parseInt(page, 10),
    limit: Math.min(parseInt(limit, 10), PAGINATION.MAX_LIMIT),
    sort: { [sortBy]: sortOrder === "asc" ? 1 : -1 },
    populate: [
      {
        path: "organization",
        select:
          "_id name email industry logo isPlatformOrg isDeleted",
      },
      {
        path: "hod",
        select:
          "_id fullName firstName lastName position role email profilePicture isPlatformUser isHod lastLogin isDeleted",
      },
      {
        path: "createdBy",
        select:
          "_id fullName firstName lastName position role email profilePicture isPlatformUser isHod lastLogin isDeleted",
      },
    ],
    lean: true,
  };

  let queryBuilder = deleted === "true"
    ? Department.find(query).withDeleted()
    : Department.find(query);

  const departments = await Department.paginate(queryBuilder, options);

  paginatedResponse(res, 200, "Departments retrieved successfully", departments.docs, {
    total: departments.totalDocs,
    page: departments.page,
    limit: departments.limit,
    totalPages: departments.totalPages,
    hasNextPage: departments.hasNextPage,
    hasPrevPage: departments.hasPrevPage,
  });
});

export const getDepartment = asyncHandler(async (req, res) => {
  const user = req.user;
  const { departmentId } = req.validated.params;

  const department = await Department.findById(departmentId)
    .withDeleted()
    .populate(
      "organization",
      "_id name email industry logo isPlatformOrg isDeleted"
    )
    .populate(
      "hod",
      "_id fullName firstName lastName position role email profilePicture isPlatformUser isHod lastLogin isDeleted"
    )
    .populate(
      "createdBy",
      "_id fullName firstName lastName position role email profilePicture isPlatformUser isHod lastLogin isDeleted"
    )
    .lean();

  if (!department) throw CustomError.notFound("Department", departmentId);

  if (department.organization._id.toString() !== user.organization._id.toString()) {
    throw CustomError.authorization("You do not have permission to access this department");
  }

  okResponse(res, "Department retrieved successfully", department);
});

export const createDepartment = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = req.user;
    const { name, description, hodId } = req.validated.body;

    const [department] = await Department.create(
      [{ name, description, hod: hodId || null, organization: user.organization._id, createdBy: user._id }],
      { session }
    );

    if (hodId) {
      await User.findByIdAndUpdate(hodId, { isHod: true }).session(session);
    }

    await session.commitTransaction();

    await department.populate([
      {
        path: "organization",
        select:
          "_id name email industry logo isPlatformOrg isDeleted",
      },
      {
        path: "hod",
        select:
          "_id fullName firstName lastName position role email profilePicture isPlatformUser isHod lastLogin isDeleted",
      },
      {
        path: "createdBy",
        select:
          "_id fullName firstName lastName position role email profilePicture isPlatformUser isHod lastLogin isDeleted",
      },
    ]);

    emitToRooms("department:created", department, [
      `organization:${department.organization._id}`,
      `department:${department._id}`,
    ]);

    createdResponse(res, "Department created successfully", department);
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

export const updateDepartment = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = req.user;
    const { departmentId } = req.validated.params;
    const { hodId, ...otherUpdates } = req.validated.body;

    const department = await Department.findById(departmentId).session(session);
    if (!department) throw CustomError.notFound("Department", departmentId);

    if (department.isDeleted) {
      throw CustomError.validation("Cannot update soft-deleted department. Restore it first.");
    }

    if (department.organization.toString() !== user.organization._id.toString()) {
      throw CustomError.authorization("You do not have permission to update this department");
    }

    if (hodId !== undefined && hodId !== (department.hod ? department.hod.toString() : null)) {
      if (department.hod) await User.findByIdAndUpdate(department.hod, { isHod: false }).session(session);
      if (hodId) await User.findByIdAndUpdate(hodId, { isHod: true }).session(session);
      department.hod = hodId;
    }

    Object.keys(otherUpdates).forEach((key) => { department[key] = otherUpdates[key]; });
    await department.save({ session });

    await session.commitTransaction();

    await department.populate([
      {
        path: "organization",
        select:
          "_id name email industry logo isPlatformOrg isDeleted",
      },
      {
        path: "hod",
        select:
          "_id fullName firstName lastName position role email profilePicture isPlatformUser isHod lastLogin isDeleted",
      },
      {
        path: "createdBy",
        select:
          "_id fullName firstName lastName position role email profilePicture isPlatformUser isHod lastLogin isDeleted",
      },
    ]);

    emitToRooms("department:updated", department, [
      `organization:${department.organization}`,
      `department:${department._id}`,
    ]);

    okResponse(res, "Department updated successfully", department);
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

export const deleteDepartment = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = req.user;
    const { departmentId } = req.validated.params;

    const department = await Department.findById(departmentId).session(session);
    if (!department) throw CustomError.notFound("Department", departmentId);

    if (department.isDeleted) throw CustomError.validation("Department is already deleted");

    if (department.organization.toString() !== user.organization._id.toString()) {
      throw CustomError.authorization("You do not have permission to delete this department");
    }

    if (department.hod) {
      const hodCount = await User.countDocuments({
        department: department._id,
        isHod: true,
        isDeleted: false,
      }).session(session);

      if (hodCount === 1) {
        throw CustomError.authorization("Cannot delete department with the last HOD. Assign another HOD first.");
      }
    }

    await department.softDelete(user._id, { session });
    await session.commitTransaction();

    // Re-fetch to return populate object (optional, but good for "most fields")
    const deletedDepartment = await Department.findById(departmentId).withDeleted().lean();

    emitToRooms("department:deleted", { _id: department._id }, [
      `organization:${department.organization}`,
      `department:${department._id}`,
    ]);

    successResponse(res, 200, "Department deleted successfully", deletedDepartment);
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

export const restoreDepartment = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = req.user;
    const { departmentId } = req.validated.params;

    const department = await Department.findById(departmentId).withDeleted().session(session);
    if (!department) throw CustomError.notFound("Department", departmentId);

    if (!department.isDeleted) throw CustomError.validation("Department is not deleted");

    if (department.organization.toString() !== user.organization._id.toString()) {
      throw CustomError.authorization("You do not have permission to restore this department");
    }

    await department.restore(user._id, { session });
    await session.commitTransaction();

    await department.populate([
      {
        path: "organization",
        select:
          "_id name email industry logo isPlatformOrg isDeleted",
      },
      {
        path: "hod",
        select:
          "_id fullName firstName lastName position role email profilePicture isPlatformUser isHod lastLogin isDeleted",
      },
      {
        path: "createdBy",
        select:
          "_id fullName firstName lastName position role email profilePicture isPlatformUser isHod lastLogin isDeleted",
      },
    ]);

    emitToRooms("department:restored", department, [
      `organization:${department.organization._id}`,
      `department:${department._id}`,
    ]);

    successResponse(res, 200, "Department restored successfully", department);
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});
