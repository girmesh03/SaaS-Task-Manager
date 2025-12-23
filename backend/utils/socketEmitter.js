import { getIO } from "./socketInstance.js";
import { SOCKET_EVENTS } from "./constants.js";
import logger from "./logger.js";

/**
 * Socket.IO Event Emitters
 *
 * Emit events to specific rooms
 */

/**
 * Emit event to specific rooms
 * @param {string} event - Event name
 * @param {any} data - Event data
 * @param {array} rooms - Array of room names
 */
export const emitToRooms = (event, data, rooms) => {
  try {
    const io = getIO();
    rooms.forEach((room) => {
      io.to(room).emit(event, data);
    });
    logger.debug(`Emitted ${event} to rooms: ${rooms.join(", ")}`);
  } catch (error) {
    logger.error(`Failed to emit ${event}: ${error.message}`);
  }
};

/**
 * Emit task event
 * @param {string} event - Event name (task:created, task:updated, etc.)
 * @param {object} task - Task object
 */
export const emitTaskEvent = (event, task) => {
  const rooms = [
    `department:${task.department}`,
    `organization:${task.organization}`,
  ];
  emitToRooms(event, task, rooms);
};

/**
 * Emit activity event
 * @param {string} event - Event name
 * @param {object} activity - Activity object
 */
export const emitActivityEvent = (event, activity) => {
  const rooms = [
    `department:${activity.department}`,
    `organization:${activity.organization}`,
  ];
  emitToRooms(event, activity, rooms);
};

/**
 * Emit comment event
 * @param {string} event - Event name
 * @param {object} comment - Comment object
 */
export const emitCommentEvent = (event, comment) => {
  const rooms = [
    `department:${comment.department}`,
    `organization:${comment.organization}`,
  ];
  emitToRooms(event, comment, rooms);
};

/**
 * Emit notification event
 * @param {string} event - Event name
 * @param {object} notification - Notification object
 */
export const emitNotificationEvent = (event, notification) => {
  const rooms = [`user:${notification.recipient}`];
  emitToRooms(event, notification, rooms);
};

export default {
  emitToRooms,
  emitTaskEvent,
  emitActivityEvent,
  emitCommentEvent,
  emitNotificationEvent,
};
