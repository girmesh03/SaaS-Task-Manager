/**
 * TasksPage Component - Task Management
 *
 * Manages all task types (ProjectTask, RoutineTask, AssignedTask).
 * Uses Three-Layer Pattern: Page → List → Card
 *
 * Requirements: 5.1-5.10, 6.1-6.10, 7.1-7.10
 */

import { useState, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Breadcrumbs,
  Link as MuiLink,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import HomeIcon from "@mui/icons-material/Home";
import { Link } from "react-router";
import {
  TaskTypeSelector,
  ProjectTaskForm,
  RoutineTaskForm,
} from "../components/tasks";
import useAuthorization from "../hooks/useAuthorization";
import useAuth from "../hooks/useAuth";
import { TASK_TYPES } from "../utils/constants";

const TasksPage = () => {
  const { user } = useAuth();

  // State for dialogs
  const [typeSelectorOpen, setTypeSelectorOpen] = useState(false);
  const [selectedTaskType, setSelectedTaskType] = useState(null);
  const [projectFormOpen, setProjectFormOpen] = useState(false);
  const [routineFormOpen, setRoutineFormOpen] = useState(false);

  // Authorization
  const { canCreate } = useAuthorization("Task");

  /**
   * Handle opening task type selector
   */
  const handleOpenTypeSelector = useCallback(() => {
    setTypeSelectorOpen(true);
  }, []);

  /**
   * Handle closing task type selector
   */
  const handleCloseTypeSelector = useCallback(() => {
    setTypeSelectorOpen(false);
  }, []);

  /**
   * Handle task type selection
   * Opens the corresponding form dialog
   */
  const handleSelectTaskType = useCallback((type) => {
    setSelectedTaskType(type);
    setTypeSelectorOpen(false);

    // Open the corresponding form dialog
    if (type === TASK_TYPES.PROJECT_TASK) {
      setProjectFormOpen(true);
    } else if (type === TASK_TYPES.ROUTINE_TASK) {
      setRoutineFormOpen(true);
    }
    // AssignedTaskForm will be implemented in subsequent tasks
  }, []);

  /**
   * Handle closing ProjectTaskForm
   */
  const handleCloseProjectForm = useCallback(() => {
    setProjectFormOpen(false);
    setSelectedTaskType(null);
  }, []);

  /**
   * Handle closing RoutineTaskForm
   */
  const handleCloseRoutineForm = useCallback(() => {
    setRoutineFormOpen(false);
    setSelectedTaskType(null);
  }, []);

  /**
   * Handle successful task creation
   */
  const handleTaskSuccess = useCallback(() => {
    // Refresh task list - will be implemented when TasksList is created
    console.log("Task created/updated successfully");
  }, []);

  return (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      {/* Breadcrumbs */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <MuiLink
          component={Link}
          to="/dashboard"
          underline="hover"
          color="inherit"
          sx={{ display: "flex", alignItems: "center" }}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Dashboard
        </MuiLink>
        <Typography color="text.primary">Tasks</Typography>
      </Breadcrumbs>

      {/* Page Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Typography variant="h4" component="h1">
          Tasks
        </Typography>

        {canCreate() && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenTypeSelector}
            size="small"
          >
            Create Task
          </Button>
        )}
      </Box>

      {/* Filters Section - Placeholder */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Filters section - To be implemented in Task 15.7
        </Typography>
      </Paper>

      {/* Tasks List Section - Placeholder */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Tasks list with cards - To be implemented in Tasks 15.5, 15.6
        </Typography>
        {selectedTaskType && (
          <Typography variant="body2" color="primary" sx={{ mt: 2 }}>
            Selected task type: {selectedTaskType}
          </Typography>
        )}
      </Paper>

      {/* Task Type Selector Dialog */}
      <TaskTypeSelector
        open={typeSelectorOpen}
        onClose={handleCloseTypeSelector}
        onSelectType={handleSelectTaskType}
      />

      {/* ProjectTaskForm Dialog */}
      <ProjectTaskForm
        open={projectFormOpen}
        onClose={handleCloseProjectForm}
        task={null}
        departmentId={user?.department?._id}
        onSuccess={handleTaskSuccess}
      />

      {/* RoutineTaskForm Dialog */}
      <RoutineTaskForm
        open={routineFormOpen}
        onClose={handleCloseRoutineForm}
        task={null}
        departmentId={user?.department?._id}
        onSuccess={handleTaskSuccess}
      />
    </Box>
  );
};

export default TasksPage;
