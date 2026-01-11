import mongoose from "mongoose";
import asyncHandler from "express-async-handler";
import {
  TaskActivity,
  BaseTask,
  Material,
  Organization,
  Department,
} from "../models/index.js";
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
import { transformMaterialsArray } from "../utils/materialTransform.js";

/**
 * TaskActivity Controllers
 *
 * CRITICAL: All write operations use MongoDB transactions
 * CRITICAL: Socket.IO events emitted AFTER transaction commit
 * CRITICAL: Parent validation (ProjectTask or AssignedTask)
 *
 * CASCADE DELETE/RESTORE (per docs/softDelete-doc.md):
 *
 * PARENTS:
 * - ProjectTask OR AssignedTask (polymorphic 'parent')
 *
 * CHILDREN:
 * - TaskComment (parent=TaskActivity)
 * - Attachment (parent=TaskActivity)
 */

export const getTaskActivities = asyncHandler(async (req, res) => {
  const {
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
    taskId,
    deleted = "false",
  } = req.validated.query;

  const filter = { organization: req.user.organization._id };

  // Filter by parent task if provided
  if (taskId) {
    filter.parent = taskId;
  }

  let query = TaskActivity.find(filter);

  if (deleted === "true") {
    query = query.withDeleted();
  } else if (deleted === "only") {
    query = query.onlyDeleted();
  }

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort: { createdAt: -1 },
    lean: true,
    populate: [
      {
        path: "createdBy",
        select:
          "_id fullName firstName lastName position role email profilePicture isPlatformUser isHod lastLogin isDeleted",
      },
      {
        path: "materials.material",
        select: "_id name unitType price description category",
      },
    ],
  };

  const activities = await TaskActivity.paginate(query, options);

  // Transform materials to friendly format
  const transformedDocs = activities.docs.map((doc) => ({
    ...doc,
    materials: transformMaterialsArray(doc.materials),
  }));

  paginatedResponse(
    res,
    200,
    "Task activities retrieved successfully",
    transformedDocs,
    {
      total: activities.totalDocs,
      page: activities.page,
      limit: activities.limit,
      totalPages: activities.totalPages,
      hasNextPage: activities.hasNextPage,
      hasPrevPage: activities.hasPrevPage,
    }
  );
});

export const getTaskActivity = asyncHandler(async (req, res) => {
  const { activityId } = req.validated.params;

  const activity = await TaskActivity.findById(activityId)
    .populate(
      "createdBy",
      "_id fullName firstName lastName position role email profilePicture isPlatformUser isHod lastLogin isDeleted"
    )
    .populate(
      "materials.material",
      "_id name unitType price description category"
    )
    .lean();

  if (!activity) {
    throw CustomError.notFound("TaskActivity", activityId);
  }

  // Organization scoping
  if (
    activity.organization.toString() !== req.user.organization._id.toString()
  ) {
    throw CustomError.authorization(
      "You are not authorized to view this activity"
    );
  }

  // Transform materials
  activity.materials = transformMaterialsArray(activity.materials);

  okResponse(res, "Task activity retrieved successfully", activity);
});

export const createTaskActivity = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { activity, taskId, materials } = req.validated.body;

    // Verify parent task exists and belongs to org
    const parentTask = await BaseTask.findById(taskId).session(session);
    if (!parentTask) {
      throw CustomError.validation("Parent task not found");
    }

    if (
      parentTask.organization.toString() !==
      req.user.organization._id.toString()
    ) {
      throw CustomError.authorization(
        "Parent task belongs to another organization"
      );
    }

    const activityData = {
      activity,
      parent: taskId,
      parentModel: parentTask.taskType,
      materials: materials
        ? materials.map((m) => ({
            material: m.materialId,
            quantity: m.quantity,
          }))
        : [],
      organization: req.user.organization._id,
      department: parentTask.department, // Inherit department from parent task
      createdBy: req.user._id,
    };

    const [newActivity] = await TaskActivity.create([activityData], {
      session,
    });

    await session.commitTransaction();

    emitToRooms(
      "task_activity:created",
      {
        activityId: newActivity._id,
        taskId: taskId,
        organizationId: newActivity.organization,
      },
      [
        `organization:${parentTask.organization}`,
        `department:${parentTask.department}`,
        `task:${taskId}`,
      ]
    );

    const populatedActivity = await TaskActivity.findById(newActivity._id)
      .populate(
        "createdBy",
        "_id fullName firstName lastName position role email profilePicture isPlatformUser isHod lastLogin isDeleted"
      )
      .populate(
        "materials.material",
        "_id name unitType price description category"
      )
      .lean();

    // Transform materials
    populatedActivity.materials = transformMaterialsArray(
      populatedActivity.materials
    );

    createdResponse(
      res,
      "Task activity created successfully",
      populatedActivity
    );
  } catch (error) {
    await session.abortTransaction();
    logger.error("Create Task Activity Error:", error);
    throw error;
  } finally {
    session.endSession();
  }
});

export const updateTaskActivity = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { activityId } = req.validated.params;
    const updates = req.validated.body;

    const activity = await TaskActivity.findById(activityId).session(session);

    if (!activity) {
      throw CustomError.notFound("TaskActivity", activityId);
    }

    if (
      activity.organization.toString() !== req.user.organization._id.toString()
    ) {
      throw CustomError.authorization(
        "You are not authorized to update this activity"
      );
    }

    // Apply updates
    if (updates.activity) activity.activity = updates.activity;
    if (updates.materials) {
      activity.materials = updates.materials.map((m) => ({
        material: m.materialId,
        quantity: m.quantity,
      }));
    }

    await activity.save({ session });

    await session.commitTransaction();

    emitToRooms(
      "task_activity:updated",
      { activityId: activity._id, taskId: activity.parent },
      [
        `organization:${activity.organization}`,
        `department:${activity.department}`,
        `task:${activity.parent}`,
      ]
    );

    const populatedActivity = await TaskActivity.findById(activity._id)
      .populate(
        "createdBy",
        "_id fullName firstName lastName position role email profilePicture isPlatformUser isHod lastLogin isDeleted"
      )
      .populate(
        "materials.material",
        "_id name unitType price description category"
      )
      .lean();

    // Transform materials
    populatedActivity.materials = transformMaterialsArray(
      populatedActivity.materials
    );

    okResponse(res, "Task activity updated successfully", populatedActivity);
  } catch (error) {
    await session.abortTransaction();
    logger.error("Update Task Activity Error:", error);
    throw error;
  } finally {
    session.endSession();
  }
});

export const deleteTaskActivity = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { activityId } = req.validated.params;

    const activity = await TaskActivity.findById(activityId)
      .withDeleted()
      .session(session);

    if (!activity) {
      throw CustomError.notFound("TaskActivity", activityId);
    }

    if (
      activity.organization.toString() !== req.user.organization._id.toString()
    ) {
      throw CustomError.authorization(
        "You are not authorized to delete this activity"
      );
    }

    if (activity.isDeleted) {
      await session.abortTransaction();
      return okResponse(res, "Task activity is already deleted", {
        activityId: activity._id,
      });
    }

    // Soft delete activity (idempotent - plugin handles this and automatic cascade)
    await activity.softDelete(req.user._id, { session });

    await session.commitTransaction();

    emitToRooms(
      "task_activity:deleted",
      { activityId: activity._id, taskId: activity.parent },
      [
        `organization:${activity.organization}`,
        `department:${activity.department}`,
        `task:${activity.parent}`,
      ]
    );

    const deletedActivity = await TaskActivity.findById(activityId)
      .withDeleted()
      .lean();

    successResponse(
      res,
      200,
      "Task activity deleted successfully",
      deletedActivity
    );
  } catch (error) {
    await session.abortTransaction();
    logger.error("Delete Task Activity Error:", error);
    throw error;
  } finally {
    session.endSession();
  }
});

export const restoreTaskActivity = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { activityId } = req.validated.params;

    const activity = await TaskActivity.findById(activityId)
      .withDeleted()
      .session(session);

    if (!activity) {
      throw CustomError.notFound("TaskActivity", activityId);
    }

    if (
      activity.organization.toString() !== req.user.organization._id.toString()
    ) {
      throw CustomError.authorization(
        "You are not authorized to restore this activity"
      );
    }

    if (!activity.isDeleted) {
      await session.abortTransaction();
      return okResponse(res, "Task activity is already active", {
        activityId: activity._id,
      });
    }

    // Restore activity (idempotent - plugin handles this, including hooks for parent checks)
    await activity.restore(req.user._id, { session });

    await session.commitTransaction();

    emitToRooms(
      "task_activity:restored",
      { activityId: activity._id, taskId: activity.parent },
      [
        `organization:${activity.organization}`,
        `department:${activity.department}`,
        `task:${activity.parent}`,
      ]
    );

    const populatedActivity = await TaskActivity.findById(activity._id)
      .populate(
        "createdBy",
        "_id fullName firstName lastName position role email profilePicture isPlatformUser isHod lastLogin isDeleted"
      )
      .populate(
        "materials.material",
        "_id name unitType price description category"
      )
      .lean();

    // Transform materials
    populatedActivity.materials = transformMaterialsArray(
      populatedActivity.materials
    );

    successResponse(
      res,
      200,
      "Task activity restored successfully",
      populatedActivity
    );
  } catch (error) {
    await session.abortTransaction();
    logger.error("Restore Task Activity Error:", error);
    throw error;
  } finally {
    session.endSession();
  }
});
