/**
 * Socket.IO Client Service
 *
 * Manages Socket.IO connection with:
 * - Automatic reconnection with exponential backoff
 * - Room-based event subscriptions (user, department, organization)
 * - User status tracking (online/offline)
 * - Connection state management
 *
 * Requirements: 18.1, 18.2
 */

import { io } from "socket.io-client";

// Socket.IO client instance
let socket = null;
let currentUser = null;
let disconnectTimeout = null;

/**
 * Connect to Socket.IO server and join rooms
 *
 * @param {Object} store - Redux store for accessing user state
 */
export const connect = (store) => {
  // Get user from store
  const state = store.getState();
  const user = state.auth?.user;

  if (!user) {
    console.warn("Cannot connect socket: user is not authenticated");
    return;
  }

  // If there is a pending disconnect for this user, cancel it
  if (disconnectTimeout) {
    if (currentUser?._id === user._id) {
      console.log("Socket.IO connection preserved (cancelled pending disconnect)");
      clearTimeout(disconnectTimeout);
      disconnectTimeout = null;

      // Ensure it's active
      if (socket && !socket.connected) {
         socket.connect();
      }
      return;
    } else {
      // Different user, allow the disconnect to happen immediately (or force it)
      // We will force it below by calling cleanup
      clearTimeout(disconnectTimeout);
      disconnectTimeout = null;
      performDisconnect();
    }
  }

  // If already connected/connecting with same user, check status and return
  if (socket && currentUser?._id === user._id) {
    if (!socket.connected) {
      socket.connect();
    }
    return;
  }

  // Disconnect existing socket if user changed (and no pending disconnect handled above)
  if (socket) {
    performDisconnect();
  }

  currentUser = user;

  // Get base URL from environment (remove /api suffix for socket connection)
  const baseURL =
    import.meta.env.VITE_API_URL?.replace("/api", "") ||
    "http://localhost:4000";

  // Initialize socket with authentication and reconnection configuration
  socket = io(baseURL, {
    auth: {
      userId: user._id,
      organizationId: user.organization?._id,
      departmentId: user.department?._id,
    },
    withCredentials: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 10,
    transports: ["websocket", "polling"],
    autoConnect: true,
  });

  // Handle successful connection
  socket.on("connect", () => {
    console.log("Socket.IO connected:", socket.id);

    // Join user-specific room
    socket.emit("join", `user:${user._id}`);

    // Join department room if user has department
    if (user.department?._id) {
      socket.emit("join", `department:${user.department._id}`);
    }

    // Join organization room if user has organization
    if (user.organization?._id) {
      socket.emit("join", `organization:${user.organization._id}`);
    }

    // Emit user online event
    socket.emit("user:online", {
      userId: user._id,
      status: "Online",
    });
  });

  // Handle disconnection
  socket.on("disconnect", (reason) => {
    console.log("Socket.IO disconnected:", reason);
  });

  // Handle connection errors
  socket.on("connect_error", (error) => {
    console.error("Socket.IO connection error:", error.message);
  });

  // Handle reconnection attempts
  socket.on("reconnect_attempt", (attemptNumber) => {
    console.log(`Socket.IO reconnection attempt ${attemptNumber}`);
  });

  // Handle successful reconnection
  socket.on("reconnect", (attemptNumber) => {
    console.log(`Socket.IO reconnected after ${attemptNumber} attempts`);
  });

  // Handle reconnection failure
  socket.on("reconnect_failed", () => {
    console.error("Socket.IO reconnection failed after maximum attempts");
  });
};

/**
 * Disconnect from Socket.IO server and cleanup
 *
 * Uses a delay to handle React Strict Mode unmount/remount cycles.
 */
export const disconnect = () => {
  if (!socket) {
    return;
  }

  // Clear any existing timeout
  if (disconnectTimeout) {
    clearTimeout(disconnectTimeout);
  }

  // Set timeout to perform the actual disconnect
  disconnectTimeout = setTimeout(() => {
    performDisconnect();
    disconnectTimeout = null;
  }, 1000); // 1 second delay should be plenty for Strict Mode or quick nav
};

/**
 * internal function to actually perform the disconnect logic
 */
const performDisconnect = () => {
  if (!socket) return;

  // Emit user offline event before disconnecting
  if (currentUser) {
    // We try/catch this as socket might be closed
    try {
      if (socket.connected) {
         socket.emit("user:offline", {
            userId: currentUser._id,
            status: "Offline",
          });
      }
    } catch {
      // ignore
    }
  }

  // Remove all event listeners first
  socket.removeAllListeners();

  // Disconnect socket if connected
  if (socket.connected) {
    socket.disconnect();
  } else {
    socket.disconnect();
  }

  // Clear references
  socket = null;
  currentUser = null;

  console.log("Socket.IO disconnected and cleaned up");
};

/**
 * Get current socket instance
 *
 * @returns {Object|null} Socket.IO client instance or null
 */
export const getSocket = () => {
  return socket;
};

/**
 * Check if socket is connected
 *
 * @returns {boolean} True if socket is connected
 */
export const isConnected = () => {
  return socket?.connected || false;
};

/**
 * Subscribe to a socket event
 *
 * @param {string} event - Event name
 * @param {Function} callback - Event handler
 */
export const on = (event, callback) => {
  if (socket) {
    socket.on(event, callback);
  }
};

/**
 * Unsubscribe from a socket event
 *
 * @param {string} event - Event name
 * @param {Function} callback - Event handler (optional)
 */
export const off = (event, callback) => {
  if (socket) {
    if (callback) {
      socket.off(event, callback);
    } else {
      socket.off(event);
    }
  }
};

/**
 * Emit a socket event
 *
 * @param {string} event - Event name
 * @param {any} data - Event data
 */
export const emit = (event, data) => {
  if (socket?.connected) {
    socket.emit(event, data);
  }
};

export default {
  connect,
  disconnect,
  getSocket,
  isConnected,
  on,
  off,
  emit,
};
