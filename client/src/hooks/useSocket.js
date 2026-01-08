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
import { useStore } from "react-redux";
import useAuth from "./useAuth";
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
  const { user, isAuthenticated } = useAuth();
  const store = useStore();

  // Initialize socket state from getSocket() to avoid setState in effect
  const [socket] = useState(() => getSocket());
  const [connected, setConnected] = useState(() => isConnected());

  useEffect(() => {
    // Only connect if user is authenticated and has an ID
    if (!isAuthenticated || !user?._id) {
      return;
    }

    // Connect to Socket.IO server utilizing the robust service
    // Pass the store as required by the updated service signature
    connect(store);

    // Get socket instance to attach local listeners if needed
    // Note: ensure we get the latest instance after connect
    const socketInstance = getSocket();

    // Register global application event handlers
    // Ideally this might be better placed inside the service's connect method to avoid duplication,
    // but preserving existing structure:
    if (socketInstance) {
      registerSocketEvents(socketInstance, store);

      // Update local state based on socket events
      const handleConnect = () => setConnected(true);
      const handleDisconnect = () => setConnected(false);

      socketInstance.on("connect", handleConnect);
      socketInstance.on("disconnect", handleDisconnect);

      // Cleanup function
      return () => {
        unregisterSocketEvents(socketInstance);

        // Remove local listeners
        socketInstance.off("connect", handleConnect);
        socketInstance.off("disconnect", handleDisconnect);

        // Disconnect using the service which now handles safe disconnection
        disconnect();
      };
    }
  }, [isAuthenticated, user?._id, store]);

  return {
    socket,
    isConnected: connected,
  };
};

export default useSocket;
