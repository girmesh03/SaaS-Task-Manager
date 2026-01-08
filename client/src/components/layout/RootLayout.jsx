/**
 * RootLayout Component - Top Level App Wrapper
 *
 * Provides the root layout structure with:
 * - Theme provider (AppTheme)
 * - CSS baseline reset
 * - Toast notifications container
 * - Outlet for child routes
 *
 * Note: Socket initialization is handled in DashboardLayout after user authentication.
 *
 * Requirements: 17.1, 17.9, 9.4
 */

import { Outlet } from "react-router";
import { useTheme } from "@mui/material/styles";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Box } from "@mui/material";


const RootLayout = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100dvh",
        overflow: "hidden",
        bgcolor: "background.default",
      }}
    >
      <Outlet />
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={theme.palette.mode === "dark" ? "dark" : "light"}
      />
    </Box>
  );
};

export default RootLayout;
