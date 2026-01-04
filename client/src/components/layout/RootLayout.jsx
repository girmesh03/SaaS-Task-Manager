/**
 * RootLayout Component - Top Level App Wrapper
 *
 * Requirements: 17.1, 17.9, 9.4
 */

import { useEffect } from "react";
import { Outlet } from "react-router";
import { Box, Typography } from "@mui/material";
import { ErrorBoundary } from "react-error-boundary";
import socketService from "../../services/socketService";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../redux/features/authSlice";
import { store } from "../../redux/app/store";

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
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
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
      // Cleanup handled by socketService singleton
    };
  }, [user]);

  return <Outlet />;
};

const RootLayout = () => {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <RootLayoutContent />
    </ErrorBoundary>
  );
};

export default RootLayout;
