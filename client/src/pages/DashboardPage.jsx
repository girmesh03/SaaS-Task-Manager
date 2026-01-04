/**
 * DashboardPage Component - Main Dashboard
 *
 * Displays role-based dashboard with widgets.
 * Placeholder component - will be fully implemented in a later task.
 *
 * Requirements: 27.1-27.10
 */

import { Box, Typography, Paper, Grid } from "@mui/material";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../redux/features/authSlice";

const DashboardPage = () => {
  const user = useSelector(selectCurrentUser);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Welcome back, {user?.firstName || "User"}!
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Role
            </Typography>
            <Typography variant="body1">{user?.role || "Unknown"}</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Organization
            </Typography>
            <Typography variant="body1">
              {user?.organization?.name || "Unknown"}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Department
            </Typography>
            <Typography variant="body1">
              {user?.department?.name || "Unknown"}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Typography variant="body2" color="text.disabled" sx={{ mt: 4 }}>
        Dashboard widgets - To be implemented
      </Typography>
    </Box>
  );
};

export default DashboardPage;
