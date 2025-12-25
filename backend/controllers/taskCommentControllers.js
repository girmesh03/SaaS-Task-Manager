import mongoose from "mongoose";
import asyncHandler from "express-async-handler";
import {
  TaskComment,
  BaseTask,
  TaskActivity,
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

/**
 * TaskComment Controllers
 *
 * CRITICAL: All write operations use MongoDB transactions
 * CRITICAL: Socket.IO events AFTER commit
 * CRITICAL: Polymorphic Parent handling
 */

// Helper to resolve Task ID for socket room
const resolveTaskId = async (parent, parentModel, session) => {
  if (parentModel === "BaseTask") return parent;
  if (parentModel === "TaskActivity") {
    const activity = await TaskActivity.findById(parent)
      .session(session)
      .select("parent");
    return activity ? activity.parent : null;
  }
  if (parentModel === "TaskComment") {
    // Recursive lookup limited to depth
    const comment = await TaskComment.findById(parent)
      .session(session)
      .select("parent parentModel");
    if (!comment) return null;
    return resolveTaskId(comment.parent, comment.parentModel, session);
  }
  return null;
};

export const getTaskComments = asyncHandler(async (req, res) => {
  const {
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
    parent,
    deleted = "false",
  } = req.query;

  const filter = { organization: req.user.organization._id };
  if (parent) filter.parent = parent;

  let query = TaskComment.find(filter);

  if (deleted === "true") query = query.withDeleted();
  else if (deleted === "only") query = query.onlyDeleted();

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort: { createdAt: 1 }, // Comments usually ASC
    populate: [
      { path: "createdBy", select: "firstName lastName" },
      { path: "mentions", select: "firstName lastName" },
    ],
  };

  const comments = await TaskComment.paginate(query, options);

  paginatedResponse(res, 200, "Comments retrieved successfully", comments.docs, {
    total: comments.totalDocs,
    page: comments.page,
    limit: comments.limit,
    totalPages: comments.totalPages,
    hasNextPage: comments.hasNextPage,
    hasPrevPage: comments.hasPrevPage,
  });
});

export const getTaskComment = asyncHandler(async (req, res) => {
  const { resourceId } = req.params;

  const comment = await TaskComment.findById(resourceId)
    .populate("createdBy", "firstName lastName")
    .populate("mentions", "firstName lastName")
    .lean();

  if (!comment) throw CustomError.notFound("Comment not found");

  if (
    comment.organization.toString() !== req.user.organization._id.toString()
  ) {
    throw CustomError.authorization("You are not authorized to view this comment");
  }

  okResponse(res, "Comment retrieved successfully", comment);
});

export const createTaskComment = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { comment, parent, parentModel, mentions } = req.body;

    // We need Department ID. Where to get it?
    // Inherit from Parent.
    let departmentId = null;

    // Resolve Department and Validation
    if (parentModel === "BaseTask") {
      const p = await BaseTask.findById(parent).session(session);
      if (!p) throw new Error("Parent task not found");
      departmentId = p.department;
    } else if (parentModel === "TaskActivity") {
      const p = await TaskActivity.findById(parent).session(session);
      if (!p) throw new Error("Parent activity not found");
      departmentId = p.department;
    } else if (parentModel === "TaskComment") {
      const p = await TaskComment.findById(parent).session(session);
      if (!p) throw new Error("Parent comment not found");
      departmentId = p.department;
    }

    const commentData = {
      comment,
      parent,
      parentModel,
      mentions: mentions || [],
      department: departmentId,
      organization: req.user.organization._id,
      createdBy: req.user._id,
    };

    const [newComment] = await TaskComment.create([commentData], { session });

    // Resolve Context for Socket
    const taskId = await resolveTaskId(parent, parentModel, session);

    await session.commitTransaction();

    const rooms = [
      `organization:${newComment.organization}`,
      `department:${newComment.department}`,
    ];
    if (taskId) rooms.push(`task:${taskId}`);

    emitToRooms(rooms, "task_comment:created", {
      commentId: newComment._id,
      taskId: taskId, // optional
      organizationId: newComment.organization,
    });

    const populatedComment = await TaskComment.findById(newComment._id)
      .populate("createdBy", "firstName lastName")
      .populate("mentions", "firstName lastName")
      .lean();

    createdResponse(res, "Comment created successfully", populatedComment);
  } catch (error) {
    await session.abortTransaction();
    logger.error("Create Task Comment Error:", error);
    throw error;
  } finally {
    session.endSession();
  }
});

export const updateTaskComment = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { resourceId } = req.params;
    const updates = req.body;

    const comment = await TaskComment.findById(resourceId).session(session);
    if (!comment) {
      throw CustomError.notFound("Comment not found");
    }

    if (
      comment.organization.toString() !== req.user.organization._id.toString()
    ) {
      throw CustomError.authorization(
        "You are not authorized to update this comment"
      );
    }

    // Usually enforced via authorization policy, but explicitly:
    // if (comment.createdBy.toString() !== req.user._id.toString()) ...

    if (updates.comment) comment.comment = updates.comment;
    if (updates.mentions) comment.mentions = updates.mentions;

    await comment.save({ session });

    const taskId = await resolveTaskId(
      comment.parent,
      comment.parentModel,
      session
    );

    await session.commitTransaction();

    const rooms = [
      `organization:${comment.organization}`,
      `department:${comment.department}`,
    ];
    if (taskId) rooms.push(`task:${taskId}`);

    emitToRooms(rooms, "task_comment:updated", {
      commentId: comment._id,
      taskId: taskId,
    });

    const populatedComment = await TaskComment.findById(comment._id)
      .populate("createdBy", "firstName lastName")
      .populate("mentions", "firstName lastName")
      .lean();

    okResponse(res, "Comment updated successfully", populatedComment);
  } catch (error) {
    await session.abortTransaction();
    logger.error("Update Task Comment Error:", error);
    throw error;
  } finally {
    session.endSession();
  }
});

export const deleteTaskComment = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { resourceId } = req.params;

    const comment = await TaskComment.findById(resourceId)
      .withDeleted()
      .session(session);
    if (!comment) {
      throw CustomError.notFound("Comment not found");
    }

    if (
      comment.organization.toString() !== req.user.organization._id.toString()
    ) {
      throw CustomError.authorization(
        "You are not authorized to delete this comment"
      );
    }

    if (comment.isDeleted) {
      await session.abortTransaction();
      return okResponse(res, "Comment is already deleted", {
        commentId: comment._id,
      });
    }

    // Soft delete
    await comment.softDelete(req.user._id, { session });

    // Cascade
    await TaskComment.cascadeDelete(comment._id, req.user._id, { session });

    const taskId = await resolveTaskId(
      comment.parent,
      comment.parentModel,
      session
    );

    await session.commitTransaction();

    const rooms = [
      `organization:${comment.organization}`,
      `department:${comment.department}`,
    ];
    if (taskId) rooms.push(`task:${taskId}`);

    emitToRooms(rooms, "task_comment:deleted", {
      commentId: comment._id,
      taskId: taskId,
    });

    successResponse(res, 200, "Comment deleted successfully", {
      commentId: comment._id,
    });
  } catch (error) {
    await session.abortTransaction();
    logger.error("Delete Task Comment Error:", error);
    throw error;
  } finally {
    session.endSession();
  }
});

export const restoreTaskComment = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { resourceId } = req.params;

    const comment = await TaskComment.findById(resourceId)
      .withDeleted()
      .session(session);
    if (!comment) {
      throw CustomError.notFound("Comment not found");
    }

    if (
      comment.organization.toString() !== req.user.organization._id.toString()
    ) {
      throw CustomError.authorization(
        "You are not authorized to restore this comment"
      );
    }

    if (!comment.isDeleted) {
      await session.abortTransaction();
      return okResponse(res, "Comment is already active", {
        commentId: comment._id,
      });
    }

    // Check Parent Existence
    let ParentModel;
    if (comment.parentModel === "BaseTask") ParentModel = BaseTask;
    else if (comment.parentModel === "TaskActivity") ParentModel = TaskActivity;
    else if (comment.parentModel === "TaskComment") ParentModel = TaskComment;

    const parent = await ParentModel.findById(comment.parent)
      .withDeleted()
      .session(session);
    if (!parent || parent.isDeleted) {
      throw CustomError.validation(
        `Cannot restore comment. Parent ${comment.parentModel} is deleted or missing.`
      );
    }

    await comment.restore(req.user._id, { session });

    const taskId = await resolveTaskId(
      comment.parent,
      comment.parentModel,
      session
    );

    await session.commitTransaction();

    const rooms = [
      `organization:${comment.organization}`,
      `department:${comment.department}`,
    ];
    if (taskId) rooms.push(`task:${taskId}`);

    emitToRooms(rooms, "task_comment:restored", {
      commentId: comment._id,
      taskId: taskId,
    });

    const populatedComment = await TaskComment.findById(comment._id)
      .populate("createdBy", "firstName lastName")
      .populate("mentions", "firstName lastName")
      .lean();

    successResponse(res, 200, "Comment restored successfully", populatedComment);
  } catch (error) {
    await session.abortTransaction();
    logger.error("Restore Task Comment Error:", error);
    throw error;
  } finally {
    session.endSession();
  }
});
