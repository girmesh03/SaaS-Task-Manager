/**
 * TaskActivityTimeline Component - Task Activity Timeline Display
 *
 * Displays task activities in a timeline format with:
 * - Activity text and materials used
 * - Created by user with avatar
 * - Relative timestamps
 * - Action menu for edit/delete (if authorized)
 * - FAB for adding new activities
 * - Empty state with add button
 * - Real-time updates via Socket.IO
 *
 * Requirements: 8.1, 8.8, 8.10
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import {
  Box,
  Typography,
  Stack,
  Paper,
  IconButton,
  Alert,
  Chip,
  Button,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RestoreIcon from "@mui/icons-material/Restore";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import AddIcon from "@mui/icons-material/Add";
import InventoryIcon from "@mui/icons-material/Inventory";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import BuildIcon from "@mui/icons-material/Build";
import { toast } from "react-toastify";
import {
  MuiTimeline,
  MuiAvatar,
  MuiMenu,
  MuiFAB,
  MuiLoading,
  MuiDialogConfirm,
  MuiChip,
} from "../common";
import TaskActivityForm from "./TaskActivityForm";
import useAuth from "../../hooks/useAuth";
import useTimezone from "../../hooks/useTimezone";
import {
  useGetTaskActivitiesQuery,
  useDeleteTaskActivityMutation,
  useRestoreTaskActivityMutation,
} from "../../redux/features/taskActivityApi";
import { handleApiError } from "../../utils/errorHandler";
import { CURRENCY, TASK_TYPES } from "../../utils/constants";

/** Format currency value */
const formatCurrency = (value, currency = CURRENCY.DEFAULT) => {
  if (value === null || value === undefined) return "-";
  return `${currency} ${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
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

/** Get profile picture URL safely */
const getProfilePictureUrl = (user) => {
  if (!user) return null;
  if (user.profilePicture?.url) return user.profilePicture.url;
  return null;
};

/**
 * TaskActivityTimeline Component
 *
 * @param {Object} props - Component props
 * @param {Object} props.task - Parent task object
 * @param {Function} props.onActivityChange - Callback when activities change
 */
const TaskActivityTimeline = ({ task, onActivityChange }) => {
  const { user } = useAuth();
  const { formatRelative } = useTimezone();

  // Dialog states
  const [activityFormOpen, setActivityFormOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState(null);

  // Menu state
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [menuActivity, setMenuActivity] = useState(null);

  // RTK Query - Fetch activities
  const {
    data: activitiesResponse,
    isLoading,
    error: activitiesError,
  } = useGetTaskActivitiesQuery(
    { task: task?._id, deleted: task.isDeleted, page: 1, limit: 100 },
    { skip: !task?._id }
  );

  // Extract activities from response
  const activities = useMemo(
    () => activitiesResponse?.data || [],
    [activitiesResponse]
  );

  // RTK Query - Delete and Restore mutations
  const [deleteActivity, { isLoading: isDeleting }] =
    useDeleteTaskActivityMutation();
  const [restoreActivity, { isLoading: isRestoring }] =
    useRestoreTaskActivityMutation();

  // Handle API errors
  useEffect(() => {
    if (activitiesError) {
      const { message } = handleApiError(activitiesError);
      toast.error(message);
    }
  }, [activitiesError]);

  /** Handle open activity form for create */
  const handleOpenCreateForm = useCallback(() => {
    setSelectedActivity(null);
    setActivityFormOpen(true);
  }, []);

  /** Handle open activity form for edit */
  const handleOpenEditForm = useCallback((activity) => {
    setSelectedActivity(activity);
    setActivityFormOpen(true);
    setMenuAnchorEl(null);
  }, []);

  /** Handle close activity form */
  const handleCloseActivityForm = useCallback(() => {
    setActivityFormOpen(false);
    setSelectedActivity(null);
  }, []);

  /** Handle activity form success */
  const handleActivitySuccess = useCallback(() => {
    onActivityChange?.();
  }, [onActivityChange]);

  /** Handle open menu */
  const handleOpenMenu = useCallback((event, activity) => {
    setMenuAnchorEl(event.currentTarget);
    setMenuActivity(activity);
  }, []);

  /** Handle close menu */
  const handleCloseMenu = useCallback(() => {
    setMenuAnchorEl(null);
    setMenuActivity(null);
  }, []);

  /** Handle delete click */
  const handleDeleteClick = useCallback((activity) => {
    setActivityToDelete(activity);
    setDeleteDialogOpen(true);
    setMenuAnchorEl(null);
  }, []);

  /** Handle close delete dialog */
  const handleCloseDeleteDialog = useCallback(() => {
    setDeleteDialogOpen(false);
    setActivityToDelete(null);
  }, []);

  /** Handle confirm delete */
  const handleConfirmDelete = useCallback(async () => {
    if (!activityToDelete?._id) return;
    try {
      await deleteActivity(activityToDelete._id).unwrap();
      toast.success("Activity deleted successfully");
      setDeleteDialogOpen(false);
      setActivityToDelete(null);
      onActivityChange?.();
    } catch (error) {
      const { message } = handleApiError(error);
      toast.error(message);
    }
  }, [activityToDelete, deleteActivity, onActivityChange]);

  /** Handle restore activity */
  const handleRestore = useCallback(
    async (activity) => {
      if (!activity?._id) return;
      try {
        await restoreActivity(activity._id).unwrap();
        toast.success("Activity restored successfully");
        setMenuAnchorEl(null);
        onActivityChange?.();
      } catch (error) {
        const { message } = handleApiError(error);
        toast.error(message);
      }
    },
    [restoreActivity, onActivityChange]
  );

  /** Build menu items for activity */
  const buildMenuItems = useCallback(
    (activity) => {
      const items = [];

      // Check authorization for this specific activity
      const canEditActivity =
        !activity.isDeleted &&
        (user?._id === activity.createdBy?._id ||
          user?._id === activity.createdBy);

      const canDeleteActivity =
        !activity.isDeleted &&
        (user?._id === activity.createdBy?._id ||
          user?._id === activity.createdBy);

      const canRestoreActivity =
        activity.isDeleted &&
        (user?._id === activity.createdBy?._id ||
          user?._id === activity.createdBy);

      if (canEditActivity) {
        items.push({
          id: "edit",
          label: "Edit",
          icon: <EditIcon fontSize="small" />,
          onClick: () => handleOpenEditForm(activity),
        });
      }

      if (canDeleteActivity) {
        items.push({
          id: "delete",
          label: "Delete",
          icon: <DeleteIcon fontSize="small" />,
          onClick: () => handleDeleteClick(activity),
        });
      }

      if (canRestoreActivity) {
        items.push({
          id: "restore",
          label: "Restore",
          icon: <RestoreIcon fontSize="small" />,
          onClick: () => handleRestore(activity),
        });
      }

      return items;
    },
    [user, handleOpenEditForm, handleDeleteClick, handleRestore]
  );

  /** Build timeline items from activities */
  const timelineItems = useMemo(() => {
    return activities.map((activity) => {
      const menuItems = buildMenuItems(activity);
      const hasMenu = menuItems.length > 0;

      // Calculate total materials cost
      const totalMaterialsCost =
        activity.materials?.reduce((sum, m) => {
          const qty = parseFloat(m.quantity) || 0;
          const price = parseFloat(m.material?.price) || 0;
          return sum + qty * price;
        }, 0) || 0;

      return {
        id: activity._id,
        dotColor: activity.isDeleted ? "error" : "primary",
        dotVariant: "filled",
        icon: <BuildIcon fontSize="small" />,
        oppositeContent: formatRelative(activity.createdAt),
        content: (
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              opacity: activity.isDeleted ? 0.6 : 1,
              bgcolor: activity.isDeleted
                ? "action.disabledBackground"
                : "background.paper",
            }}
          >
            {/* Header with user and actions */}
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="flex-start"
              sx={{ mb: 1 }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <MuiAvatar
                  src={getProfilePictureUrl(activity.createdBy)}
                  name={getUserDisplayName(activity.createdBy)}
                  size={32}
                />
                <Box>
                  <Typography variant="subtitle2">
                    {getUserDisplayName(activity.createdBy)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatRelative(activity.createdAt)}
                  </Typography>
                </Box>
              </Stack>

              {hasMenu && (
                <IconButton
                  size="small"
                  onClick={(e) => handleOpenMenu(e, activity)}
                  disabled={isDeleting || isRestoring}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              )}
            </Stack>

            {/* Deleted badge */}
            {activity.isDeleted && (
              <MuiChip
                label="Deleted"
                color="error"
                size="small"
                sx={{ mb: 1 }}
              />
            )}

            {/* Activity text */}
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mb: 2 }}>
              {activity.activity}
            </Typography>

            {/* Materials section */}
            {activity.materials?.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Stack
                  direction="row"
                  spacing={0.5}
                  alignItems="center"
                  sx={{ mb: 1 }}
                >
                  <InventoryIcon fontSize="small" color="action" />
                  <Typography variant="subtitle2" color="text.secondary">
                    Materials Used ({activity.materials.length})
                  </Typography>
                </Stack>
                <Stack spacing={0.5}>
                  {activity.materials.map((m, idx) => (
                    <Stack
                      key={m.material?._id || idx}
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{
                        px: 1,
                        py: 0.5,
                        bgcolor: "action.hover",
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="body2">
                        {m.material?.name || "Unknown Material"}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          label={`${m.quantity} ${m.material?.unit || ""}`}
                          size="small"
                          variant="outlined"
                        />
                        <Typography variant="body2" color="text.secondary">
                          {formatCurrency(
                            (m.quantity || 0) * (m.material?.price || 0)
                          )}
                        </Typography>
                      </Stack>
                    </Stack>
                  ))}
                </Stack>
                <Typography
                  variant="subtitle2"
                  sx={{ mt: 1, textAlign: "right" }}
                >
                  Total: {formatCurrency(totalMaterialsCost)}
                </Typography>
              </Box>
            )}

            {/* Attachments placeholder */}
            {activity.attachments?.length > 0 && (
              <Stack direction="row" spacing={0.5} alignItems="center">
                <AttachFileIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {activity.attachments.length} attachment(s)
                </Typography>
              </Stack>
            )}
          </Paper>
        ),
      };
    });
  }, [
    activities,
    buildMenuItems,
    formatRelative,
    handleOpenMenu,
    isDeleting,
    isRestoring,
  ]);

  // Loading state
  if (isLoading) {
    return <MuiLoading message="Loading activities..." />;
  }

  // Check if task supports activities
  if (task?.taskType === TASK_TYPES.ROUTINE_TASK) {
    return (
      <Alert severity="info">
        RoutineTask does not support activities. Materials are added directly to
        the task.
      </Alert>
    );
  }

  // Empty state
  if (activities.length === 0) {
    return (
      <Box>
        <Paper
          sx={{
            p: 4,
            textAlign: "center",
            bgcolor: "background.default",
          }}
        >
          <BuildIcon sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No activities yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Activities track work progress and materials used on this task.
          </Typography>
          {!task?.isDeleted && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenCreateForm}
              sx={{ mt: 1 }}
            >
              Add Activity
            </Button>
          )}
        </Paper>

        {/* Activity Form Dialog */}
        <TaskActivityForm
          open={activityFormOpen}
          onClose={handleCloseActivityForm}
          task={task}
          activity={selectedActivity}
          onSuccess={handleActivitySuccess}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ position: "relative", pb: 10 }}>
      {/* Timeline */}
      <MuiTimeline items={timelineItems} position="right" />

      {/* FAB for adding activity - fixed position */}
      {!task?.isDeleted && (
        <MuiFAB
          color="primary"
          size="medium"
          onClick={handleOpenCreateForm}
          aria-label="Add activity"
          sx={{
            position: "fixed",
            bottom: { xs: 72, sm: 24 },
            right: { xs: 16, sm: 24 },
            zIndex: 1000,
          }}
          animated
        >
          <AddIcon />
        </MuiFAB>
      )}

      {/* Action Menu */}
      <MuiMenu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleCloseMenu}
        items={menuActivity ? buildMenuItems(menuActivity) : []}
      />

      {/* Activity Form Dialog */}
      <TaskActivityForm
        open={activityFormOpen}
        onClose={handleCloseActivityForm}
        task={task}
        activity={selectedActivity}
        onSuccess={handleActivitySuccess}
      />

      {/* Delete Confirmation Dialog */}
      <MuiDialogConfirm
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        title="Delete Activity"
        message="Are you sure you want to delete this activity? This action can be undone by restoring the activity."
        confirmText="Delete"
        confirmColor="error"
        isLoading={isDeleting}
      />
    </Box>
  );
};

export default TaskActivityTimeline;
