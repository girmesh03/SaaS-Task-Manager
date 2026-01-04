/**
 * NotFoundPage Component - 404 Error Page
 *
 * Displayed when user navigates to a non-existent route.
 *
 * Requirements: 23.7
 */

import { useNavigate } from "react-router";
import { Box, Typography, Button, Container } from "@mui/material";
import { useSelector } from "react-redux";
import { selectIsAuthenticated } from "../redux/features/authSlice";

const NotFoundPage = () => {
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const handleGoBack = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  };

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
        <Typography
          variant="h1"
          component="h1"
          sx={{
            fontSize: "8rem",
            fontWeight: 700,
            color: "primary.main",
            mb: 2,
          }}
        >
          404
        </Typography>
        <Typography variant="h4" component="h2" gutterBottom>
          Page Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          The page you are looking for does not exist or has been moved.
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={handleGoBack}
          sx={{ mt: 2 }}
        >
          {isAuthenticated ? "Go to Dashboard" : "Go to Login"}
        </Button>
      </Box>
    </Container>
  );
};

export default NotFoundPage;
