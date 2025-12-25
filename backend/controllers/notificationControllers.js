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
 * CRITICAL: No Soft Delete (Ephemeral)
 */

export const getNotifications = asyncHandler(async (req, res) => {
  const {
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
    isRead,
    type,
  } = req.query;

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
  const { resourceId } = req.params;

  const notification = await Notification.findById(resourceId).lean();

  if (!notification) throw CustomError.notFound("Notification not found");

  if (notification.recipient.toString() !== req.user._id.toString()) {
    throw CustomError.authorization(
      "You are not authorized to view this notification"
    );
  }

  okResponse(res, "Notification retrieved successfully", notification);
});

export const markAsRead = asyncHandler(async (req, res) => {
  const { resourceId } = req.params;

  const notification = await Notification.findById(resourceId);

  if (!notification) throw CustomError.notFound("Notification not found");

  if (notification.recipient.toString() !== req.user._id.toString()) {
    throw CustomError.authorization(
      "You are not authorized to update this notification"
    );
  }

  if (!notification.isRead) {
    notification.isRead = true;
    await notification.save();
  }

  okResponse(res, "Notification marked as read", notification);
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { $set: { isRead: true } }
  );

  okResponse(res, "All notifications marked as read", {
    modifiedCount: result.modifiedCount,
  });
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const { resourceId } = req.params;

  const notification = await Notification.findById(resourceId);

  if (!notification) throw CustomError.notFound("Notification not found");

  if (notification.recipient.toString() !== req.user._id.toString()) {
    throw CustomError.authorization(
      "You are not authorized to delete this notification"
    );
  }

  await notification.deleteOne();

  successResponse(res, 200, "Notification deleted successfully", {
    notificationId: resourceId,
  });
});
