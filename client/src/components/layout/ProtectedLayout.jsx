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

import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router";
import { Box, Toolbar, useTheme } from "@mui/material";
import Header from "./Header";
import Sidebar from "./Sidebar";
import useSocket from "../../hooks/useSocket";
import useResponsive from "../../hooks/useResponsive";

const ProtectedLayout = () => {
  const theme = useTheme();
  const { isMobile } = useResponsive();
  const location = useLocation();

  // Initialize sidebar state based on screen size
  const [sidebarOpen, setSidebarOpen] = useState(() => !isMobile);

  // Initialize Socket.IO connection via hook
  useSocket();

  // Close sidebar on route change for mobile
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  const handleSidebarToggle = () => {
    setSidebarOpen((prev) => !prev);
  };

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
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

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
