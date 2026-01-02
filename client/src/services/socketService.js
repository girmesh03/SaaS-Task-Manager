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

/**
 * Initialize Socket.IO connection
 *
 * @param {Object} user - Authenticated user object
 * @returns {Object} Socket.IO client instance
 */
export const initializeSocket = (user) => {
  if (socket && socket.connected) {
    return socket;
  }

  // Get base URL from environment (remove /api suffix for socket connection)
  const baseURL =
    import.meta.env.VITE_API_URL?.replace("/api", "") ||
    "http://localhost:4000";

  // Initialize socket with authentication and reconnection configuration
  socket = io(baseURL, {
    auth: {
      user,
    },
    reconnection: true,
    reconnectionDelay: 1000, // Start with 1 second delay
    reconnectionDelayMax: 5000, // Max 5 seconds between attempts
    reconnectionAttempts: 5, // Try 5 times before giving up
    transports: ["websocket", "polling"], // Prefer websocket, fallback to polling
  });

  return socket;
};

/**
 * Connect to Socket.IO server and join rooms
 *
 * @param {Object} user - Authenticated user object with _id, department, organization
 */
export const connect = (user) => {
  if (!user) {
    console.error("Cannot connect socket: user is required");
    return;
  }

  // Initialize socket if not already initialized
  if (!socket) {
    initializeSocket(user);
  }

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
 * @param {Object} user - Authenticated user object
 */
export const disconnect = (user) => {
  if (!socket) {
    return;
  }

  // Emit user offline event before disconnecting
  if (user) {
    socket.emit("user:offline", {
      userId: user._id,
      status: "Offline",
    });
  }

  // Disconnect socket
  socket.disconnect();

  // Remove all event listeners
  socket.removeAllListeners();

  // Clear socket instance
  socket = null;

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

export default {
  initializeSocket,
  connect,
  disconnect,
  getSocket,
  isConnected,
};
