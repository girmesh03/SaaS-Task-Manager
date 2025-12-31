import Notification from "../models/Notification.js";
import { NOTIFICATION_TYPES, SOCKET_EVENTS } from "../utils/constants.js";
import { emitNotificationEvent } from "../utils/socketEmitter.js";
import logger from "../utils/logger.js";

/**
 * Notification Service
 *
 * Create in-app notifications and emit real-time Socket.IO events.
 */

/**
 * Create notification and emit event
 * @param {object} data - Notification data
 * @param {object} options - Options (session)
 * @returns {Promise<object>} Created notification
 */
export const createNotification = async (data, { session } = {}) => {
  try {
    const [notification] = await Notification.create([data], { session });

    // Emit real-time event
    emitNotificationEvent(SOCKET_EVENTS.NOTIFICATION_CREATED || "notification:created", notification);

    return notification;
  } catch (error) {
    logger.error({
      message: "Failed to create notification",
      error: error.message,
      data,
    });
    // We don't usually throw here to avoid failing the main operation
    // but the template says "Errors logged...".
    // Actually, Notification creation IS part of the transaction usually.
    throw error;
  }
};

/**
 * Notify task created
 * @param {object} task - Task object
 * @param {array} recipientIds - Array of user IDs
 * @param {object} options - Options (session)
 */
export const notifyTaskCreated = async (task, recipientIds, { session } = {}) => {
  const notifications = [];
  for (const recipientId of recipientIds) {
    const notification = await createNotification(
      {
        title: "New Task Created",
        message: `A new task has been created: ${task.title || task.description}`,
        type: NOTIFICATION_TYPES.CREATED,
        recipient: recipientId,
        entity: task._id,
        entityModel: "BaseTask",
        organization: task.organization,
      },
      { session }
    );
    notifications.push(notification);
  }
  return notifications;
};

/**
 * Notify task assigned
 */
export const notifyTaskAssigned = async (task, recipientIds, { session } = {}) => {
  const notifications = [];
  for (const recipientId of recipientIds) {
    const notification = await createNotification(
      {
        title: "Task Assigned",
        message: `A task has been assigned to you: ${task.title || task.description}`,
        type: NOTIFICATION_TYPES.ASSIGNED,
        recipient: recipientId,
        entity: task._id,
        entityModel: "BaseTask",
        organization: task.organization,
      },
      { session }
    );
    notifications.push(notification);
  }
  return notifications;
};

/**
 * Notify user mentioned
 */
export const notifyMention = async (
  comment,
  mentionedUserIds,
  taskId,
  { session } = {}
) => {
  const notifications = [];
  for (const userId of mentionedUserIds) {
    const notification = await createNotification(
      {
        title: "You were mentioned",
        message: `${
          comment.createdBy?.firstName || "Someone"
        } mentioned you in a comment`,
        type: NOTIFICATION_TYPES.MENTION,
        recipient: userId,
        entity: taskId || comment.parent, // Use task ID as entity for easier navigation
        entityModel: "BaseTask",
        organization: comment.organization,
      },
      { session }
    );
    notifications.push(notification);
  }
  return notifications;
};

/**
 * Notify task updated
 */
export const notifyTaskUpdated = async (task, recipientIds, { session } = {}) => {
  const notifications = [];
  for (const recipientId of recipientIds) {
    const notification = await createNotification(
      {
        title: "Task Updated",
        message: `A task you watch has been updated: ${task.title || task.description}`,
        type: NOTIFICATION_TYPES.UPDATED || "UPDATED",
        recipient: recipientId,
        entity: task._id,
        entityModel: "BaseTask",
        organization: task.organization,
      },
      { session }
    );
    notifications.push(notification);
  }
  return notifications;
};

/**
 * Notify task deleted
 */
export const notifyTaskDeleted = async (task, recipientIds, { session } = {}) => {
  const notifications = [];
  for (const recipientId of recipientIds) {
    const notification = await createNotification(
       {
        title: "Task Deleted",
        message: `A task you watch has been deleted: ${task.title || task.description}`,
        type: NOTIFICATION_TYPES.DELETED || "DELETED",
        recipient: recipientId,
        entity: task._id,
        entityModel: "BaseTask",
        organization: task.organization,
      },
      { session }
    );
    notifications.push(notification);
  }
  return notifications;
};

export default {
  createNotification,
  notifyTaskCreated,
  notifyTaskAssigned,
  notifyTaskUpdated,
  notifyTaskDeleted,
  notifyMention,
};
