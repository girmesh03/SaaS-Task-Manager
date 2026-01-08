/**
 * NotFoundPage Component - 404 Error Page
 *
 * Displayed when user navigates to a non-existent route.
 * Uses the notFound_404.svg asset for visual appeal.
 *
 * Requirements: 23.7
 */

import { useNavigate } from "react-router";
import { Box, Typography, Button, Container } from "@mui/material";
import { Home as HomeIcon, Login as LoginIcon } from "@mui/icons-material";
import useAuth from "../hooks/useAuth";
import notFoundSvg from "../assets/notFound_404.svg";

const NotFoundPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

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
          py: 4,
        }}
      >
        {/* SVG Illustration */}
        <Box
          component="img"
          src={notFoundSvg}
          alt="Page not found"
          sx={{
            width: "100%",
            maxWidth: 400,
            height: "auto",
            mb: 4,
          }}
        />

        {/* Error Message */}
        <Typography
          variant="h3"
          component="h1"
          fontWeight={700}
          color="primary.main"
          gutterBottom
        >
          Page Not Found
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          paragraph
          sx={{ maxWidth: 400 }}
        >
          Oops! The page you are looking for does not exist or has been moved.
          Please check the URL or navigate back to a known page.
        </Typography>

        {/* Action Button */}
        <Button
          variant="contained"
          size="small" // Set to small as requested
          onClick={handleGoBack}
          startIcon={isAuthenticated ? <HomeIcon /> : <LoginIcon />}
          sx={{ mt: 2 }}
        >
          {isAuthenticated ? "Go to Dashboard" : "Go to Login"}
        </Button>
      </Box>
    </Container>
  );
};

export default NotFoundPage;
