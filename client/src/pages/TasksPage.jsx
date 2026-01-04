/**
 * TasksPage Component - Task Management
 *
 * Manages all task types (ProjectTask, RoutineTask, AssignedTask).
 * Placeholder component - will be fully implemented in a later task.
 *
 * Requirements: 5.1-5.10, 6.1-6.10, 7.1-7.10
 */

import { Box, Typography, Paper } from "@mui/material";

const TasksPage = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Tasks
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Manage tasks - ProjectTask, RoutineTask, AssignedTask
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Typography variant="body2" color="text.disabled">
          Tasks list with cards - To be implemented
        </Typography>
      </Paper>
    </Box>
  );
};

export default TasksPage;
