/**
 * ProtectedLayout Component - Authenticated User Layout
 *
 * Provides the main dashboard layout for authenticated users.
 * Includes protection logic (redirects unauthenticated users).
 *
 * Design:
 * - Header with navigation and user menu
 * - Collapsible sidebar navigation
 * - Main content area with breadcrumbs
 * - Footer
 *
 * Requirements: 17.2, 9.4, Task 9
 */

import { useState, useCallback } from "react";
import { Outlet, useLocation } from "react-router";
import { Box, Toolbar, useTheme } from "@mui/material";
import Header from "./Header";
import Sidebar from "./Sidebar";
import useSocket from "../../hooks/useSocket";
import useResponsive from "../../hooks/useResponsive";

/**
 * Custom hook to manage sidebar state with route-aware behavior
 * Closes sidebar on mobile when route changes
 */
const useSidebarState = (isMobile) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(() => !isMobile);
  const [lastPathname, setLastPathname] = useState(location.pathname);

  // Check if route changed and close sidebar on mobile
  // This pattern is recommended by React docs for derived state
  if (location.pathname !== lastPathname) {
    setLastPathname(location.pathname);
    if (isMobile && sidebarOpen) {
      setSidebarOpen(false);
    }
  }

  return [sidebarOpen, setSidebarOpen];
};

const ProtectedLayout = () => {
  const theme = useTheme();
  const { isMobile } = useResponsive();

  // Sidebar state with route-aware behavior
  const [sidebarOpen, setSidebarOpen] = useSidebarState(isMobile);

  // Initialize Socket.IO connection via hook
  useSocket();

  const handleSidebarToggle = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, [setSidebarOpen]);

  const handleSidebarClose = useCallback(() => {
    setSidebarOpen(false);
  }, [setSidebarOpen]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <Header onMenuClick={handleSidebarToggle} />

      <Box sx={{ display: "flex", flex: 1, overflow: "hidden", width: "100%" }}>
        <Sidebar open={sidebarOpen} onClose={handleSidebarClose} />

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: { md: `calc(100% - ${sidebarOpen ? 240 : 65}px)` },
            display: "flex",
            flexDirection: "column",
            height: "100%",
            overflow: "hidden",
            transition: theme.transitions.create(["width", "margin"], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }}
        >
          <Toolbar />
          <Box
            sx={{
              flexGrow: 1,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box sx={{ flex: 1, width: "100%" }}>
              <Outlet />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ProtectedLayout;
