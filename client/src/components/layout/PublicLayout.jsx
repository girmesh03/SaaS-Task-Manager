/**
 * PublicLayout Component - Layout for Auth Pages
 *
 * Requirements: 17.3, 9.4
 */

import { Outlet, Navigate, useLocation } from "react-router-dom";
import { Box, Container } from "@mui/material";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../redux/features/authSlice";
import Footer from "./Footer";

const PublicLayout = () => {
  const user = useSelector(selectCurrentUser);
  const location = useLocation();

  // If user is already logged in, redirect to dashboard
  // Exception: maybe specific public pages? Assuming all pages using PublicLayout are auth related for now.
  // Actually landing page might use this too.
  // Let's check path. If it's login/register, redirect.
  const isAuthPage = ["/login", "/register", "/forgot-password", "/reset-password"].some(path => location.pathname.startsWith(path));

  if (user && isAuthPage) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          py: 4,
        }}
      >
        <Container maxWidth="md">
          <Outlet />
        </Container>
      </Box>
      <Footer />
    </Box>
  );
};

export default PublicLayout;
