import { USER_STATUS } from "./constants.js";

/**
 * User Status Tracking Utilities
 *
 * Manage user online/offline/away status
 */

// In-memory store for user status (in production, use Redis)
const userStatusStore = new Map();

/**
 * Set user status
 * @param {string} userId - User ID
 * @param {string} status - Status (Online, Offline, Away)
 */
export const setUserStatus = (userId, status) => {
  userStatusStore.set(userId.toString(), {
    status,
    lastSeen: new Date(),
  });
};

/**
 * Get user status
 * @param {string} userId - User ID
 * @returns {object} { status, lastSeen }
 */
export const getUserStatus = (userId) => {
  return (
    userStatusStore.get(userId.toString()) || {
      status: USER_STATUS.OFFLINE,
      lastSeen: null,
    }
  );
};

/**
 * Remove user status
 * @param {string} userId - User ID
 */
export const removeUserStatus = (userId) => {
  userStatusStore.delete(userId.toString());
};

/**
 * Get all online users
 * @returns {array} Array of user IDs
 */
export const getOnlineUsers = () => {
  const onlineUsers = [];

  userStatusStore.forEach((value, key) => {
    if (value.status === USER_STATUS.ONLINE) {
      onlineUsers.push(key);
    }
  });

  return onlineUsers;
};

/**
 * Check if user is online
 * @param {string} userId - User ID
 * @returns {boolean} True if user is online
 */
export const isUserOnline = (userId) => {
  const status = getUserStatus(userId);
  return status.status === USER_STATUS.ONLINE;
};

/**
 * Update user last seen
 * @param {string} userId - User ID
 */
export const updateLastSeen = (userId) => {
  const currentStatus = getUserStatus(userId);
  userStatusStore.set(userId.toString(), {
    ...currentStatus,
    lastSeen: new Date(),
  });
};
