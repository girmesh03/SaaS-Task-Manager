import Notification from "../models/Notification.js";
import { NOTIFICATION_TYPES } from "../utils/constants.js";
import logger from "../utils/logger.js";

/**
 * Notification Service
 *
 * Create and manage in-app notifications
 */

/**
 * Create notification
 * @param {object} data - Notification data
 * @param {object} options - Options (session)
 * @returns {Promise<object>} Created notification
 */
export const createNotification = async (data, { session } = {}) => {
  try {
    const notification = await Notification.create([data], { session });
    return notification[0];
  } catch (error) {
    logger.error({
      message: "Failed to create notification",
      error: error.message,
      data,
    });
    throw error;
  }
};

/**
 * Notify task created
 * @param {object} task - Task object
 * @param {array} recipients - Array of user IDs
 * @param {object} options - Options (session)
 * @returns {Promise<array>} Created notifications
 */
export const notifyTaskCreated = async (task, recipients, { session } = {}) => {
  const notifications = [];

  for (const recipientId of recipients) {
    const notification = await createNotification(
      {
        title: "New Task Created",
        message: `A new task has been created: ${
          task.title || task.description
        }`,
        type: NOTIFICATION_TYPES.CREATED,
        recipient: recipientId,
        entity: task._id,
        entityModel: task.taskType,
        organization: task.organization,
      },
      { session }
    );

    notifications.push(notification);
  }

  return notifications;
};

/**
 * Notify user mentioned in comment
 * @param {object} comment - Comment object
 * @param {array} mentionedUserIds - Array of mentioned user IDs
 * @param {object} options - Options (session)
 * @returns {Promise<array>} Created notifications
 */
export const notifyMention = async (
  comment,
  mentionedUserIds,
  { session } = {}
) => {
  const notifications = [];

  for (const userId of mentionedUserIds) {
    const notification = await createNotification(
      {
        title: "You were mentioned",
        message: `${comment.createdBy.firstName} ${comment.createdBy.lastName} mentioned you in a comment`,
        type: NOTIFICATION_TYPES.MENTION,
        recipient: userId,
        entity: comment._id,
        entityModel: "TaskComment",
        organization: comment.organization,
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
  notifyMention,
};
