/**
 * TaskDetailPage Component - Task Detail View with Tabs
 *
 * Displays detailed task information with type-specific sections.
 * Uses MuiTabs for Details, Activities (ProjectTask/AssignedTask), and Comments.
 *
 * Features:
 * - RTK Query integration with useGetTaskQuery
 * - Type-specific content rendering
 * - Soft delete banner with countdown
 * - Real-time updates via Socket.IO
 * - Authorization-based action buttons
 * - Bottom navigation for mobile (xs breakpoint)
 *
 * Requirements: 5.7, 6.7, 7.7
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import { useParams, useNavigate, Link as RouterLink } from "react-router";
import {
  Box,
  Typography,
  Button,
  Alert,
  Stack,
  Divider,
  Paper,
  Grid,
  Link,
  Breadcrumbs as MuiBreadcrumbs,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RestoreIcon from "@mui/icons-material/Restore";
import WorkIcon from "@mui/icons-material/Work";
import RepeatIcon from "@mui/icons-material/Repeat";
import AssignmentIcon from "@mui/icons-material/Assignment";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import InfoIcon from "@mui/icons-material/Info";
import TimelineIcon from "@mui/icons-material/Timeline";
import CommentIcon from "@mui/icons-material/Comment";
import AddIcon from "@mui/icons-material/Add";
import { toast } from "react-toastify";
import {
  MuiTabs,
  MuiChip,
  MuiAvatar,
  MuiAvatarGroup,
  MuiLoading,
  MuiDialogConfirm,
  MuiTooltip,
  MuiBottomNavigation,
} from "../components/common";
import {
  ProjectTaskForm,
  RoutineTaskForm,
  AssignedTaskForm,
  TaskActivityForm,
} from "../components/tasks";
import useAuth from "../hooks/useAuth";
import useAuthorization from "../hooks/useAuthorization";
import useResponsive from "../hooks/useResponsive";
import useTimezone from "../hooks/useTimezone";
// import useSocket from "../hooks/useSocket";
import {
  useGetTaskQuery,
  useDeleteTaskMutation,
  useRestoreTaskMutation,
} from "../redux/features/taskApi";
import { handleApiError } from "../utils/errorHandler";
import {
  TASK_TYPES,
  TASK_STATUS,
  TASK_PRIORITY,
  CURRENCY,
  TTL,
} from "../utils/constants";

/** Status color mapping */
const STATUS_COLORS = {
  [TASK_STATUS.TO_DO]: "info",
  [TASK_STATUS.IN_PROGRESS]: "warning",
  [TASK_STATUS.COMPLETED]: "success",
  [TASK_STATUS.PENDING]: "default",
};

/** Priority color mapping */
const PRIORITY_COLORS = {
  [TASK_PRIORITY.LOW]: "default",
  [TASK_PRIORITY.MEDIUM]: "info",
  [TASK_PRIORITY.HIGH]: "warning",
  [TASK_PRIORITY.URGENT]: "error",
};

/** Task type icon mapping */
const TASK_TYPE_ICONS = {
  [TASK_TYPES.PROJECT_TASK]: WorkIcon,
  [TASK_TYPES.ROUTINE_TASK]: RepeatIcon,
  [TASK_TYPES.ASSIGNED_TASK]: AssignmentIcon,
};

/** Task type color mapping */
const TASK_TYPE_COLORS = {
  [TASK_TYPES.PROJECT_TASK]: "primary",
  [TASK_TYPES.ROUTINE_TASK]: "warning",
  [TASK_TYPES.ASSIGNED_TASK]: "success",
};

/** Format currency value */
const formatCurrency = (value, currency = CURRENCY.DEFAULT) => {
  if (value === null || value === undefined) return "-";
  return `${currency} ${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/** Capitalize first letter of string */
const capitalizeFirst = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/** Get user display name safely */
const getUserDisplayName = (user) => {
  if (!user) return "Unknown";
  if (user.fullName) return user.fullName;
  if (user.firstName && user.lastName)
    return `${user.firstName} ${user.lastName}`;
  if (user.firstName) return user.firstName;
  return "Unknown";
};

/** Get profile picture URL safely - profilePicture is an object with url property */
const getProfilePictureUrl = (user) => {
  if (!user) return null;
  if (user.profilePicture?.url) return user.profilePicture.url;
  return null;
};

/** Bottom navigation actions for mobile */
const BOTTOM_NAV_ACTIONS = [
  { label: "Dashboard", icon: <DashboardIcon />, value: "/dashboard" },
  { label: "Tasks", icon: <AssignmentIcon />, value: "/tasks" },
  { label: "Users", icon: <PeopleIcon />, value: "/users" },
  { label: "Profile", icon: <AccountCircleIcon />, value: "/profile" },
];

const TaskDetailPage = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isXs } = useResponsive();
  const { formatDate, formatRelative, formatDeadline } = useTimezone();

  // Initialize Socket.IO connection for real-time updates
  // useSocket();

  // Tab state
  const [tabValue, setTabValue] = useState(0);

  // Dialog states
  const [projectFormOpen, setProjectFormOpen] = useState(false);
  const [routineFormOpen, setRoutineFormOpen] = useState(false);
  const [assignedFormOpen, setAssignedFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activityFormOpen, setActivityFormOpen] = useState(false);

  // RTK Query - Fetch task
  const {
    data: taskResponse,
    isLoading,
    isFetching,
    error: taskError,
  } = useGetTaskQuery(taskId, { skip: !taskId });

  // Extract task from response - backend returns { success, message, data: task }
  const task = useMemo(() => taskResponse?.data || null, [taskResponse]);

  // RTK Query - Delete and Restore mutations
  const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation();
  const [restoreTask, { isLoading: isRestoring }] = useRestoreTaskMutation();

  // Authorization - pass task for instance-level checks
  const { canEdit, canDelete, canRestore } = useAuthorization("Task", task);

  // Handle API errors
  useEffect(() => {
    if (taskError) {
      const { message } = handleApiError(taskError);
      toast.error(message);
    }
  }, [taskError]);

  // Get task type color
  const taskTypeColor = useMemo(() => {
    if (!task) return "primary";
    return TASK_TYPE_COLORS[task.taskType] || "primary";
  }, [task]);

  // Check if current user is assigned to this task
  const isAssignedToMe = useMemo(() => {
    if (!task || task.taskType !== TASK_TYPES.ASSIGNED_TASK || !user?._id)
      return false;
    return task.assignees?.some(
      (assignee) => (assignee?._id || assignee) === user._id
    );
  }, [task, user]);

  // Format deadline countdown using useTimezone hook
  const deadlineInfo = useMemo(() => {
    if (!task?.dueDate) return null;
    return formatDeadline(task.dueDate);
  }, [task, formatDeadline]);

  // Calculate days remaining for soft delete
  const daysRemaining = useMemo(() => {
    if (!task?.isDeleted || !task?.deletedAt) return null;
    const deletedDate = new Date(task.deletedAt);
    const expiryDate = new Date(deletedDate.getTime() + TTL.TASK * 1000);
    const now = new Date();
    const remaining = Math.ceil((expiryDate - now) / (24 * 60 * 60 * 1000));
    return remaining > 0 ? remaining : 0;
  }, [task]);

  // Get task title
  const taskTitle = useMemo(() => {
    if (!task) return "";
    if (
      task.taskType === TASK_TYPES.PROJECT_TASK ||
      task.taskType === TASK_TYPES.ASSIGNED_TASK
    ) {
      return capitalizeFirst(task.title);
    }
    return (
      capitalizeFirst(task.description?.substring(0, 50)) || "Routine Task"
    );
  }, [task]);

  // Get task type icon
  const TaskTypeIcon = useMemo(() => {
    if (!task) return WorkIcon;
    return TASK_TYPE_ICONS[task.taskType] || WorkIcon;
  }, [task]);

  // Delete dialog message
  const deleteDialogMessage = useMemo(() => {
    if (!task) return "";
    return `Are you sure you want to delete "${taskTitle}"? This action can be undone by restoring the task.`;
  }, [task, taskTitle]);

  /** Handle tab change */
  const handleTabChange = useCallback((_event, newValue) => {
    setTabValue(newValue);
  }, []);

  /** Handle edit task */
  const handleEdit = useCallback(() => {
    if (!task) return;
    if (task.taskType === TASK_TYPES.PROJECT_TASK) {
      setProjectFormOpen(true);
    } else if (task.taskType === TASK_TYPES.ROUTINE_TASK) {
      setRoutineFormOpen(true);
    } else if (task.taskType === TASK_TYPES.ASSIGNED_TASK) {
      setAssignedFormOpen(true);
    }
  }, [task]);

  /** Handle close forms */
  const handleCloseProjectForm = useCallback(() => {
    setProjectFormOpen(false);
  }, []);

  const handleCloseRoutineForm = useCallback(() => {
    setRoutineFormOpen(false);
  }, []);

  const handleCloseAssignedForm = useCallback(() => {
    setAssignedFormOpen(false);
  }, []);

  /** Handle open activity form */
  const handleOpenActivityForm = useCallback(() => {
    setActivityFormOpen(true);
  }, []);

  /** Handle close activity form */
  const handleCloseActivityForm = useCallback(() => {
    setActivityFormOpen(false);
  }, []);

  /** Handle activity success */
  const handleActivitySuccess = useCallback(() => {
    // Activity created/updated successfully - cache will be invalidated by RTK Query
  }, []);

  /** Handle task success */
  const handleTaskSuccess = useCallback(() => {
    toast.success("Task updated successfully");
  }, []);

  /** Handle delete task */
  const handleDelete = useCallback(() => {
    setDeleteDialogOpen(true);
  }, []);

  /** Handle close delete dialog */
  const handleCloseDeleteDialog = useCallback(() => {
    setDeleteDialogOpen(false);
  }, []);

  /** Handle confirm delete */
  const handleConfirmDelete = useCallback(async () => {
    if (!task?._id) return;
    try {
      await deleteTask(task._id).unwrap();
      toast.success("Task deleted successfully");
      setDeleteDialogOpen(false);
    } catch (error) {
      const { message } = handleApiError(error);
      toast.error(message);
    }
  }, [task, deleteTask]);

  /** Handle restore task */
  const handleRestore = useCallback(async () => {
    if (!task?._id) return;
    try {
      await restoreTask(task._id).unwrap();
      toast.success("Task restored successfully");
    } catch (error) {
      const { message } = handleApiError(error);
      toast.error(message);
    }
  }, [task, restoreTask]);

  /** Handle bottom navigation change */
  const handleBottomNavChange = useCallback(
    (_event, newValue) => {
      navigate(newValue);
    },
    [navigate]
  );

  /** Build tabs array based on task type */
  const tabs = useMemo(() => {
    if (!task) return [];

    const tabsArray = [
      {
        label: "Details",
        icon: <InfoIcon />,
        value: 0,
      },
    ];

    // Activities tab only for ProjectTask and AssignedTask
    if (
      task.taskType === TASK_TYPES.PROJECT_TASK ||
      task.taskType === TASK_TYPES.ASSIGNED_TASK
    ) {
      tabsArray.push({
        label: "Activities",
        icon: <TimelineIcon />,
        value: 1,
      });
    }

    // Comments tab for all task types
    tabsArray.push({
      label: "Comments",
      icon: <CommentIcon />,
      value: task.taskType === TASK_TYPES.ROUTINE_TASK ? 1 : 2,
    });

    return tabsArray;
  }, [task]);

  /** Render Details Tab Content */
  const renderDetailsContent = useMemo(() => {
    if (!task) return null;

    return (
      <Box>
        {/* Task Information Card */}
        <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Task Information
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2}>
            {/* Title/Description */}
            <Grid size={12}>
              <Typography variant="subtitle2" color="text.secondary">
                {task.taskType === TASK_TYPES.ROUTINE_TASK
                  ? "Description"
                  : "Title"}
              </Typography>
              <Typography variant="body1">
                {task.taskType === TASK_TYPES.ROUTINE_TASK
                  ? task.description
                  : task.title}
              </Typography>
            </Grid>

            {/* Description (for non-routine tasks) */}
            {task.taskType !== TASK_TYPES.ROUTINE_TASK && task.description && (
              <Grid size={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Description
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                  {task.description}
                </Typography>
              </Grid>
            )}

            {/* Status and Priority */}
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Status
              </Typography>
              <MuiChip
                label={task.status}
                color={STATUS_COLORS[task.status] || "default"}
                size="small"
              />
            </Grid>

            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Priority
              </Typography>
              <MuiChip
                label={task.priority}
                color={PRIORITY_COLORS[task.priority] || "default"}
                variant="outlined"
                size="small"
              />
            </Grid>

            {/* Department */}
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Department
              </Typography>
              <Typography variant="body1">
                {task.department?.name || "-"}
              </Typography>
            </Grid>

            {/* Created By */}
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Created By
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <MuiAvatar
                  src={getProfilePictureUrl(task.createdBy)}
                  name={getUserDisplayName(task.createdBy)}
                  size={24}
                />
                <Typography variant="body2">
                  {getUserDisplayName(task.createdBy)}
                </Typography>
              </Stack>
            </Grid>

            {/* Start Date */}
            {task.startDate && (
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Start Date
                </Typography>
                <Typography variant="body1">
                  {formatDate(task.startDate, "MMM DD, YYYY")}
                </Typography>
              </Grid>
            )}

            {/* Due Date */}
            {task.dueDate && (
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Due Date
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body1">
                    {formatDate(task.dueDate, "MMM DD, YYYY")}
                  </Typography>
                  {deadlineInfo && (
                    <Chip
                      label={deadlineInfo.text}
                      size="small"
                      color={deadlineInfo.color}
                      variant="outlined"
                    />
                  )}
                </Stack>
              </Grid>
            )}

            {/* Created At */}
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Created At
              </Typography>
              <Typography variant="body1">
                {formatDate(task.createdAt, "MMM DD, YYYY HH:mm")}
              </Typography>
            </Grid>

            {/* Updated At */}
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Last Updated
              </Typography>
              <Typography variant="body1">
                {formatRelative(task.updatedAt)}
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* ProjectTask Specific: Vendor Section */}
        {task.taskType === TASK_TYPES.PROJECT_TASK && task.vendor && (
          <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Vendor Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Vendor Name
                </Typography>
                <Typography variant="body1">
                  {task.vendor.name || "-"}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Contact Person
                </Typography>
                <Typography variant="body1">
                  {task.vendor.contactPerson || "-"}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1">
                  {task.vendor.email || "-"}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Phone
                </Typography>
                <Typography variant="body1">
                  {task.vendor.phone || "-"}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* ProjectTask Specific: Cost Section */}
        {task.taskType === TASK_TYPES.PROJECT_TASK && (
          <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Cost Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid size={{ xs: 6, sm: 4 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Estimated Cost
                </Typography>
                <Typography variant="body1">
                  {formatCurrency(task.estimatedCost)}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Actual Cost
                </Typography>
                <Typography variant="body1">
                  {formatCurrency(task.actualCost)}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Difference
                </Typography>
                <Typography
                  variant="body1"
                  color={
                    task.actualCost > task.estimatedCost
                      ? "error.main"
                      : task.actualCost < task.estimatedCost
                      ? "success.main"
                      : "text.primary"
                  }
                >
                  {formatCurrency(
                    (task.actualCost || 0) - (task.estimatedCost || 0)
                  )}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* ProjectTask Specific: Watchers Section */}
        {task.taskType === TASK_TYPES.PROJECT_TASK &&
          task.watchers?.length > 0 && (
            <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Watchers
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <MuiAvatarGroup max={10}>
                {task.watchers.map((watcher) => (
                  <MuiTooltip
                    key={watcher._id || watcher}
                    title={getUserDisplayName(watcher)}
                  >
                    <MuiAvatar
                      src={getProfilePictureUrl(watcher)}
                      name={getUserDisplayName(watcher)}
                      size={40}
                    />
                  </MuiTooltip>
                ))}
              </MuiAvatarGroup>
            </Paper>
          )}

        {/* RoutineTask Specific: Materials Table */}
        {task.taskType === TASK_TYPES.ROUTINE_TASK &&
          task.materials?.length > 0 && (
            <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Materials
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Alert severity="info" sx={{ mb: 2 }}>
                This is a RoutineTask. Materials are added directly. Activities
                are not supported.
              </Alert>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Material</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell>Unit</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {task.materials.map((item, index) => (
                      <TableRow key={item.material?._id || index}>
                        <TableCell>{item.material?.name || "-"}</TableCell>
                        <TableCell>{item.material?.category || "-"}</TableCell>
                        <TableCell align="right">
                          {item.quantity || 0}
                        </TableCell>
                        <TableCell>{item.material?.unit || "-"}</TableCell>
                        <TableCell align="right">
                          {formatCurrency(item.material?.price)}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(
                            (item.quantity || 0) * (item.material?.price || 0)
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

        {/* AssignedTask Specific: Assignees Section */}
        {task.taskType === TASK_TYPES.ASSIGNED_TASK &&
          task.assignees?.length > 0 && (
            <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Assignees
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                {task.assignees.map((assignee) => (
                  <Stack
                    key={assignee._id || assignee}
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{
                      p: 1,
                      borderRadius: 1,
                      bgcolor:
                        (assignee._id || assignee) === user?._id
                          ? "primary.light"
                          : "grey.100",
                    }}
                  >
                    <MuiAvatar
                      src={getProfilePictureUrl(assignee)}
                      name={getUserDisplayName(assignee)}
                      size={32}
                    />
                    <Typography variant="body2">
                      {getUserDisplayName(assignee)}
                    </Typography>
                    {(assignee._id || assignee) === user?._id && (
                      <Chip label="You" size="small" color="primary" />
                    )}
                  </Stack>
                ))}
              </Stack>
              {isAssignedToMe && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  You are assigned to this task.
                </Alert>
              )}
            </Paper>
          )}

        {/* Tags Section */}
        {task.tags?.length > 0 && (
          <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Tags
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {task.tags.map((tag, index) => (
                <Chip key={index} label={tag} size="small" variant="outlined" />
              ))}
            </Stack>
          </Paper>
        )}
      </Box>
    );
  }, [
    task,
    user?._id,
    formatDate,
    formatRelative,
    deadlineInfo,
    isAssignedToMe,
  ]);

  /** Render Activities Tab Content */
  const renderActivitiesContent = useMemo(() => {
    if (!task) return null;
    if (task.taskType === TASK_TYPES.ROUTINE_TASK) return null;

    return (
      <Box>
        <Paper sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 2 }}
          >
            <Typography variant="h6">Task Activities</Typography>
            {!task.isDeleted && (
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={handleOpenActivityForm}
              >
                Add Activity
              </Button>
            )}
          </Stack>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Activities will be displayed here. TaskActivityTimeline component
            will be implemented in Task 16.2.
          </Typography>
        </Paper>
      </Box>
    );
  }, [task, handleOpenActivityForm]);

  /** Render Comments Tab Content */
  const renderCommentsContent = useMemo(() => {
    if (!task) return null;

    return (
      <Box>
        <Paper sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="h6" gutterBottom>
            Comments
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Comments will be displayed here. TaskCommentThread component will be
            implemented in Task 16.5.
          </Typography>
        </Paper>
      </Box>
    );
  }, [task]);

  /** Get current tab content */
  const currentTabContent = useMemo(() => {
    if (!task) return null;

    // For RoutineTask: tab 0 = Details, tab 1 = Comments
    if (task.taskType === TASK_TYPES.ROUTINE_TASK) {
      if (tabValue === 0) return renderDetailsContent;
      if (tabValue === 1) return renderCommentsContent;
    }

    // For ProjectTask/AssignedTask: tab 0 = Details, tab 1 = Activities, tab 2 = Comments
    if (tabValue === 0) return renderDetailsContent;
    if (tabValue === 1) return renderActivitiesContent;
    if (tabValue === 2) return renderCommentsContent;

    return null;
  }, [
    task,
    tabValue,
    renderDetailsContent,
    renderActivitiesContent,
    renderCommentsContent,
  ]);

  // Loading state
  if (isLoading) {
    return <MuiLoading message="Loading task details..." />;
  }

  // Error state - task not found
  if (!task && !isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Task not found or you don&apos;t have permission to view it.
        </Alert>
        <Button
          variant="contained"
          onClick={() => navigate("/tasks")}
          sx={{ mt: 2 }}
        >
          Back to Tasks
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: isXs ? 8 : 0, px: 1 }}>
      {/* Breadcrumbs */}
      <MuiBreadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        sx={{ my: 2 }}
      >
        <Link
          component={RouterLink}
          to="/dashboard"
          underline="hover"
          color="inherit"
        >
          Dashboard
        </Link>
        <Link
          component={RouterLink}
          to="/tasks"
          underline="hover"
          color="inherit"
        >
          Tasks
        </Link>
        <Typography color="text.primary">{taskTitle}</Typography>
      </MuiBreadcrumbs>

      {/* Page Header */}
      <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
        >
          {/* Title and Badges */}
          <Box>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              flexWrap="wrap"
              useFlexGap
            >
              <TaskTypeIcon color={taskTypeColor} />
              <Typography variant="h5" component="h1">
                {taskTitle}
              </Typography>
            </Stack>

            <Stack
              direction="row"
              spacing={1}
              sx={{ mt: 1 }}
              flexWrap="wrap"
              useFlexGap
            >
              <MuiChip
                label={task.taskType}
                color={taskTypeColor}
                size="small"
              />
              <MuiChip
                label={task.status}
                color={STATUS_COLORS[task.status] || "default"}
                size="small"
              />
              <MuiChip
                label={task.priority}
                color={PRIORITY_COLORS[task.priority] || "default"}
                variant="outlined"
                size="small"
              />
              {task.isDeleted && (
                <MuiChip label="Deleted" color="error" size="small" />
              )}
            </Stack>
          </Box>

          {/* Action Buttons */}
          <Stack direction="row" spacing={1}>
            {!task.isDeleted && canEdit() && (
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={handleEdit}
                disabled={isFetching}
              >
                Edit
              </Button>
            )}
            {!task.isDeleted && canDelete() && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDelete}
                disabled={isDeleting}
              >
                Delete
              </Button>
            )}
            {task.isDeleted && canRestore() && (
              <Button
                variant="contained"
                color="success"
                startIcon={<RestoreIcon />}
                onClick={handleRestore}
                disabled={isRestoring}
              >
                Restore
              </Button>
            )}
          </Stack>
        </Stack>
      </Paper>

      {/* Soft Delete Banner */}
      {task.isDeleted && (
        <Alert
          severity="warning"
          sx={{ mb: 3 }}
          action={
            canRestore() && (
              <Button
                color="inherit"
                size="small"
                startIcon={<RestoreIcon />}
                onClick={handleRestore}
                disabled={isRestoring}
              >
                Restore
              </Button>
            )
          }
        >
          <Typography variant="body2">
            This task was deleted on{" "}
            {formatDate(task.deletedAt, "MMM DD, YYYY")}
            {task.deletedBy && ` by ${getUserDisplayName(task.deletedBy)}`}.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This task will be permanently deleted after the retention period.
            {daysRemaining !== null && ` ${daysRemaining} days remaining.`}
          </Typography>
        </Alert>
      )}

      {/* Tabs */}
      <MuiTabs
        value={tabValue}
        onChange={handleTabChange}
        tabs={tabs}
        sx={{ mb: 3 }}
      />

      {/* Tab Content */}
      {currentTabContent}

      {/* Form Dialogs */}
      {task.taskType === TASK_TYPES.PROJECT_TASK && (
        <ProjectTaskForm
          open={projectFormOpen}
          onClose={handleCloseProjectForm}
          task={task}
          onSuccess={handleTaskSuccess}
        />
      )}

      {task.taskType === TASK_TYPES.ROUTINE_TASK && (
        <RoutineTaskForm
          open={routineFormOpen}
          onClose={handleCloseRoutineForm}
          task={task}
          onSuccess={handleTaskSuccess}
        />
      )}

      {task.taskType === TASK_TYPES.ASSIGNED_TASK && (
        <AssignedTaskForm
          open={assignedFormOpen}
          onClose={handleCloseAssignedForm}
          task={task}
          onSuccess={handleTaskSuccess}
        />
      )}

      {/* Task Activity Form Dialog - for ProjectTask and AssignedTask only */}
      {(task.taskType === TASK_TYPES.PROJECT_TASK ||
        task.taskType === TASK_TYPES.ASSIGNED_TASK) && (
        <TaskActivityForm
          open={activityFormOpen}
          onClose={handleCloseActivityForm}
          task={task}
          onSuccess={handleActivitySuccess}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <MuiDialogConfirm
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        title="Delete Task"
        message={deleteDialogMessage}
        confirmText="Delete"
        confirmColor="error"
        isLoading={isDeleting}
      />

      {/* Bottom Navigation for Mobile */}
      {isXs && (
        <MuiBottomNavigation
          value="/tasks"
          onChange={handleBottomNavChange}
          actions={BOTTOM_NAV_ACTIONS}
          showLabels
        />
      )}
    </Box>
  );
};

export default TaskDetailPage;
