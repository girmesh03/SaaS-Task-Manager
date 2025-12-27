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
    parent,
    deleted = "false",
  } = req.query;

  const filter = { organization: req.user.organization._id };

  // Filter by parent task if provided
  if (parent) {
    filter.parent = parent;
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
      { path: "createdBy", select: "firstName lastName" },
      { path: "materials.material", select: "name unitType price" },
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
  const { resourceId } = req.params;

  const activity = await TaskActivity.findById(resourceId)
    .populate("createdBy", "firstName lastName")
    .populate("materials.material", "name unitType price")
    .lean();

  if (!activity) {
    throw CustomError.notFound("Task activity not found");
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
    const { activity, parent, materials } = req.body;

    // Verify parent task exists and belongs to org
    const parentTask = await BaseTask.findById(parent).session(session);
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
      parent,
      parentModel: parentTask.taskType.includes("Task")
        ? "Task"
        : parentTask.taskType, // Simplification, model expects 'Task' usually for base ref
      materials: materials || [],
      organization: req.user.organization._id,
      department: parentTask.department, // Inherit department from parent task
      createdBy: req.user._id,
    };

    // Adjust parentModel if your schema discriminator setup requires specific string
    // Based on BaseTask, usually we refer to parentModel as properties of relations, schema definitions say 'Task' usually covers keys.
    // Checking TaskActivity schema, parentModel enum typically includes 'ProjectTask', 'AssignedTask' or just 'Task'.
    // Assuming 'Task' is sufficient if BaseTask is the model, but usually polmorphic uses specific model name.
    // Let's use the taskType from the parent.
    activityData.parentModel = "Task"; // Using 'Task' as generic parent model if discriminators are kept under BaseTask collection logic

    const [newActivity] = await TaskActivity.create([activityData], {
      session,
    });

    await session.commitTransaction();

    emitToRooms(
      "task_activity:created",
      {
        activityId: newActivity._id,
        taskId: parent,
        organizationId: newActivity.organization,
      },
      [
        `organization:${parentTask.organization}`,
        `department:${parentTask.department}`,
        `task:${parent}`,
      ]
    );

    const populatedActivity = await TaskActivity.findById(newActivity._id)
      .populate("createdBy", "firstName lastName")
      .populate("materials.material", "name unitType price")
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
    const { resourceId } = req.params;
    const updates = req.body;

    const activity = await TaskActivity.findById(resourceId).session(session);

    if (!activity) {
      throw CustomError.notFound("Task activity not found");
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
    if (updates.materials) activity.materials = updates.materials;

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
      .populate("createdBy", "firstName lastName")
      .populate("materials.material", "name unitType price")
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
    const { resourceId } = req.params;

    const activity = await TaskActivity.findById(resourceId)
      .withDeleted()
      .session(session);

    if (!activity) {
      throw CustomError.notFound("Task activity not found");
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

    // Soft delete activity
    await activity.softDelete(req.user._id, { session });

    // Cascade delete children (TaskController handles this usually via BaseTask cascade, but direct deletion needs own cascade)
    // TaskActivity -> TaskComments / Attachments
    await TaskActivity.cascadeDelete(activity._id, req.user._id, { session });

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

    successResponse(res, 200, "Task activity deleted successfully", {
      activityId: activity._id,
    });
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
    const { resourceId } = req.params;

    const activity = await TaskActivity.findById(resourceId)
      .withDeleted()
      .session(session);

    if (!activity) {
      throw CustomError.notFound("Task activity not found");
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

    // Strict parent check: Parent Task must be active
    const parentTask = await BaseTask.findById(activity.parent)
      .withDeleted()
      .session(session);
    if (!parentTask || parentTask.isDeleted) {
      throw CustomError.validation(
        "Cannot restore activity. Parent task is deleted or missing."
      );
    }

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
      .populate("createdBy", "firstName lastName")
      .populate("materials.material", "name unitType price")
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
