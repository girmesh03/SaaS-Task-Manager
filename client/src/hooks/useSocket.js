/**
 * useSocket Hook
 *
 * Custom React hook for managing Socket.IO connection:
 * - Initializes socket connection on mount
 * - Registers event handlers from socketEvents.js
 * - Cleans up connection on unmount
 * - Returns socket instance and connection status
 *
 * Requirements: 18.1, 18.2
 */

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useStore } from "react-redux";
import {
  selectCurrentUser,
  selectIsAuthenticated,
} from "../redux/features/authSlice";
import {
  connect,
  disconnect,
  getSocket,
  isConnected,
} from "../services/socketService";
import {
  registerSocketEvents,
  unregisterSocketEvents,
} from "../services/socketEvents";

/**
 * useSocket Hook
 *
 * Manages Socket.IO connection lifecycle and provides socket instance
 *
 * @returns {Object} Socket instance and connection status
 * @returns {Object} socket - Socket.IO client instance
 * @returns {boolean} isConnected - Connection status
 */
const useSocket = () => {
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const store = useStore();

  // Initialize socket state from getSocket() to avoid setState in effect
  const [socket] = useState(() => getSocket());
  const [connected, setConnected] = useState(() => isConnected());

  useEffect(() => {
    // Only connect if user is authenticated
    if (!isAuthenticated || !user) {
      return;
    }

    // Connect to Socket.IO server
    connect(user);

    // Get socket instance
    const socketInstance = getSocket();

    // Register event handlers
    if (socketInstance) {
      registerSocketEvents(socketInstance, store);

      // Update connection status on connect/disconnect
      const handleConnect = () => {
        setConnected(true);
      };

      const handleDisconnect = () => {
        setConnected(false);
      };

      socketInstance.on("connect", handleConnect);
      socketInstance.on("disconnect", handleDisconnect);
    }

    // Cleanup on unmount or when user changes
    return () => {
      const socketInstance = getSocket();
      if (socketInstance) {
        unregisterSocketEvents(socketInstance);
        disconnect(user);
      }
    };
  }, [isAuthenticated, user, store]);

  return {
    socket,
    isConnected: connected,
  };
};

export default useSocket;
