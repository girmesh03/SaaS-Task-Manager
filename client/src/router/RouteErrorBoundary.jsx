/**
 * RouteErrorBoundary Component - Error Boundary for Routes
 *
 * Displays error message when a route fails to load.
 * Uses useRouteError to get error details from React Router.
 * Uses Link instead of useNavigate for navigation (hooks may not work in error boundaries).
 *
 * Requirements: 23.7
 */

import { useRouteError, Link } from "react-router";
import { Box, Typography, Button, Container } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

const RouteErrorBoundary = () => {
  const error = useRouteError();

  // Log error for debugging
  console.error("Route Error:", error);

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "80vh",
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
          {error?.message ||
            "The page you are looking for could not be loaded."}
        </Typography>
        {error?.stack && import.meta.env.DEV && (
          <Box
            component="pre"
            sx={{
              mt: 2,
              p: 2,
              bgcolor: "grey.100",
              borderRadius: 1,
              overflow: "auto",
              maxWidth: "100%",
              fontSize: "0.75rem",
              textAlign: "left",
            }}
          >
            {error.stack}
          </Box>
        )}
        <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
          <Button component={Link} to="/dashboard" variant="contained">
            Go to Dashboard
          </Button>
          <Button variant="outlined" onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default RouteErrorBoundary;
