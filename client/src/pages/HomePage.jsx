/**
 * HomePage Component - Landing Page
 *
 * Redirects authenticated users to dashboard.
 * Shows landing page for unauthenticated users.
 *
 * Requirements: 1.2
 */

import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useSelector } from "react-redux";
import { Box, Typography, Button, Container } from "@mui/material";
import { selectIsAuthenticated } from "../redux/features/authSlice";

const HomePage = () => {
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          textAlign: "center",
          py: 4,
        }}
      >
        <Typography variant="h2" component="h1" gutterBottom>
          Multi-Tenant Task Manager
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          Enterprise task management with role-based access control
        </Typography>
        <Box sx={{ mt: 4, display: "flex", gap: 2 }}>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate("/login")}
          >
            Sign In
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate("/register")}
          >
            Register
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default HomePage;
