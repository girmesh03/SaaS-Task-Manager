import mongoose from "mongoose";
import asyncHandler from "express-async-handler";
import { TaskComment, BaseTask, TaskActivity, User } from "../models/index.js";
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
import notificationService from "../services/notificationService.js";
import emailService from "../services/emailService.js";

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
    parentId,
    deleted = "false",
  } = req.validated.query;

  const filter = { organization: req.user.organization._id };
  if (parentId) filter.parent = parentId;

  let query = TaskComment.find(filter);

  if (deleted === "true") query = query.withDeleted();
  else if (deleted === "only") query = query.onlyDeleted();

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort: { createdAt: 1 }, // Comments usually ASC
    populate: [
      {
        path: "createdBy",
        select:
          "_id fullName firstName lastName position role email profilePicture isPlatformUser isHod lastLogin isDeleted",
      },
      {
        path: "mentions",
        select:
          "_id fullName firstName lastName position role email profilePicture isPlatformUser isHod lastLogin isDeleted",
      },
    ],
  };

  const comments = await TaskComment.paginate(query, options);

  paginatedResponse(
    res,
    200,
    "Comments retrieved successfully",
    comments.docs,
    {
      total: comments.totalDocs,
      page: comments.page,
      limit: comments.limit,
      totalPages: comments.totalPages,
      hasNextPage: comments.hasNextPage,
      hasPrevPage: comments.hasPrevPage,
    }
  );
});

export const getTaskComment = asyncHandler(async (req, res) => {
  const { commentId } = req.validated.params;

  const comment = await TaskComment.findById(commentId)
    .populate(
      "createdBy",
      "_id fullName firstName lastName position role email profilePicture isPlatformUser isHod lastLogin isDeleted"
    )
    .populate(
      "mentions",
      "_id fullName firstName lastName position role email profilePicture isPlatformUser isHod lastLogin isDeleted"
    )
    .lean();

  if (!comment) throw CustomError.notFound("Comment", commentId);

  if (
    comment.organization.toString() !== req.user.organization._id.toString()
  ) {
    throw CustomError.authorization(
      "You are not authorized to view this comment"
    );
  }

  okResponse(res, "Comment retrieved successfully", comment);
});

export const createTaskComment = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { comment, parentId, parentModel, mentionIds } = req.validated.body;

    // We need Department ID. Where to get it?
    // Inherit from Parent.
    let departmentId = null;

    // Resolve Department and Validation
    if (parentModel === "BaseTask") {
      const p = await BaseTask.findById(parentId).session(session);
      if (!p) throw CustomError.notFound("BaseTask", parentId);
      departmentId = p.department;
    } else if (parentModel === "TaskActivity") {
      const p = await TaskActivity.findById(parentId).session(session);
      if (!p) throw CustomError.notFound("TaskActivity", parentId);
      departmentId = p.department;
    } else if (parentModel === "TaskComment") {
      const p = await TaskComment.findById(parentId).session(session);
      if (!p) throw CustomError.notFound("TaskComment", parentId);
      departmentId = p.department;
    }

    const commentData = {
      comment,
      parent: parentId,
      parentModel,
      mentions: mentionIds || [],
      department: departmentId,
      organization: req.user.organization._id,
      createdBy: req.user._id,
    };

    const [newComment] = await TaskComment.create([commentData], { session });

    // Resolve Context for Socket
    const taskId = await resolveTaskId(parentId, parentModel, session);

    await session.commitTransaction();

    const rooms = [
      `organization:${newComment.organization}`,
      `department:${newComment.department}`,
    ];
    if (taskId) rooms.push(`task:${taskId}`);

    emitToRooms(
      "task_comment:created",
      {
        commentId: newComment._id,
        taskId: taskId, // optional
        organizationId: newComment.organization,
      },
      rooms
    );

    const populatedComment = await TaskComment.findById(newComment._id)
      .populate(
        "createdBy",
        "_id fullName firstName lastName position role email profilePicture isPlatformUser isHod lastLogin isDeleted"
      )
      .populate(
        "mentions",
        "_id fullName firstName lastName position role email profilePicture isPlatformUser isHod lastLogin isDeleted"
      )
      .lean();

    createdResponse(res, "Comment created successfully", populatedComment);

    // Notifications (Async, non-blocking)
    (async () => {
      try {
        if (mentionIds && mentionIds.length > 0) {
          // Filter out the creator if they mentioned themselves
          const notifyIds = mentionIds.filter(
            (id) => id.toString() !== req.user._id.toString()
          );

          if (notifyIds.length > 0) {
            await notificationService.notifyMention(
              newComment,
              notifyIds,
              taskId
            );

            // Email notifications (if preferred)
            const actor = {
              firstName: req.user.firstName,
              lastName: req.user.lastName,
            };
            const task = await BaseTask.findById(taskId || parent).select(
              "title description"
            );

            for (const id of notifyIds) {
              const mentionedUser = await User.findById(id);
              if (mentionedUser && task) {
                await emailService.sendMentionEmail(
                  mentionedUser,
                  actor,
                  newComment,
                  task
                );
              }
            }
          }
        }
      } catch (err) {
        logger.error("Post-comment notification error:", err);
      }
    })();
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
    const { commentId } = req.validated.params;
    const updates = req.validated.body;

    const comment = await TaskComment.findById(commentId).session(session);
    if (!comment) {
      throw CustomError.notFound("Comment", commentId);
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
    if (updates.mentionIds) comment.mentions = updates.mentionIds;

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

    emitToRooms(
      "task_comment:updated",
      {
        commentId: comment._id,
        taskId: taskId,
      },
      rooms
    );

    const populatedComment = await TaskComment.findById(comment._id)
      .populate(
        "createdBy",
        "_id fullName firstName lastName position role email profilePicture isPlatformUser isHod lastLogin isDeleted"
      )
      .populate(
        "mentions",
        "_id fullName firstName lastName position role email profilePicture isPlatformUser isHod lastLogin isDeleted"
      )
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
    const { commentId } = req.validated.params;

    const comment = await TaskComment.findById(commentId)
      .withDeleted()
      .session(session);
    if (!comment) {
      throw CustomError.notFound("Comment", commentId);
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

    // Soft delete comment (idempotent - plugin handles this and automatic cascade)
    await comment.softDelete(req.user._id, { session });

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

    emitToRooms(
      "task_comment:deleted",
      {
        commentId: comment._id,
        taskId: comment.parent,
      },
      rooms
    );

    const deletedComment = await TaskComment.findById(commentId)
      .withDeleted()
      .lean();

    successResponse(res, 200, "Comment deleted successfully", deletedComment);
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
    const { commentId } = req.validated.params;

    const comment = await TaskComment.findById(commentId)
      .withDeleted()
      .session(session);
    if (!comment) {
      throw CustomError.notFound("Comment", commentId);
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

    // Restore comment (idempotent - plugin handles this, including hooks for parent checks)
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

    emitToRooms(
      "task_comment:restored",
      {
        commentId: comment._id,
        taskId: comment.parent,
      },
      rooms
    );

    const populatedComment = await TaskComment.findById(comment._id)
      .populate(
        "createdBy",
        "_id fullName firstName lastName position role email profilePicture isPlatformUser isHod lastLogin isDeleted"
      )
      .populate(
        "mentions",
        "_id fullName firstName lastName position role email profilePicture isPlatformUser isHod lastLogin isDeleted"
      )
      .lean();

    successResponse(
      res,
      200,
      "Comment restored successfully",
      populatedComment
    );
  } catch (error) {
    await session.abortTransaction();
    logger.error("Restore Task Comment Error:", error);
    throw error;
  } finally {
    session.endSession();
  }
});
