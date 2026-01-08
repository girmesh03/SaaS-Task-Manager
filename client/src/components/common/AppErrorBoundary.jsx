/**
 * AppErrorBoundary Component - Global Error Handler
 *
 * Handles errors from:
 * 1. Initial application load
 * 2. Frontend rendering errors
 * 3. Request/Response cycle errors bubbling up
 *
 * UI:
 * - Displays user-friendly error message
 * - Provides "Go Back" functionality (navigate -1) instead of redirecting to dashboard
 *
 * Requirements: Error Handling, UX
 */

import { Component } from "react";
import { useNavigate } from "react-router";
import { Box, Typography, Button, Container } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

// Error View Component (Functional to use hooks)
const ErrorView = ({ error, resetError }) => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    resetError(); // Reset error state before navigating
    navigate(-1);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          textAlign: "center",
        }}
      >
        <ErrorOutlineIcon
          sx={{
            fontSize: "6rem",
            color: "error.main",
            mb: 2,
          }}
        />
        <Typography variant="h4" component="h1" gutterBottom>
          Something went wrong
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          {error?.message || "An unexpected error occurred."}
        </Typography>
        {import.meta.env.DEV && error?.stack && (
          <Box
            component="pre"
            sx={{
              mt: 2,
              p: 2,
              bgcolor: "background.paper",
              borderRadius: 1,
              overflow: "auto",
              maxWidth: "100%",
              fontSize: "0.75rem",
              textAlign: "left",
              mb: 3,
            }}
          >
            {error.stack}
          </Box>
        )}
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button variant="contained" onClick={handleGoBack} size="small">
            Go Back
          </Button>
          <Button variant="outlined" onClick={handleRefresh} size="small">
            Refresh Page
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

// Error Boundary Class Component
class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("App Error:", error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorView error={this.state.error} resetError={this.resetError} />
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
