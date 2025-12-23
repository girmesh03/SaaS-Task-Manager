import { Server } from "socket.io";
import corsOptions from "../config/corsOptions.js";

/**
 * Socket.IO Singleton Instance
 *
 * Ensures single Socket.IO server instance across application
 */

let io = null;

/**
 * Initialize Socket.IO server
 * @param {object} httpServer - HTTP server instance
 * @returns {Server} Socket.IO server instance
 */
export const initializeSocket = (httpServer) => {
  if (io) {
    return io;
  }

  io = new Server(httpServer, {
    cors: {
      origin: corsOptions.origin,
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  return io;
};

/**
 * Get Socket.IO server instance
 * @returns {Server} Socket.IO server instance
 * @throws {Error} If Socket.IO not initialized
 */
export const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO not initialized. Call initializeSocket first.");
  }
  return io;
};

export default {
  initializeSocket,
  getIO,
};
