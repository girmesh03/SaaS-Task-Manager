/**
 * UsersPage Component - User Management
 *
 * Manages users within organization.
 * Placeholder component - will be fully implemented in a later task.
 *
 * Requirements: 4.1-4.10
 */

import { Box, Typography, Paper } from "@mui/material";

const UsersPage = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Users
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Manage users within your organization
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Typography variant="body2" color="text.disabled">
          Users list with cards - To be implemented
        </Typography>
      </Paper>
    </Box>
  );
};

export default UsersPage;
