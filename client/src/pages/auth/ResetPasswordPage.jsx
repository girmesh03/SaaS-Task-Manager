/**
 * ResetPasswordPage Component - Password Reset with Token
 *
 * Placeholder component for password reset functionality.
 * Will be fully implemented in a later task.
 *
 * Requirements: 1.4
 */

import { useParams } from "react-router";
import { Box, Typography, Container, Paper } from "@mui/material";

const ResetPasswordPage = () => {
  const { token } = useParams();

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
            Create New Password
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            Reset password page - To be implemented
          </Typography>
          <Typography
            variant="caption"
            color="text.disabled"
            align="center"
            display="block"
            sx={{ mt: 2 }}
          >
            Token: {token ? `${token.substring(0, 10)}...` : "No token"}
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default ResetPasswordPage;
