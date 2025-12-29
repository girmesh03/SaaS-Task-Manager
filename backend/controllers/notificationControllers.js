import mongoose from "mongoose";
import asyncHandler from "express-async-handler";
import { Notification } from "../models/index.js";
import CustomError from "../errorHandler/CustomError.js";
import { PAGINATION } from "../utils/constants.js";
import {
  okResponse,
  paginatedResponse,
  successResponse,
} from "../utils/responseTransform.js";

/**
 * Notification Controllers
 *
 * CRITICAL: SCOPED TO RECIPIENT (req.user._id)
 * CRITICAL: Ephemeral with Soft Delete TTL
 */


export const getNotifications = asyncHandler(async (req, res) => {
  const {
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
    isRead,
    type,
  } = req.validated.query;

  const filter = { recipient: req.user._id };

  if (isRead !== undefined) {
    filter.isRead = isRead === "true";
  }
  if (type) {
    filter.type = type;
  }

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort: { isRead: 1, createdAt: -1 }, // Unread first, then newest
  };

  const notifications = await Notification.paginate(filter, options);

  paginatedResponse(
    res,
    200,
    "Notifications retrieved successfully",
    notifications.docs,
    {
      total: notifications.totalDocs,
      page: notifications.page,
      limit: notifications.limit,
      totalPages: notifications.totalPages,
      hasNextPage: notifications.hasNextPage,
      hasPrevPage: notifications.hasPrevPage,
    }
  );
});

export const getNotification = asyncHandler(async (req, res) => {
  const { notificationId } = req.validated.params;

  const notification = await Notification.findById(notificationId).lean();

  if (!notification) throw CustomError.notFound("Notification", notificationId);

  if (notification.recipient.toString() !== req.user._id.toString()) {
    throw CustomError.authorization(
      "You are not authorized to view this notification"
    );
  }

  okResponse(res, "Notification retrieved successfully", notification);
});

export const markAsRead = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { notificationId } = req.validated.params;

    const notification = await Notification.findById(notificationId).session(session);

    if (!notification) throw CustomError.notFound("Notification", notificationId);

    if (notification.recipient.toString() !== req.user._id.toString()) {
      throw CustomError.authorization(
        "You are not authorized to update this notification"
      );
    }

    if (!notification.isRead) {
      notification.isRead = true;
      await notification.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    okResponse(res, "Notification marked as read", notification);
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    throw error;
  }
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const result = await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    okResponse(res, "All notifications marked as read", {
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    throw error;
  }
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { notificationId } = req.validated.params;

    const notification = await Notification.findById(notificationId).session(session);

    if (!notification) throw CustomError.notFound("Notification", notificationId);

    if (notification.recipient.toString() !== req.user._id.toString()) {
      throw CustomError.authorization(
        "You are not authorized to delete this notification"
      );
    }

    // Use softDelete as required by the universal plugin
    await notification.softDelete(req.user._id, { session });

    await session.commitTransaction();
    session.endSession();

    successResponse(res, 200, "Notification deleted successfully", {
      notificationId: notificationId,
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    throw error;
  }
});
