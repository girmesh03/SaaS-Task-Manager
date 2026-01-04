/**
 * RootLayout Component - Top Level App Wrapper
 *
 * Requirements: 17.1, 17.9, 9.4
 */

import { useEffect } from "react";
import { Outlet } from "react-router";
import { CssBaseline, Box, Typography } from "@mui/material";
import { ErrorBoundary } from "react-error-boundary";
import AppTheme from "../../theme/AppTheme";
import socketService from "../../services/socketService";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../redux/features/authSlice";

// Simple Error Fallback
const ErrorFallback = ({ error }) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        p: 3,
        textAlign: "center",
      }}
    >
      <Typography variant="h4" color="error" gutterBottom>
        Something went wrong
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        {error.message}
      </Typography>
      <Typography variant="body2" color="text.disabled">
        Please refresh the page or contact support.
      </Typography>
    </Box>
  );
};

// Layout Content that needs Redux context for socket init
const RootLayoutContent = () => {
  const user = useSelector(selectCurrentUser);

  useEffect(() => {
    // Initialize/Connect socket when user is authenticated
    if (user) {
      socketService.connect(store);
    } else {
      socketService.disconnect();
    }

    return () => {
      // Cleanup? usually socketService handles singleton logic
    };
  }, [user]);

  return (
    <>
      <CssBaseline />
      <Outlet />
    </>
  );
};

const RootLayout = () => {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      {/* AppTheme provides ThemeProvider */}
      <AppTheme>
        <RootLayoutContent />
      </AppTheme>
    </ErrorBoundary>
  );
};

export default RootLayout;
