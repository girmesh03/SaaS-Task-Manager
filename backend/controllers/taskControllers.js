import mongoose from "mongoose";
import asyncHandler from "express-async-handler";
import {
  BaseTask,
  ProjectTask,
  RoutineTask,
  AssignedTask,
  Department,
  Organization,
  Vendor,
  User,
} from "../models/index.js";
import CustomError from "../errorHandler/CustomError.js";
import { emitToRooms } from "../utils/socketEmitter.js";
import { PAGINATION, TASK_TYPES } from "../utils/constants.js";
import logger from "../utils/logger.js";
import {
  createdResponse,
  okResponse,
  paginatedResponse,
  successResponse,
} from "../utils/responseTransform.js";

/**
 * Task Controllers (BaseTask + Discriminators)
 * Handles ProjectTask, RoutineTask, AssignedTask
 */

export const getTasks = asyncHandler(async (req, res) => {
  const {
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
    search,
    taskType,
    status,
    priority,
    department,
    assigneeId,
    vendor,
    deleted = "false",
  } = req.query;

  const filter = { organization: req.user.organization._id };

  if (search) filter.description = { $regex: search, $options: "i" };
  if (taskType) filter.taskType = taskType;
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (department) filter.department = department;
  if (assigneeId) filter.assignees = assigneeId;
  if (vendor) filter.vendor = vendor;

  let query = BaseTask.find(filter);
  if (deleted === "true") query = query.withDeleted();
  else if (deleted === "only") query = query.onlyDeleted();

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort: { createdAt: -1 },
    populate: [
      { path: "department", select: "name" },
      { path: "organization", select: "name" },
      { path: "createdBy", select: "firstName lastName" },
      { path: "vendor", select: "name" },
      { path: "assignees", select: "firstName lastName" },
      { path: "watchers", select: "firstName lastName" },
    ],
  };

  const tasks = await BaseTask.paginate(query, options);

  paginatedResponse(res, 200, "Tasks retrieved successfully", tasks.docs, {
    total: tasks.totalDocs,
    page: tasks.page,
    limit: tasks.limit,
    totalPages: tasks.totalPages,
    hasNextPage: tasks.hasNextPage,
    hasPrevPage: tasks.hasPrevPage,
  });
});

export const getTask = asyncHandler(async (req, res) => {
  const { resourceId } = req.params;

  const task = await BaseTask.findById(resourceId)
    .populate("department", "name")
    .populate("organization", "name")
    .populate("createdBy", "firstName lastName")
    .populate("vendor", "name")
    .populate("assignees", "firstName lastName")
    .populate("watchers", "firstName lastName")
    .lean();

  if (!task) throw CustomError.notFound("Task not found");

  if (
    task.organization._id.toString() !== req.user.organization._id.toString()
  ) {
    throw CustomError.authorization("You are not authorized to view this task");
  }

  // Get activities and comments count
  const TaskActivity = mongoose.model("TaskActivity");
  const TaskComment = mongoose.model("TaskComment");

  const [activitiesCount, commentsCount] = await Promise.all([
    TaskActivity.countDocuments({ parent: resourceId, isDeleted: false }),
    TaskComment.countDocuments({
      parent: resourceId,
      parentModel: "Task",
      isDeleted: false,
    }),
  ]);

  okResponse(res, "Task retrieved successfully", {
    ...task,
    activitiesCount,
    commentsCount,
  });
});

export const createTask = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      taskType,
      description,
      status,
      priority,
      department,
      startDate,
      dueDate,
      vendor,
      assignees,
      watchers,
      tags,
    } = req.body;

    const taskData = {
      description,
      status,
      priority,
      department,
      organization: req.user.organization._id,
      createdBy: req.user._id,
      watchers: watchers || [],
      tags: tags || [],
      taskType,
    };

    let task;

    // Create based on discriminator
    if (taskType === TASK_TYPES.PROJECT_TASK) {
      taskData.startDate = startDate;
      taskData.dueDate = dueDate;
      taskData.vendor = vendor;
      [task] = await ProjectTask.create([taskData], { session });
    } else if (taskType === TASK_TYPES.ROUTINE_TASK) {
      taskData.startDate = startDate;
      taskData.dueDate = dueDate;
      [task] = await RoutineTask.create([taskData], { session });
    } else if (taskType === TASK_TYPES.ASSIGNED_TASK) {
      taskData.assignees = assignees;
      [task] = await AssignedTask.create([taskData], { session });
    } else {
      throw CustomError.validation("Invalid task type");
    }

    await session.commitTransaction();

    emitToRooms(
      [`organization:${task.organization}`, `department:${task.department}`],
      "task:created",
      {
        taskId: task._id,
        taskType: task.taskType,
        organizationId: task.organization,
        departmentId: task.department,
      }
    );

    const populatedTask = await BaseTask.findById(task._id)
      .populate("department", "name")
      .populate("organization", "name")
      .populate("createdBy", "firstName lastName")
      .populate("vendor", "name")
      .populate("assignees", "firstName lastName")
      .populate("watchers", "firstName lastName")
      .lean();

    createdResponse(res, "Task created successfully", populatedTask);
  } catch (error) {
    await session.abortTransaction();
    logger.error("Create Task Error:", error);
    throw error;
  } finally {
    session.endSession();
  }
});

export const updateTask = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { resourceId } = req.params;
    const updates = req.body;

    const task = await BaseTask.findById(resourceId).session(session);
    if (!task) {
      throw CustomError.notFound("Task not found");
    }

    if (
      task.organization.toString() !== req.user.organization._id.toString()
    ) {
      throw CustomError.authorization(
        "You are not authorized to update this task"
      );
    }

    Object.keys(updates).forEach((key) => {
      if (!["organization", "createdBy", "taskType"].includes(key)) {
        task[key] = updates[key];
      }
    });

    await task.save({ session });
    await session.commitTransaction();

    emitToRooms(
      [`organization:${task.organization}`, `department:${task.department}`],
      "task:updated",
      {
        taskId: task._id,
        taskType: task.taskType,
        organizationId: task.organization,
        departmentId: task.department,
      }
    );

    const populatedTask = await BaseTask.findById(task._id)
      .populate("department", "name")
      .populate("organization", "name")
      .populate("createdBy", "firstName lastName")
      .populate("vendor", "name")
      .populate("assignees", "firstName lastName")
      .populate("watchers", "firstName lastName")
      .lean();

    okResponse(res, "Task updated successfully", populatedTask);
  } catch (error) {
    await session.abortTransaction();
    logger.error("Update Task Error:", error);
    throw error;
  } finally {
    session.endSession();
  }
});

export const deleteTask = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { resourceId } = req.params;

    const task = await BaseTask.findById(resourceId)
      .withDeleted()
      .session(session);
    if (!task) {
      throw CustomError.notFound("Task not found");
    }

    if (
      task.organization.toString() !== req.user.organization._id.toString()
    ) {
      throw CustomError.authorization(
        "You are not authorized to delete this task"
      );
    }

    if (task.isDeleted) {
      await session.abortTransaction();
      return okResponse(res, "Task is already deleted", { taskId: task._id });
    }

    await task.softDelete(req.user._id, { session });
    await BaseTask.cascadeDelete(task._id, req.user._id, { session });
    await session.commitTransaction();

    emitToRooms(
      [`organization:${task.organization}`, `department:${task.department}`],
      "task:deleted",
      {
        taskId: task._id,
        taskType: task.taskType,
        organizationId: task.organization,
        departmentId: task.department,
      }
    );

    successResponse(res, 200, "Task deleted successfully", {
      taskId: task._id,
    });
  } catch (error) {
    await session.abortTransaction();
    logger.error("Delete Task Error:", error);
    throw error;
  } finally {
    session.endSession();
  }
});

export const restoreTask = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { resourceId } = req.params;

    const task = await BaseTask.findById(resourceId)
      .withDeleted()
      .session(session);
    if (!task) {
      throw CustomError.notFound("Task not found");
    }

    if (
      task.organization.toString() !== req.user.organization._id.toString()
    ) {
      throw CustomError.authorization(
        "You are not authorized to restore this task"
      );
    }

    if (!task.isDeleted) {
      await session.abortTransaction();
      return okResponse(res, "Task is already active", { taskId: task._id });
    }

    // Strict parent checks
    const [organization, department] = await Promise.all([
      Organization.findById(task.organization).withDeleted().session(session),
      Department.findById(task.department).withDeleted().session(session),
    ]);

    if (!organization || organization.isDeleted) {
      throw CustomError.validation(
        "Cannot restore task. Parent organization is deleted or missing."
      );
    }

    if (!department || department.isDeleted) {
      throw CustomError.validation(
        "Cannot restore task. Parent department is deleted or missing."
      );
    }

    // Check vendor for ProjectTask
    if (task.taskType === TASK_TYPES.PROJECT_TASK && task.vendor) {
      const vendor = await Vendor.findById(task.vendor)
        .withDeleted()
        .session(session);
      if (!vendor || vendor.isDeleted) {
        throw CustomError.validation(
          "Cannot restore task. Vendor is deleted or missing."
        );
      }
    }

    // Prune invalid watchers
    if (task.watchers && task.watchers.length > 0) {
      const validWatchers = await User.find({
        _id: { $in: task.watchers },
        isDeleted: false,
      })
        .session(session)
        .select("_id")
        .lean();

      task.watchers = validWatchers.map((u) => u._id);
    }

    // Prune invalid assignees for AssignedTask
    if (
      task.taskType === TASK_TYPES.ASSIGNED_TASK &&
      task.assignees &&
      task.assignees.length > 0
    ) {
      const validAssignees = await User.find({
        _id: { $in: task.assignees },
        isDeleted: false,
      })
        .session(session)
        .select("_id")
        .lean();

      if (validAssignees.length === 0) {
        throw CustomError.validation(
          "Cannot restore AssignedTask. No valid assignees available."
        );
      }

      task.assignees = validAssignees.map((u) => u._id);
    }

    await task.restore(req.user._id, { session });
    await session.commitTransaction();

    emitToRooms(
      [`organization:${task.organization}`, `department:${task.department}`],
      "task:restored",
      {
        taskId: task._id,
        taskType: task.taskType,
        organizationId: task.organization,
        departmentId: task.department,
      }
    );

    const populatedTask = await BaseTask.findById(task._id)
      .populate("department", "name")
      .populate("organization", "name")
      .populate("createdBy", "firstName lastName")
      .populate("vendor", "name")
      .populate("assignees", "firstName lastName")
      .populate("watchers", "firstName lastName")
      .lean();

    successResponse(res, 200, "Task restored successfully", populatedTask);
  } catch (error) {
    await session.abortTransaction();
    logger.error("Restore Task Error:", error);
    throw error;
  } finally {
    session.endSession();
  }
});
