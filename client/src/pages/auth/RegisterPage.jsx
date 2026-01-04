/**
 * RegisterPage Component - Organization Registration
 *
 * Placeholder component for registration functionality.
 * Will be fully implemented in a later task.
 *
 * Requirements: 1.1
 */

import { Box, Typography, Container, Paper } from "@mui/material";

const RegisterPage = () => {
  return (
    <Container maxWidth="md">
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
            Create Your Organization
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            Registration page - To be implemented
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default RegisterPage;
