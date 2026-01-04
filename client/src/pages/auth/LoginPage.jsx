/**
 * LoginPage Component - User Login
 *
 * Placeholder component for login functionality.
 * Will be fully implemented in a later task.
 *
 * Requirements: 1.2
 */

import { Box, Typography, Container, Paper } from "@mui/material";

const LoginPage = () => {
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
        }}
      >
        <Paper elevation={2} sx={{ p: 4, width: "100%" }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Sign In
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            Login page - To be implemented
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default LoginPage;
