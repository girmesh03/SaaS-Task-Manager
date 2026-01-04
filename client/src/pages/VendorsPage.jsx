/**
 * VendorsPage Component - Vendor Management
 *
 * Manages vendors for outsourced work.
 * Placeholder component - will be fully implemented in a later task.
 *
 * Requirements: 11.1-11.10
 */

import { Box, Typography, Paper } from "@mui/material";

const VendorsPage = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Vendors
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Manage vendors for outsourced work
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Typography variant="body2" color="text.disabled">
          Vendors DataGrid - To be implemented
        </Typography>
      </Paper>
    </Box>
  );
};

export default VendorsPage;
