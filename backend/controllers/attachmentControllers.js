import mongoose from "mongoose";
import asyncHandler from "express-async-handler";
import {
  Attachment,
  BaseTask,
  TaskActivity,
  TaskComment,
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
 * Attachment Controllers
 *
 * CRITICAL: All write operations use MongoDB transactions
 * CRITICAL: Socket.IO events AFTER commit
 * CRITICAL: Polymorphic Parent handling
 */

// Helper to resolve Task ID for socket room
// Replicated logic from TaskComment controller to ensure self-contained module
const resolveTaskId = async (parent, parentModel, session) => {
  if (parentModel === "BaseTask") return parent;
  if (parentModel === "TaskActivity") {
    const activity = await TaskActivity.findById(parent)
      .session(session)
      .select("parent");
    return activity ? activity.parent : null;
  }
  if (parentModel === "TaskComment") {
    const comment = await TaskComment.findById(parent)
      .session(session)
      .select("parent parentModel");
    if (!comment) return null;
    return resolveTaskId(comment.parent, comment.parentModel, session);
  }
  return null;
};

export const getAttachments = asyncHandler(async (req, res) => {
  const {
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
    parent,
    parentModel,
    deleted = "false",
  } = req.query;

  const filter = { organization: req.user.organization._id };
  if (parent) filter.parent = parent;
  if (parentModel) filter.parentModel = parentModel;

  let query = Attachment.find(filter);

  if (deleted === "true") query = query.withDeleted();
  else if (deleted === "only") query = query.onlyDeleted();

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort: { createdAt: -1 },
    populate: [{ path: "uploadedBy", select: "firstName lastName" }],
  };

  const attachments = await Attachment.paginate(query, options);

  paginatedResponse(
    res,
    200,
    "Attachments retrieved successfully",
    attachments.docs,
    {
      total: attachments.totalDocs,
      page: attachments.page,
      limit: attachments.limit,
      totalPages: attachments.totalPages,
      hasNextPage: attachments.hasNextPage,
      hasPrevPage: attachments.hasPrevPage,
    }
  );
});

export const getAttachment = asyncHandler(async (req, res) => {
  const { resourceId } = req.params;

  const attachment = await Attachment.findById(resourceId)
    .populate("uploadedBy", "firstName lastName")
    .lean();

  if (!attachment) throw CustomError.notFound("Attachment not found");

  if (
    attachment.organization.toString() !== req.user.organization._id.toString()
  ) {
    throw CustomError.authorization(
      "You are not authorized to view this attachment"
    );
  }

  okResponse(res, "Attachment retrieved successfully", attachment);
});

export const createAttachment = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { filename, fileUrl, fileType, fileSize, parent, parentModel } =
      req.body;

    // Resolve Department from Parent for scoping
    let departmentId = null;

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

    const attachmentData = {
      filename,
      fileUrl,
      fileType: fileType.toUpperCase(), // Store normalized
      fileSize,
      parent,
      parentModel,
      department: departmentId,
      organization: req.user.organization._id,
      uploadedBy: req.user._id,
    };

    const [newAttachment] = await Attachment.create([attachmentData], {
      session,
    });

    const taskId = await resolveTaskId(parent, parentModel, session);

    await session.commitTransaction();

    const rooms = [
      `organization:${newAttachment.organization}`,
      `department:${newAttachment.department}`,
    ];
    if (taskId) rooms.push(`task:${taskId}`);

    emitToRooms(
      "attachment:created",
      {
        attachmentId: newAttachment._id,
        taskId: taskId,
        organizationId: newAttachment.organization,
      },
      rooms
    );

    const populatedAttachment = await Attachment.findById(newAttachment._id)
      .populate("uploadedBy", "firstName lastName")
      .lean();

    createdResponse(res, "Attachment created successfully", populatedAttachment);
  } catch (error) {
    await session.abortTransaction();
    logger.error("Create Attachment Error:", error);
    throw error;
  } finally {
    session.endSession();
  }
});

export const deleteAttachment = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { resourceId } = req.params;

    const attachment = await Attachment.findById(resourceId)
      .withDeleted()
      .session(session);
    if (!attachment) {
      throw CustomError.notFound("Attachment not found");
    }

    if (
      attachment.organization.toString() !== req.user.organization._id.toString()
    ) {
      throw CustomError.authorization(
        "You are not authorized to delete this attachment"
      );
    }

    if (attachment.isDeleted) {
      await session.abortTransaction();
      return okResponse(res, "Attachment is already deleted", {
        attachmentId: attachment._id,
      });
    }

    // Soft delete
    await attachment.softDelete(req.user._id, { session });

    // Deleting an attachment usually means removing it from Cloudinary too,
    // BUT since we use Soft Delete, we KEEP it in Cloudinary for restore purposes.
    // Permanent deletion (TTL or explicit hard delete) should remove from Cloudinary.
    // Spec softDelete-doc.md says "Delete in Cloudinary" on hard delete?
    // "Deletion Cascade Policy" -> Attachment is leaf.
    // For now, soft delete preserves file.

    const taskId = await resolveTaskId(
      attachment.parent,
      attachment.parentModel,
      session
    );

    await session.commitTransaction();

    const rooms = [
      `organization:${attachment.organization}`,
      `department:${attachment.department}`,
    ];
    if (taskId) rooms.push(`task:${taskId}`);

    emitToRooms(
      "attachment:deleted",
      {
        attachmentId: attachment._id,
        taskId: taskId,
      },
      rooms
    );

    successResponse(res, 200, "Attachment deleted successfully", {
      attachmentId: attachment._id,
    });
  } catch (error) {
    await session.abortTransaction();
    logger.error("Delete Attachment Error:", error);
    throw error;
  } finally {
    session.endSession();
  }
});

export const restoreAttachment = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { resourceId } = req.params;

    const attachment = await Attachment.findById(resourceId)
      .withDeleted()
      .session(session);
    if (!attachment) {
      throw CustomError.notFound("Attachment not found");
    }

    if (
      attachment.organization.toString() !== req.user.organization._id.toString()
    ) {
      throw CustomError.authorization(
        "You are not authorized to restore this attachment"
      );
    }

    if (!attachment.isDeleted) {
      await session.abortTransaction();
      return okResponse(res, "Attachment is already active", {
        attachmentId: attachment._id,
      });
    }

    // Check Parent Existence
    let ParentModel;
    if (attachment.parentModel === "BaseTask") ParentModel = BaseTask;
    else if (attachment.parentModel === "TaskActivity")
      ParentModel = TaskActivity;
    else if (attachment.parentModel === "TaskComment")
      ParentModel = TaskComment;

    const parent = await ParentModel.findById(attachment.parent)
      .withDeleted()
      .session(session);
    if (!parent || parent.isDeleted) {
      throw CustomError.validation(
        `Cannot restore attachment. Parent ${attachment.parentModel} is deleted or missing.`
      );
    }

    await attachment.restore(req.user._id, { session });

    const taskId = await resolveTaskId(
      attachment.parent,
      attachment.parentModel,
      session
    );

    await session.commitTransaction();

    const rooms = [
      `organization:${attachment.organization}`,
      `department:${attachment.department}`,
    ];
    if (taskId) rooms.push(`task:${taskId}`);

    emitToRooms(
      "attachment:restored",
      {
        attachmentId: attachment._id,
        taskId: taskId,
      },
      rooms
    );

    const populatedAttachment = await Attachment.findById(attachment._id)
      .populate("uploadedBy", "firstName lastName")
      .lean();

    successResponse(res, 200, "Attachment restored successfully", populatedAttachment);
  } catch (error) {
    await session.abortTransaction();
    logger.error("Restore Attachment Error:", error);
    throw error;
  } finally {
    session.endSession();
  }
});
