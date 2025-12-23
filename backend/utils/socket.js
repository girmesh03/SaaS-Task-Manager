import { getIO } from "./socketInstance.js";
import { setUserStatus, removeUserStatus } from "./userStatus.js";
import { USER_STATUS, SOCKET_EVENTS } from "./constants.js";
import logger from "./logger.js";

/**
 * Socket.IO Event Handlers
 *
 * Handles connection, disconnection, and room management
 */

/**
 * Setup Socket.IO event handlers
 */
export const setupSocketHandlers = () => {
  const io = getIO();

  io.on(SOCKET_EVENTS.CONNECTION, (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Get user from socket handshake (set by auth middleware)
    const user = socket.handshake.auth.user;

    if (user) {
      // Join user-specific room
      socket.join(`user:${user._id}`);

      // Join department room
      if (user.department) {
        socket.join(`department:${user.department._id}`);
      }

      // Join organization room
      if (user.organization) {
        socket.join(`organization:${user.organization._id}`);
      }

      // Set user status to online
      setUserStatus(user._id, USER_STATUS.ONLINE);

      // Emit user online event
      io.to(`department:${user.department._id}`).emit(
        SOCKET_EVENTS.USER_ONLINE,
        {
          userId: user._id,
          status: USER_STATUS.ONLINE,
        }
      );

      logger.info(`User ${user._id} joined rooms`);
    }

    // Handle disconnection
    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      logger.info(`Socket disconnected: ${socket.id}`);

      if (user) {
        // Set user status to offline
        setUserStatus(user._id, USER_STATUS.OFFLINE);

        // Emit user offline event
        io.to(`department:${user.department._id}`).emit(
          SOCKET_EVENTS.USER_OFFLINE,
          {
            userId: user._id,
            status: USER_STATUS.OFFLINE,
          }
        );

        // Leave all rooms
        socket.leave(`user:${user._id}`);
        if (user.department) {
          socket.leave(`department:${user.department._id}`);
        }
        if (user.organization) {
          socket.leave(`organization:${user.organization._id}`);
        }
      }
    });
  });
};

export default setupSocketHandlers;
