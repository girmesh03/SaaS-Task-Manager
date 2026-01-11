/**
 * TasksPage Component - Task Management
 *
 * Manages all task types (ProjectTask, RoutineTask, AssignedTask).
 * Uses Three-Layer Pattern: Page → List → Card
 *
 * Features:
 * - RTK Query integration with useGetTasksQuery
 * - Filter state management with TaskFilter component
 * - Server-side pagination
 * - Delete/Restore with confirmation dialog
 * - Real-time updates via Socket.IO
 * - Error handling with handleApiError
 *
 * Requirements: 5.1, 5.2, 6.1, 6.2, 7.1, 7.2
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Box,
  Typography,
  Button,
  Alert,
  Collapse,
  IconButton,
  Stack,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import TuneIcon from "@mui/icons-material/Tune";
import HomeIcon from "@mui/icons-material/Home";
import AssignmentIcon from "@mui/icons-material/Assignment";
import GroupIcon from "@mui/icons-material/Group";
import PersonIcon from "@mui/icons-material/Person";
import { toast } from "react-toastify";
import { MuiBreadcrumbs } from "../components/layout";
import { TaskFilter } from "../components/filters";
import {
  TaskTypeSelector,
  ProjectTaskForm,
  RoutineTaskForm,
  AssignedTaskForm,
  TasksList,
} from "../components/tasks";
import {
  MuiDialogConfirm,
  MuiToggleButton,
  MuiFAB,
  MuiBottomNavigation,
} from "../components/common";
import useAuthorization from "../hooks/useAuthorization";
import useAuth from "../hooks/useAuth";
import useResponsive from "../hooks/useResponsive";
import {
  useGetTasksQuery,
  useDeleteTaskMutation,
  useRestoreTaskMutation,
} from "../redux/features/taskApi";
import { useGetUsersQuery } from "../redux/features/userApi";
import { useGetVendorsQuery } from "../redux/features/vendorApi";
import { handleApiError } from "../utils/errorHandler";
import { TASK_TYPES, PAGINATION } from "../utils/constants";

/**
 * Initial filter state
 */
const initialFilters = {
  page: PAGINATION.DEFAULT_PAGE,
  limit: PAGINATION.DEFAULT_LIMIT,
  status: "",
  priority: "",
  taskType: "",
  assignee: "",
  vendor: "",
  startDate: null,
  endDate: null,
  isDeleted: false,
};

/**
 * Task type toggle options
 */
const taskTypeOptions = [
  { value: "", label: "All" },
  { value: TASK_TYPES.PROJECT_TASK, label: "Project" },
  { value: TASK_TYPES.ROUTINE_TASK, label: "Routine" },
  { value: TASK_TYPES.ASSIGNED_TASK, label: "Assigned" },
];

const TasksPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isXs } = useResponsive();

  // Note: Socket.IO connection is initialized in ProtectedLayout

  // Filter state
  const [filters, setFilters] = useState(initialFilters);

  // State for filter panel visibility (only used on non-xs screens)
  const [filterExpanded, setFilterExpanded] = useState(false);

  // State for dialogs
  const [typeSelectorOpen, setTypeSelectorOpen] = useState(false);
  const [projectFormOpen, setProjectFormOpen] = useState(false);
  const [routineFormOpen, setRoutineFormOpen] = useState(false);
  const [assignedFormOpen, setAssignedFormOpen] = useState(false);

  // State for edit mode
  const [editingTask, setEditingTask] = useState(null);

  // State for delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  // Bottom navigation state (mobile only)
  const [bottomNavValue, setBottomNavValue] = useState("tasks");

  // Authorization
  const { canCreate, canEdit, canDelete } = useAuthorization("Task");

  // Build query params for API call
  // Only include non-empty values to ensure RTK Query detects changes properly
  const queryParams = useMemo(() => {
    const params = {
      page: filters.page,
      limit: filters.limit,
    };

    // Only add filter params if they have values
    if (filters.status) params.status = filters.status;
    if (filters.priority) params.priority = filters.priority;
    if (filters.taskType) params.taskType = filters.taskType;
    if (filters.assignee) params.assigneeId = filters.assignee;
    if (filters.vendor) params.vendorId = filters.vendor;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    // Backend expects string "true"/"false"/"only", not boolean
    if (filters.isDeleted) params.deleted = "true";

    return params;
  }, [filters]);

  // RTK Query - Fetch tasks
  const {
    data: tasksData,
    isLoading: isLoadingTasks,
    isFetching: isFetchingTasks,
    error: tasksError,
  } = useGetTasksQuery(queryParams);

  // RTK Query - Fetch users for filter (assignee options)
  const { data: usersData } = useGetUsersQuery({
    limit: 100,
    departmentId: user?.department?._id,
  });

  // RTK Query - Fetch vendors for filter
  const { data: vendorsData } = useGetVendorsQuery({
    limit: 100,
  });

  // RTK Query - Delete and Restore mutations
  const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation();
  const [restoreTask, { isLoading: isRestoring }] = useRestoreTaskMutation();

  // Extract tasks and pagination from response
  const tasks = tasksData?.data || [];
  const pagination = tasksData?.pagination || {};
  const totalPages = pagination.totalPages || 1;
  const totalTasks = pagination.total || 0;

  // Extract users and vendors for filter options
  const users = useMemo(
    () =>
      (usersData?.data || []).map((u) => ({
        _id: u._id,
        fullName: `${u.firstName} ${u.lastName}`,
      })),
    [usersData]
  );

  const vendors = useMemo(
    () =>
      (vendorsData?.data || []).map((v) => ({
        _id: v._id,
        name: v.name,
      })),
    [vendorsData]
  );

  // Handle API errors
  useEffect(() => {
    if (tasksError) {
      const { message } = handleApiError(tasksError);
      toast.error(message);
    }
  }, [tasksError]);

  /**
   * Handle task type toggle change
   */
  const handleTaskTypeToggle = useCallback((_event, newValue) => {
    if (newValue !== null) {
      setFilters((prev) => ({
        ...prev,
        taskType: newValue,
        page: 1,
      }));
    }
  }, []);

  /**
   * Handle filter changes from TaskFilter component
   */
  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  /**
   * Handle page change from pagination
   */
  const handlePageChange = useCallback((newPage) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  }, []);

  /**
   * Toggle filter panel
   */
  const handleToggleFilters = useCallback(() => {
    setFilterExpanded((prev) => !prev);
  }, []);

  /**
   * Handle opening task type selector
   */
  const handleOpenTypeSelector = useCallback(() => {
    setEditingTask(null);
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
    setTypeSelectorOpen(false);

    // Open the corresponding form dialog
    if (type === TASK_TYPES.PROJECT_TASK) {
      setProjectFormOpen(true);
    } else if (type === TASK_TYPES.ROUTINE_TASK) {
      setRoutineFormOpen(true);
    } else if (type === TASK_TYPES.ASSIGNED_TASK) {
      setAssignedFormOpen(true);
    }
  }, []);

  /**
   * Handle closing ProjectTaskForm
   */
  const handleCloseProjectForm = useCallback(() => {
    setProjectFormOpen(false);
    setEditingTask(null);
  }, []);

  /**
   * Handle closing RoutineTaskForm
   */
  const handleCloseRoutineForm = useCallback(() => {
    setRoutineFormOpen(false);
    setEditingTask(null);
  }, []);

  /**
   * Handle closing AssignedTaskForm
   */
  const handleCloseAssignedForm = useCallback(() => {
    setAssignedFormOpen(false);
    setEditingTask(null);
  }, []);

  /**
   * Handle successful task creation/update
   */
  const handleTaskSuccess = useCallback(() => {
    toast.success(
      editingTask ? "Task updated successfully" : "Task created successfully"
    );
    setEditingTask(null);
  }, [editingTask]);

  /**
   * Handle view task - navigate to task detail page
   */
  const handleViewTask = useCallback(
    (task) => {
      navigate(`/tasks/${task._id}`);
    },
    [navigate]
  );

  /**
   * Handle edit task - open corresponding form with task data
   */
  const handleEditTask = useCallback(
    (task) => {
      if (!canEdit()) {
        toast.error("You don't have permission to edit tasks");
        return;
      }

      setEditingTask(task);
      const taskType = task.taskType;

      if (taskType === TASK_TYPES.PROJECT_TASK) {
        setProjectFormOpen(true);
      } else if (taskType === TASK_TYPES.ROUTINE_TASK) {
        setRoutineFormOpen(true);
      } else if (taskType === TASK_TYPES.ASSIGNED_TASK) {
        setAssignedFormOpen(true);
      }
    },
    [canEdit]
  );

  /**
   * Handle delete task - open confirmation dialog
   */
  const handleDeleteTask = useCallback(
    (task) => {
      if (!canDelete()) {
        toast.error("You don't have permission to delete tasks");
        return;
      }

      setTaskToDelete(task);
      setDeleteDialogOpen(true);
    },
    [canDelete]
  );

  /**
   * Handle close delete dialog
   */
  const handleCloseDeleteDialog = useCallback(() => {
    setDeleteDialogOpen(false);
    setTaskToDelete(null);
  }, []);

  /**
   * Handle confirm delete
   */
  const handleConfirmDelete = useCallback(async () => {
    if (!taskToDelete) return;

    try {
      await deleteTask(taskToDelete._id).unwrap();
      toast.success("Task deleted successfully");
      handleCloseDeleteDialog();
    } catch (error) {
      const { message } = handleApiError(error);
      toast.error(message);
    }
  }, [taskToDelete, deleteTask, handleCloseDeleteDialog]);

  /**
   * Handle restore task
   */
  const handleRestoreTask = useCallback(
    async (task) => {
      try {
        await restoreTask(task._id).unwrap();
        toast.success("Task restored successfully");
      } catch (error) {
        const { message } = handleApiError(error);
        toast.error(message);
      }
    },
    [restoreTask]
  );

  /**
   * Handle bottom navigation change
   */
  const handleBottomNavChange = useCallback(
    (_event, newValue) => {
      setBottomNavValue(newValue);
      if (newValue === "home") {
        navigate("/dashboard");
      } else if (newValue === "users") {
        navigate("/users");
      } else if (newValue === "profile") {
        navigate("/profile");
      }
    },
    [navigate]
  );

  /**
   * Get delete dialog message
   */
  const deleteDialogMessage = useMemo(() => {
    if (!taskToDelete) return "";
    const taskTitle =
      taskToDelete.title ||
      taskToDelete.description?.substring(0, 50) ||
      "this task";
    return `Are you sure you want to delete "${taskTitle}"? This action can be undone by restoring the task.`;
  }, [taskToDelete]);

  /**
   * Bottom navigation actions (mobile only)
   */
  const bottomNavActions = useMemo(
    () => [
      { value: "home", label: "Home", icon: <HomeIcon /> },
      { value: "tasks", label: "Tasks", icon: <AssignmentIcon /> },
      { value: "users", label: "Users", icon: <GroupIcon /> },
      { value: "profile", label: "Profile", icon: <PersonIcon /> },
    ],
    []
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        pb: isXs ? 7 : 0, // Space for bottom navigation on mobile
      }}
    >
      {/* Header Section - Sticky */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          bgcolor: "background.default",
          px: { xs: 1.5, sm: 2, md: 3 },
          pt: { xs: 1.5, sm: 2 },
          pb: 1,
        }}
      >
        {/* Breadcrumbs */}
        <MuiBreadcrumbs />

        {/* Task Type Toggle + Create Button + Filter Icon */}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1.5 }}>
          {/* Task Type Toggle Buttons - Scrollable */}
          <Box
            sx={{
              flex: 1,
              overflowX: "auto",
              "&::-webkit-scrollbar": { display: "none" },
              scrollbarWidth: "none",
            }}
          >
            <MuiToggleButton
              value={filters.taskType}
              onChange={handleTaskTypeToggle}
              options={taskTypeOptions}
              exclusive
              size="small"
              color="primary"
              sx={{
                flexWrap: "nowrap",
                "& .MuiToggleButton-root": {
                  borderRadius: 2,
                  px: { xs: 1.5, sm: 2 },
                  py: 0.5,
                  textTransform: "none",
                  fontWeight: 500,
                  fontSize: "0.8125rem",
                  whiteSpace: "nowrap",
                  border: 1,
                  borderColor: "divider",
                  "&.Mui-selected": {
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    borderColor: "primary.main",
                    "&:hover": {
                      bgcolor: "primary.dark",
                    },
                  },
                },
              }}
            />
          </Box>

          {/* Create Button */}
          {canCreate() && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenTypeSelector}
              size="small"
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                px: 2,
                whiteSpace: "nowrap",
                display: { xs: "none", sm: "flex" },
              }}
            >
              Create
            </Button>
          )}

          {/* Filter Icon - Only on non-xs screens */}
          {!isXs && (
            <IconButton
              onClick={handleToggleFilters}
              size="small"
              sx={{
                bgcolor: filterExpanded ? "primary.main" : "background.paper",
                color: filterExpanded
                  ? "primary.contrastText"
                  : "text.secondary",
                border: 1,
                borderColor: filterExpanded ? "primary.main" : "divider",
                "&:hover": {
                  bgcolor: filterExpanded ? "primary.dark" : "action.hover",
                },
              }}
            >
              <TuneIcon fontSize="small" />
            </IconButton>
          )}
        </Stack>
      </Box>

      {/* Filter Section - Collapsible on non-xs, always visible on xs */}
      <Box sx={{ px: { xs: 1.5, sm: 2, md: 3 } }}>
        {isXs ? (
          // Always show filters on xs
          <Box sx={{ py: 1 }}>
            <TaskFilter
              filters={filters}
              onChange={handleFilterChange}
              users={users}
              vendors={vendors}
            />
          </Box>
        ) : (
          // Collapsible on larger screens
          <Collapse in={filterExpanded}>
            <Box
              sx={{
                py: 2,
                borderBottom: 1,
                borderColor: "divider",
              }}
            >
              <TaskFilter
                filters={filters}
                onChange={handleFilterChange}
                users={users}
                vendors={vendors}
              />
            </Box>
          </Collapse>
        )}
      </Box>

      {/* Tasks Count Header */}
      <Box
        sx={{
          px: { xs: 1.5, sm: 2, md: 3 },
          py: 1.5,
        }}
      >
        <Typography
          variant="overline"
          sx={{
            color: "text.secondary",
            fontWeight: 600,
            letterSpacing: 1,
          }}
        >
          {isLoadingTasks || isFetchingTasks
            ? "Loading..."
            : `Active Tasks (${totalTasks})`}
        </Typography>
      </Box>

      {/* Error Alert */}
      {tasksError && (
        <Box sx={{ px: { xs: 1.5, sm: 2, md: 3 }, pb: 1 }}>
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {handleApiError(tasksError).message}
          </Alert>
        </Box>
      )}

      {/* Tasks List Section - Scrollable */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          px: { xs: 1.5, sm: 2, md: 3 },
          pb: 2,
        }}
      >
        <TasksList
          tasks={tasks}
          isLoading={isLoadingTasks || isFetchingTasks}
          onView={handleViewTask}
          onEdit={handleEditTask}
          onDelete={handleDeleteTask}
          onRestore={handleRestoreTask}
          onCreateTask={handleOpenTypeSelector}
          canCreate={canCreate()}
          page={filters.page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </Box>

      {/* Floating Action Button (Mobile) */}
      {isXs && canCreate() && (
        <MuiFAB
          color="primary"
          onClick={handleOpenTypeSelector}
          sx={{
            position: "fixed",
            bottom: 72,
            right: 16,
            zIndex: 1001,
          }}
        >
          <AddIcon />
        </MuiFAB>
      )}

      {/* Bottom Navigation (Mobile xs only) */}
      {isXs && (
        <MuiBottomNavigation
          value={bottomNavValue}
          onChange={handleBottomNavChange}
          actions={bottomNavActions}
          showLabels
          position="fixed"
        />
      )}

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
        task={editingTask}
        departmentId={user?.department?._id}
        onSuccess={handleTaskSuccess}
      />

      {/* RoutineTaskForm Dialog */}
      <RoutineTaskForm
        open={routineFormOpen}
        onClose={handleCloseRoutineForm}
        task={editingTask}
        departmentId={user?.department?._id}
        onSuccess={handleTaskSuccess}
      />

      {/* AssignedTaskForm Dialog */}
      <AssignedTaskForm
        open={assignedFormOpen}
        onClose={handleCloseAssignedForm}
        task={editingTask}
        departmentId={user?.department?._id}
        onSuccess={handleTaskSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <MuiDialogConfirm
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        title="Delete Task"
        message={deleteDialogMessage}
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="error"
        isLoading={isDeleting || isRestoring}
      />
    </Box>
  );
};

export default TasksPage;
