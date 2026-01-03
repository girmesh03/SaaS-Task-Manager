/**
 * DashboardLayout Component - Authenticated User Layout
 *
 * Requirements: 17.2, 9.4
 */

import { useState, useEffect } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { Box, Toolbar, useMediaQuery, useTheme } from "@mui/material";
import { useSelector } from "react-redux";
import { selectCurrentUser, selectIsLoading } from "../../redux/features/authSlice";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import Breadcrumbs from "./Breadcrumbs";
import MuiLoading from "../common/MuiLoading";

const DashboardLayout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const user = useSelector(selectCurrentUser);
  const isLoading = useSelector(selectIsLoading);
  const location = useLocation();

  // Close sidebar on route change for mobile
  useEffect(() => {
    if (isMobile) {
      // eslint-disable-next-line
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  // Adjust sidebar default state on screen resize
  useEffect(() => {
    // eslint-disable-next-line
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (isLoading) {
    return <MuiLoading message="Checking authentication..." />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header onMenuClick={handleSidebarToggle} />

      <Box sx={{ display: "flex", flex: 1 }}>
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { md: `calc(100% - ${sidebarOpen ? 240 : 65}px)` },
            display: "flex",
            flexDirection: "column",
            transition: theme.transitions.create(["width", "margin"], {
               easing: theme.transitions.easing.sharp,
               duration: theme.transitions.duration.enteringScreen,
            }),
          }}
        >
          <Toolbar /> {/* Spacer for fixed Header */}
          <Breadcrumbs />
          <Outlet />
          <Footer />
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardLayout;
