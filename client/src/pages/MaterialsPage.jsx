/**
 * MaterialsPage Component - Material Management
 *
 * Manages materials inventory.
 * Placeholder component - will be fully implemented in a later task.
 *
 * Requirements: 10.1-10.10
 */

import { Box, Typography, Paper } from "@mui/material";

const MaterialsPage = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Materials
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Manage materials inventory
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Typography variant="body2" color="text.disabled">
          Materials DataGrid - To be implemented
        </Typography>
      </Paper>
    </Box>
  );
};

export default MaterialsPage;
