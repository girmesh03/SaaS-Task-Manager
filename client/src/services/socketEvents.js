/**
 * Socket.IO Event Handlers
 *
 * Handles real-time events from Socket.IO server:
 * - Task events (created, updated, deleted, restored)
 * - Activity events (created)
 * - Comment events (created)
 * - Notification events (created)
 * - User status events (online, offline)
 *
 * Each handler invalidates appropriate RTK Query cache tags
 * and shows toast notifications for user feedback.
 *
 * Requirements: 18.3, 18.4, 18.5, 18.6, 18.7, 18.8, 18.9, 18.10
 */

import { toast } from "react-toastify";

/**
 * Register all Socket.IO event handlers
 *
 * @param {Object} socket - Socket.IO client instance
 * @param {Object} store - Redux store instance for cache invalidation
 */
export const registerSocketEvents = (socket, store) => {
  if (!socket || !store) {
    console.error(
      "Cannot register socket events: socket and store are required"
    );
    return;
  }

  // Task Events
  socket.on("task:created", (data) => {
    handleTaskCreated(data, store);
  });

  socket.on("task:updated", (data) => {
    handleTaskUpdated(data, store);
  });

  socket.on("task:deleted", (data) => {
    handleTaskDeleted(data, store);
  });

  socket.on("task:restored", (data) => {
    handleTaskRestored(data, store);
  });

  // Activity Events
  socket.on("activity:created", (data) => {
    handleActivityCreated(data, store);
  });

  // Comment Events
  socket.on("comment:created", (data) => {
    handleCommentCreated(data, store);
  });

  // Notification Events
  socket.on("notification:created", (data) => {
    handleNotificationCreated(data, store);
  });

  // User Status Events
  socket.on("user:online", (data) => {
    handleUserOnline(data, store);
  });

  socket.on("user:offline", (data) => {
    handleUserOffline(data, store);
  });

  console.log("Socket.IO event handlers registered");
};

/**
 * Unregister all Socket.IO event handlers
 *
 * @param {Object} socket - Socket.IO client instance
 */
export const unregisterSocketEvents = (socket) => {
  if (!socket) {
    return;
  }

  // Remove all event listeners
  socket.off("task:created");
  socket.off("task:updated");
  socket.off("task:deleted");
  socket.off("task:restored");
  socket.off("activity:created");
  socket.off("comment:created");
  socket.off("notification:created");
  socket.off("user:online");
  socket.off("user:offline");

  console.log("Socket.IO event handlers unregistered");
};

// ============================================================================
// Task Event Handlers
// ============================================================================

/**
 * Handle task:created event
 *
 * Invalidates Task cache and shows toast notification
 *
 * @param {Object} data - Task data from server
 * @param {Object} store - Redux store instance
 */
const handleTaskCreated = (data, store) => {
  console.log("Task created:", data);

  // Invalidate Task cache to refetch list
  store.dispatch({
    type: "api/invalidateTags",
    payload: ["Task"],
  });

  // Show toast notification
  const taskTitle =
    data.title || data.description?.substring(0, 50) || "New task";
  toast.success(`New task created: ${taskTitle}`, {
    position: "top-right",
    autoClose: 3000,
  });
};

/**
 * Handle task:updated event
 *
 * Invalidates specific Task cache and shows toast notification
 *
 * @param {Object} data - Task data from server
 * @param {Object} store - Redux store instance
 */
const handleTaskUpdated = (data, store) => {
  console.log("Task updated:", data);

  // Invalidate specific Task cache and list
  store.dispatch({
    type: "api/invalidateTags",
    payload: ["Task", { type: "Task", id: data._id }],
  });

  // Show toast notification
  const taskTitle = data.title || data.description?.substring(0, 50) || "Task";
  toast.info(`Task updated: ${taskTitle}`, {
    position: "top-right",
    autoClose: 3000,
  });
};

/**
 * Handle task:deleted event
 *
 * Invalidates Task cache and shows toast notification
 *
 * @param {Object} data - Task data from server
 * @param {Object} store - Redux store instance
 */
const handleTaskDeleted = (data, store) => {
  console.log("Task deleted:", data);

  // Invalidate Task cache to refetch list
  store.dispatch({
    type: "api/invalidateTags",
    payload: ["Task"],
  });

  // Show toast notification
  const taskTitle = data.title || data.description?.substring(0, 50) || "Task";
  toast.warning(`Task deleted: ${taskTitle}`, {
    position: "top-right",
    autoClose: 3000,
  });
};

/**
 * Handle task:restored event
 *
 * Invalidates Task cache and shows toast notification
 *
 * @param {Object} data - Task data from server
 * @param {Object} store - Redux store instance
 */
const handleTaskRestored = (data, store) => {
  console.log("Task restored:", data);

  // Invalidate Task cache to refetch list
  store.dispatch({
    type: "api/invalidateTags",
    payload: ["Task"],
  });

  // Show toast notification
  const taskTitle = data.title || data.description?.substring(0, 50) || "Task";
  toast.success(`Task restored: ${taskTitle}`, {
    position: "top-right",
    autoClose: 3000,
  });
};

// ============================================================================
// Activity Event Handlers
// ============================================================================

/**
 * Handle activity:created event
 *
 * Invalidates TaskActivity cache and shows toast notification
 *
 * @param {Object} data - Activity data from server
 * @param {Object} store - Redux store instance
 */
const handleActivityCreated = (data, store) => {
  console.log("Activity created:", data);

  // Invalidate TaskActivity cache to refetch list
  store.dispatch({
    type: "api/invalidateTags",
    payload: ["TaskActivity"],
  });

  // Show toast notification
  const activityText = data.activity?.substring(0, 50) || "New activity";
  toast.success(`New activity added: ${activityText}`, {
    position: "top-right",
    autoClose: 3000,
  });
};

// ============================================================================
// Comment Event Handlers
// ============================================================================

/**
 * Handle comment:created event
 *
 * Invalidates TaskComment cache and shows toast notification
 *
 * @param {Object} data - Comment data from server
 * @param {Object} store - Redux store instance
 */
const handleCommentCreated = (data, store) => {
  console.log("Comment created:", data);

  // Invalidate TaskComment cache to refetch list
  store.dispatch({
    type: "api/invalidateTags",
    payload: ["TaskComment"],
  });

  // Show toast notification
  const commentText = data.comment?.substring(0, 50) || "New comment";
  toast.success(`New comment added: ${commentText}`, {
    position: "top-right",
    autoClose: 3000,
  });
};

// ============================================================================
// Notification Event Handlers
// ============================================================================

/**
 * Handle notification:created event
 *
 * Invalidates Notification cache and shows toast notification
 *
 * @param {Object} data - Notification data from server
 * @param {Object} store - Redux store instance
 */
const handleNotificationCreated = (data, store) => {
  console.log("Notification created:", data);

  // Invalidate Notification cache to refetch list
  store.dispatch({
    type: "api/invalidateTags",
    payload: ["Notification"],
  });

  // Show toast notification
  const notificationTitle = data.title || "New notification";
  toast.info(notificationTitle, {
    position: "top-right",
    autoClose: 5000,
  });
};

// ============================================================================
// User Status Event Handlers
// ============================================================================

/**
 * Handle user:online event
 *
 * Invalidates User cache to update status indicators
 *
 * @param {Object} data - User status data from server
 * @param {Object} store - Redux store instance
 */
const handleUserOnline = (data, store) => {
  console.log("User online:", data);

  // Invalidate User cache to update status
  store.dispatch({
    type: "api/invalidateTags",
    payload: [{ type: "User", id: data.userId }],
  });
};

/**
 * Handle user:offline event
 *
 * Invalidates User cache to update status indicators
 *
 * @param {Object} data - User status data from server
 * @param {Object} store - Redux store instance
 */
const handleUserOffline = (data, store) => {
  console.log("User offline:", data);

  // Invalidate User cache to update status
  store.dispatch({
    type: "api/invalidateTags",
    payload: [{ type: "User", id: data.userId }],
  });
};

export default {
  registerSocketEvents,
  unregisterSocketEvents,
};
