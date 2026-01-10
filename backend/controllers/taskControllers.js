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
import notificationService from "../services/notificationService.js";
import emailService from "../services/emailService.js";

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
    departmentId,
    assigneeId,
    vendorId,
    deleted = "false",
  } = req.validated.query;

  const filter = { organization: req.user.organization._id };

  if (search) filter.description = { $regex: search, $options: "i" };
  if (taskType) filter.taskType = taskType;
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (departmentId) {
    filter.department = departmentId;
  }else{
    filter.department= req.user.department._id
  }
  if (assigneeId) filter.assignees = assigneeId;
  if (vendorId) filter.vendor = vendorId;

  let query = BaseTask.find(filter);
  if (deleted === "true") query = query.withDeleted();
  else if (deleted === "only") query = query.onlyDeleted();

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort: { createdAt: -1 },
    populate: [
      {
        path: "department",
        select: "_id name hod isDeleted",
      },
      {
        path: "organization",
        select:
          "_id name email industry logo isPlatformOrg isDeleted",
      },
      {
        path: "createdBy",
        select:
          "_id fullName firstName lastName position role email profilePicture isPlatformUser isHod lastLogin isDeleted",
      },
      {
        path: "vendor",
        select:
          "_id name contactPerson email phone isDeleted",
      },
      {
        path: "assignees",
        select:
          "_id fullName firstName lastName position role email profilePicture isPlatformUser isHod lastLogin isDeleted",
      },
      {
        path: "watchers",
        select:
          "_id fullName firstName lastName position role email profilePicture isPlatformUser isHod lastLogin isDeleted",
      },
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
  const { taskId } = req.validated.params;

  const task = await BaseTask.findById(taskId)
    .populate("department", "_id name hod isDeleted")
    .populate(
      "organization",
      "_id name email industry logo isPlatformOrg isDeleted"
    )
    .populate(
      "createdBy",
      "_id fullName firstName lastName position role email profilePicture isPlatformUser isHod lastLogin isDeleted"
    )
    .populate(
      "vendor",
      "_id name contactPerson email phone isDeleted"
    )
    .populate(
      "assignees",
      "_id fullName firstName lastName position role email profilePicture isPlatformUser isHod lastLogin isDeleted"
    )
    .populate(
      "watchers",
      "_id fullName firstName lastName position role email profilePicture isPlatformUser isHod lastLogin isDeleted"
    )
    .lean();

  if (!task) throw CustomError.notFound("Task", taskId);

  if (
    task.organization._id.toString() !== req.user.organization._id.toString()
  ) {
    throw CustomError.authorization("You are not authorized to view this task");
  }

  // Get activities and comments count
  const TaskActivity = mongoose.model("TaskActivity");
  const TaskComment = mongoose.model("TaskComment");

  const [activitiesCount, commentsCount] = await Promise.all([
    TaskActivity.countDocuments({ parent: taskId, isDeleted: false }),
    TaskComment.countDocuments({
      parent: taskId,
      parentModel: "BaseTask",
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
      title,
      description,
      status,
      priority,
      taskType,
      departmentId,
      startDate,
      dueDate,
      vendorId,
      estimatedCost,
      actualCost,
      currency,
      materials,
      assigneeIds,
      watcherIds,
      tags,
      attachmentIds,
    } = req.validated.body;

    const taskData = {
      description,
      status,
      priority,
      department: departmentId,
      organization: req.user.organization._id,
      createdBy: req.user._id,
      attachments: attachmentIds || [],
      watchers: watcherIds || [],
      tags: tags || [],
      taskType,
    };

    let task;

    // Create based on discriminator
    if (taskType === TASK_TYPES.PROJECT_TASK) {
      taskData.title = title;
      taskData.startDate = startDate;
      taskData.dueDate = dueDate;
      taskData.vendor = vendorId;
      taskData.estimatedCost = estimatedCost;
      taskData.actualCost = actualCost;
      taskData.currency = currency;
      [task] = await ProjectTask.create([taskData], { session });
    } else if (taskType === TASK_TYPES.ROUTINE_TASK) {
      taskData.startDate = startDate;
      taskData.dueDate = dueDate;
      taskData.materials = materials || [];
      [task] = await RoutineTask.create([taskData], { session });
    } else if (taskType === TASK_TYPES.ASSIGNED_TASK) {
      taskData.title = title;
      taskData.startDate = startDate;
      taskData.dueDate = dueDate;
      taskData.assignees = assigneeIds;
      [task] = await AssignedTask.create([taskData], { session });
    } else {
      throw CustomError.validation("Invalid task type");
    }

    await session.commitTransaction();

    emitToRooms(
      "task:created",
      {
        taskId: task._id,
        taskType: task.taskType,
        organizationId: task.organization,
        departmentId: task.department,
      },
      [`organization:${task.organization}`, `department:${task.department}`]
    );

    const populatedTask = await BaseTask.findById(task._id)
      .populate("department", "_id name hod isDeleted")
      .populate(
        "organization",
        "_id name email industry logo isPlatformOrg isDeleted"
      )
      .populate(
        "createdBy",
        "_id fullName firstName lastName position role email profilePicture isPlatformUser isHod lastLogin isDeleted"
      )
      .populate(
        "vendor",
        "_id name contactPerson email phone isDeleted"
      )
      .populate(
        "assignees",
        "_id fullName firstName lastName position role email profilePicture isPlatformUser isHod lastLogin isDeleted"
      )
      .populate(
        "watchers",
        "_id fullName firstName lastName position role email profilePicture isPlatformUser isHod lastLogin isDeleted"
      )
      .lean();

    createdResponse(res, "Task created successfully", populatedTask);

    // Notifications (Async, non-blocking)
    (async () => {
      try {
        const recipients = new Set([
          ...(task.assignees || []),
          ...(task.watchers || []),
        ]);

        if (recipients.size > 0) {
          const recipientIds = Array.from(recipients).map(id => id.toString());

          // Filter out the creator
          const notifyIds = recipientIds.filter(id => id !== req.user._id.toString());

          if (notifyIds.length > 0) {
            await notificationService.notifyTaskCreated(task, notifyIds);

            // Email notifications (only for assignees by default)
            const assignees = (task.assignees || []).map(id => id.toString());
            for (const id of notifyIds) {
              if (assignees.includes(id)) {
                const user = await User.findById(id);
                if (user) {
                  await emailService.sendTaskAssignmentEmail(user, task);
                }
              }
            }
          }
        }
      } catch (err) {
        logger.error("Post-create notification error:", err);
      }
    })();
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
    const { taskId } = req.validated.params;
    const {
      departmentId,
      vendorId,
      assigneeIds,
      watcherIds,
      attachmentIds,
      ...otherUpdates
    } = req.validated.body;

    const task = await BaseTask.findById(taskId).session(session);
    if (!task) {
      throw CustomError.notFound("Task", taskId);
    }

    if (
      task.organization.toString() !== req.user.organization._id.toString()
    ) {
      throw CustomError.authorization(
        "You are not authorized to update this task"
      );
    }

    // Map fields
    if (departmentId) task.department = departmentId;
    if (vendorId) task.vendor = vendorId;
    if (assigneeIds) task.assignees = assigneeIds;
    if (watcherIds) task.watchers = watcherIds;
    if (attachmentIds) task.attachments = attachmentIds;

    Object.keys(otherUpdates).forEach((key) => {
      if (!["organization", "createdBy", "taskType"].includes(key)) {
        task[key] = otherUpdates[key];
      }
    });

    await task.save({ session });
    await session.commitTransaction();

    emitToRooms(
      "task:updated",
      {
        taskId: task._id,
        taskType: task.taskType,
        organizationId: task.organization,
        departmentId: task.department,
      },
      [`organization:${task.organization}`, `department:${task.department}`]
    );

    const populatedTask = await BaseTask.findById(task._id)
      .populate("department", "_id name hod isDeleted")
      .populate(
        "organization",
        "_id name email industry logo isPlatformOrg isDeleted"
      )
      .populate(
        "createdBy",
        "_id fullName firstName lastName position role email profilePicture isPlatformUser isHod lastLogin isDeleted"
      )
      .populate(
        "vendor",
        "_id name contactPerson email phone isDeleted"
      )
      .populate(
        "assignees",
        "_id fullName firstName lastName position role email profilePicture isPlatformUser isHod lastLogin isDeleted"
      )
      .populate(
        "watchers",
        "_id fullName firstName lastName position role email profilePicture isPlatformUser isHod lastLogin isDeleted"
      )
      .lean();

    okResponse(res, "Task updated successfully", populatedTask);

    // Notifications (Async, non-blocking)
    (async () => {
      try {
        const recipients = new Set([
          ...(task.assignees || []),
          ...(task.watchers || []),
        ]);

        if (recipients.size > 0) {
          const recipientIds = Array.from(recipients).map(id => id.toString());
          const notifyIds = recipientIds.filter(id => id !== req.user._id.toString());

          if (notifyIds.length > 0) {
            await notificationService.notifyTaskUpdated(task, notifyIds);

            // For updates, we usually only send emails to assignees if status changed or priority changed
            // But let's keep it simple for now as per "taskNotifications" preference.
            for (const id of notifyIds) {
              const user = await User.findById(id);
              if (user) {
                await emailService.sendTaskNotificationEmail(user, task, "updated");
              }
            }
          }
        }
      } catch (err) {
        logger.error("Post-update notification error:", err);
      }
    })();
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
    const { taskId } = req.validated.params;

    const task = await BaseTask.findById(taskId)
      .withDeleted()
      .session(session);
    if (!task) {
      throw CustomError.notFound("Task", taskId);
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
    await session.commitTransaction();

    emitToRooms(
      "task:deleted",
      {
        taskId: task._id,
        taskType: task.taskType,
        organizationId: task.organization,
        departmentId: task.department,
      },
      [`organization:${task.organization}`, `department:${task.department}`]
    );

    const deletedTask = await BaseTask.findById(taskId)
      .populate("department", "_id name hod isDeleted")
      .populate(
        "organization",
        "_id name email industry logo isPlatformOrg isDeleted"
      )
      .populate(
        "createdBy",
        "_id fullName firstName lastName position role email profilePicture isPlatformUser isHod lastLogin isDeleted"
      )
      .populate(
        "vendor",
        "_id name contactPerson email phone isDeleted"
      )
      .populate(
        "assignees",
        "_id fullName firstName lastName position role email profilePicture isPlatformUser isHod lastLogin isDeleted"
      )
      .populate(
        "watchers",
        "_id fullName firstName lastName position role email profilePicture isPlatformUser isHod lastLogin isDeleted"
      )
      .withDeleted()
      .lean();

    successResponse(res, 200, "Task deleted successfully", deletedTask);
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
    const { taskId } = req.validated.params;

    const task = await BaseTask.findById(taskId)
      .withDeleted()
      .session(session);
    if (!task) {
      throw CustomError.notFound("Task", taskId);
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

    // Restore task (idempotent - plugin handles this, including hooks for parent checks/repairs)
    await task.restore(req.user._id, { session });
    await session.commitTransaction();

    emitToRooms(
      "task:restored",
      {
        taskId: task._id,
        taskType: task.taskType,
        organizationId: task.organization,
        departmentId: task.department,
      },
      [`organization:${task.organization}`, `department:${task.department}`]
    );

    const populatedTask = await BaseTask.findById(task._id)
      .populate("department", "_id name hod isDeleted")
      .populate(
        "organization",
        "_id name email industry logo isPlatformOrg isDeleted"
      )
      .populate(
        "createdBy",
        "_id fullName firstName lastName position role email profilePicture isPlatformUser isHod lastLogin isDeleted"
      )
      .populate(
        "vendor",
        "_id name contactPerson email phone isDeleted"
      )
      .populate(
        "assignees",
        "_id fullName firstName lastName position role email profilePicture isPlatformUser isHod lastLogin isDeleted"
      )
      .populate(
        "watchers",
        "_id fullName firstName lastName position role email profilePicture isPlatformUser isHod lastLogin isDeleted"
      )
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
