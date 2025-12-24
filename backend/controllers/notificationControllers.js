import mongoose from "mongoose";
import { Notification } from "../models/index.js";
import CustomError from "../errorHandler/CustomError.js";
import { emitToRooms } from "../utils/socketEmitter.js";
import { PAGINATION } from "../utils/constants.js";
import logger from "../utils/logger.js";

/**
 * Notification Controllers
 *
 * CRITICAL: SCOPED TO RECIPIENT (req.user._id)
 * CRITICAL: No Soft Delete (Ephemeral)
 */

export const getNotifications = async (req, res, next) => {
  try {
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

    res.status(200).json({
      success: true,
      message: "Notifications retrieved successfully",
      data: notifications,
    });
  } catch (error) {
    logger.error("Get Notifications Error:", error);
    return next(CustomError.internal("Failed to retrieve notifications", { error: error.message }));
  }
};

export const getNotification = async (req, res, next) => {
  try {
    const { resourceId } = req.params;

    const notification = await Notification.findById(resourceId).lean();

    if (!notification) return next(CustomError.notFound("Notification not found"));

    if (notification.recipient.toString() !== req.user._id.toString()) {
      return next(CustomError.authorization("You are not authorized to view this notification"));
    }

    res.status(200).json({
      success: true,
      message: "Notification retrieved successfully",
      data: notification,
    });
  } catch (error) {
    logger.error("Get Notification Error:", error);
    return next(CustomError.internal("Failed to retrieve notification", { error: error.message }));
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { resourceId } = req.params;

    const notification = await Notification.findById(resourceId);

    if (!notification) return next(CustomError.notFound("Notification not found"));

    if (notification.recipient.toString() !== req.user._id.toString()) {
      return next(CustomError.authorization("You are not authorized to update this notification"));
    }

    if (!notification.isRead) {
      notification.isRead = true;
      await notification.save();
      // Optional: Emit socket event "notification:updated" to user room if we tracked read status live
    }

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error) {
    logger.error("Mark Notification Read Error:", error);
    return next(CustomError.internal("Failed to mark notification as read", { error: error.message }));
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      data: { modifiedCount: result.modifiedCount },
    });
  } catch (error) {
    logger.error("Mark All Notifications Read Error:", error);
    return next(CustomError.internal("Failed to mark all notifications as read", { error: error.message }));
  }
};

export const deleteNotification = async (req, res, next) => {
  try {
    const { resourceId } = req.params;

    const notification = await Notification.findById(resourceId);

    if (!notification) return next(CustomError.notFound("Notification not found"));

    if (notification.recipient.toString() !== req.user._id.toString()) {
      return next(CustomError.authorization("You are not authorized to delete this notification"));
    }

    await notification.deleteOne();

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
      data: { notificationId: resourceId },
    });
  } catch (error) {
    logger.error("Delete Notification Error:", error);
    return next(CustomError.internal("Failed to delete notification", { error: error.message }));
  }
};
