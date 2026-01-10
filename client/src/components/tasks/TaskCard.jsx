/**
 * TaskCard Component - Task Display Card (Three-Layer Pattern)
 *
 * Card component for displaying task information.
 * Supports all 3 task types with conditional rendering.
 * Uses React.memo for performance optimization.
 * Uses MuiCard with CardHeader, CardContent, CardActions.
 *
 * Requirements: 5.1, 6.1, 7.1
 */

import { memo, useState, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  alpha,
  useTheme,
} from "@mui/material";
import { useNavigate } from "react-router";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import WorkIcon from "@mui/icons-material/Work";
import RepeatIcon from "@mui/icons-material/Repeat";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CommentIcon from "@mui/icons-material/Comment";
import TimelineIcon from "@mui/icons-material/Timeline";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RestoreIcon from "@mui/icons-material/Restore";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import StoreIcon from "@mui/icons-material/Store";
import InventoryIcon from "@mui/icons-material/Inventory";
import {
  MuiCard,
  MuiChip,
  MuiAvatar,
  MuiAvatarGroup,
  MuiMenu,
  MuiTooltip,
} from "../common";
import useAuth from "../../hooks/useAuth";
import useAuthorization from "../../hooks/useAuthorization";
import {
  formatDateForDisplay,
  formatDeadlineCountdown,
} from "../../utils/dateUtils";
import {
  TASK_TYPES,
  TASK_STATUS,
  TASK_PRIORITY,
  CURRENCY,
} from "../../utils/constants";

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

/**
 * TaskCard Component
 */
const TaskCard = memo(({ task, onView, onEdit, onDelete, onRestore }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canUpdate, canDelete, canRestore } = useAuthorization("Task");

  // Menu state
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const menuOpen = Boolean(menuAnchorEl);

  // Get task type color
  const taskTypeColor = TASK_TYPE_COLORS[task.taskType] || "primary";

  // Check if current user is assigned to this task
  const isAssignedToMe = useMemo(() => {
    if (task.taskType !== TASK_TYPES.ASSIGNED_TASK) return false;
    return task.assignees?.some(
      (assignee) => (assignee._id || assignee) === user?._id
    );
  }, [task, user]);

  // Format deadline countdown
  const deadlineInfo = useMemo(() => {
    if (!task.dueDate) return null;
    return formatDeadlineCountdown(task.dueDate);
  }, [task.dueDate]);

  const handleMenuOpen = useCallback((event) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setMenuAnchorEl(null);
  }, []);

  const handleView = useCallback(() => {
    handleMenuClose();
    if (onView) {
      onView(task);
    } else {
      navigate(`/tasks/${task._id}`);
    }
  }, [task, onView, navigate, handleMenuClose]);

  const handleEdit = useCallback(() => {
    handleMenuClose();
    if (onEdit) onEdit(task);
  }, [task, onEdit, handleMenuClose]);

  const handleDelete = useCallback(() => {
    handleMenuClose();
    if (onDelete) onDelete(task);
  }, [task, onDelete, handleMenuClose]);

  const handleRestore = useCallback(() => {
    handleMenuClose();
    if (onRestore) onRestore(task);
  }, [task, onRestore, handleMenuClose]);

  const handleCardClick = useCallback(() => {
    handleView();
  }, [handleView]);

  // Build menu items based on authorization and task state
  const menuItems = useMemo(() => {
    const items = [
      {
        id: "view",
        label: "View Details",
        icon: <VisibilityIcon fontSize="small" />,
        onClick: handleView,
      },
    ];
    if (!task.isDeleted && canUpdate(task)) {
      items.push({
        id: "edit",
        label: "Edit",
        icon: <EditIcon fontSize="small" />,
        onClick: handleEdit,
      });
    }
    if (!task.isDeleted && canDelete(task)) {
      items.push({
        id: "delete",
        label: "Delete",
        icon: <DeleteIcon fontSize="small" />,
        onClick: handleDelete,
      });
    }
    if (task.isDeleted && canRestore(task)) {
      items.push({
        id: "restore",
        label: "Restore",
        icon: <RestoreIcon fontSize="small" />,
        onClick: handleRestore,
      });
    }
    return items;
  }, [
    task,
    canUpdate,
    canDelete,
    canRestore,
    handleView,
    handleEdit,
    handleDelete,
    handleRestore,
  ]);

  /** Get task type icon component */
  const getTaskTypeIcon = useCallback(() => {
    const IconComponent = TASK_TYPE_ICONS[task.taskType] || WorkIcon;
    return (
      <IconComponent
        sx={{ fontSize: 20, color: theme.palette[taskTypeColor].main }}
      />
    );
  }, [task.taskType, theme, taskTypeColor]);

  /** Render card header avatar with task type icon */
  const headerAvatar = useMemo(
    () => (
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: alpha(theme.palette[taskTypeColor].main, 0.1),
        }}
      >
        {getTaskTypeIcon()}
      </Box>
    ),
    [theme, taskTypeColor, getTaskTypeIcon]
  );

  /** Render card header action (menu button) */
  const headerAction = useMemo(
    () => (
      <>
        <IconButton size="small" onClick={handleMenuOpen}>
          <MoreVertIcon fontSize="small" />
        </IconButton>
        <MuiMenu
          anchorEl={menuAnchorEl}
          open={menuOpen}
          onClose={handleMenuClose}
          items={menuItems}
          dense
        />
      </>
    ),
    [menuAnchorEl, menuOpen, handleMenuOpen, handleMenuClose, menuItems]
  );

  /** Get card title based on task type */
  const cardTitle = useMemo(() => {
    if (
      task.taskType === TASK_TYPES.PROJECT_TASK ||
      task.taskType === TASK_TYPES.ASSIGNED_TASK
    ) {
      return task.title;
    }
    return task.description?.substring(0, 50) || "Routine Task";
  }, [task]);

  /** Get card subheader with task type badge */
  const cardSubheader = useMemo(
    () => (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
        <MuiChip
          label={task.taskType}
          size="small"
          color={taskTypeColor}
          variant="outlined"
          sx={{ height: 20, fontSize: "0.7rem" }}
        />
        {task.isDeleted && (
          <MuiChip
            label="Deleted"
            size="small"
            color="error"
            sx={{ height: 20, fontSize: "0.7rem" }}
          />
        )}
      </Box>
    ),
    [task.taskType, task.isDeleted, taskTypeColor]
  );

  /** Render ProjectTask specific content */
  const renderProjectTaskContent = useCallback(
    () => (
      <>
        {task.vendor && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}>
            <StoreIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary" noWrap>
              {task.vendor.name || task.vendor}
            </Typography>
          </Box>
        )}
        <Box sx={{ display: "flex", gap: 2, mb: 1, flexWrap: "wrap" }}>
          {task.estimatedCost !== undefined && task.estimatedCost !== null && (
            <Typography variant="caption" color="text.secondary">
              Est: {formatCurrency(task.estimatedCost, task.currency)}
            </Typography>
          )}
          {task.actualCost !== undefined && task.actualCost !== null && (
            <Typography variant="caption" color="text.secondary">
              Act: {formatCurrency(task.actualCost, task.currency)}
            </Typography>
          )}
        </Box>
        {task.watchers && task.watchers.length > 0 && (
          <Box sx={{ mb: 1 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 0.5, display: "block" }}
            >
              Watchers:
            </Typography>
            <MuiAvatarGroup max={3} spacing="small">
              {task.watchers.map((watcher) => (
                <MuiTooltip
                  key={watcher._id || watcher}
                  title={
                    watcher.firstName
                      ? `${watcher.firstName} ${watcher.lastName}`
                      : "Watcher"
                  }
                >
                  <Box>
                    <MuiAvatar
                      src={watcher.profilePicture}
                      name={
                        watcher.firstName
                          ? `${watcher.firstName} ${watcher.lastName}`
                          : "W"
                      }
                      size={24}
                    />
                  </Box>
                </MuiTooltip>
              ))}
            </MuiAvatarGroup>
          </Box>
        )}
      </>
    ),
    [task]
  );

  /** Render RoutineTask specific content */
  const renderRoutineTaskContent = useCallback(
    () => (
      <>
        {task.materials && task.materials.length > 0 && (
          <Box sx={{ mb: 1 }}>
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}
            >
              <InventoryIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                Materials ({task.materials.length})
              </Typography>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
              {task.materials.slice(0, 3).map((material, index) => (
                <Typography
                  key={material._id || index}
                  variant="caption"
                  color="text.secondary"
                  noWrap
                >
                  • {material.material?.name || material.name || "Material"} (
                  {material.quantity} {material.unit || material.material?.unit}
                  )
                </Typography>
              ))}
              {task.materials.length > 3 && (
                <Typography variant="caption" color="primary">
                  +{task.materials.length - 3} more
                </Typography>
              )}
            </Box>
          </Box>
        )}
      </>
    ),
    [task]
  );

  /** Render AssignedTask specific content */
  const renderAssignedTaskContent = useCallback(
    () => (
      <>
        {task.assignees && task.assignees.length > 0 && (
          <Box sx={{ mb: 1 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 0.5, display: "block" }}
            >
              Assignees:
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <MuiAvatarGroup max={3} spacing="small">
                {task.assignees.map((assignee) => (
                  <MuiTooltip
                    key={assignee._id || assignee}
                    title={
                      assignee.firstName
                        ? `${assignee.firstName} ${assignee.lastName}`
                        : "Assignee"
                    }
                  >
                    <Box>
                      <MuiAvatar
                        src={assignee.profilePicture}
                        name={
                          assignee.firstName
                            ? `${assignee.firstName} ${assignee.lastName}`
                            : "A"
                        }
                        size={24}
                      />
                    </Box>
                  </MuiTooltip>
                ))}
              </MuiAvatarGroup>
              {isAssignedToMe && (
                <MuiChip
                  label="Assigned to You"
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ height: 20, fontSize: "0.65rem" }}
                />
              )}
            </Box>
          </Box>
        )}
      </>
    ),
    [task, isAssignedToMe]
  );

  /** Render type-specific content based on task type */
  const renderTypeSpecificContent = useCallback(() => {
    switch (task.taskType) {
      case TASK_TYPES.PROJECT_TASK:
        return renderProjectTaskContent();
      case TASK_TYPES.ROUTINE_TASK:
        return renderRoutineTaskContent();
      case TASK_TYPES.ASSIGNED_TASK:
        return renderAssignedTaskContent();
      default:
        return null;
    }
  }, [
    task.taskType,
    renderProjectTaskContent,
    renderRoutineTaskContent,
    renderAssignedTaskContent,
  ]);

  /** Render card content (CardContent children) */
  const cardContent = useMemo(
    () => (
      <Box onClick={handleCardClick} sx={{ cursor: "pointer" }}>
        {/* Description (truncated) */}
        {task.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 1.5,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {task.description}
          </Typography>
        )}

        {/* Status and Priority Badges */}
        <Box sx={{ display: "flex", gap: 1, mb: 1.5, flexWrap: "wrap" }}>
          <MuiChip
            label={task.status}
            size="small"
            color={STATUS_COLORS[task.status] || "default"}
            sx={{ height: 22, fontSize: "0.7rem" }}
          />
          <MuiChip
            label={task.priority}
            size="small"
            color={PRIORITY_COLORS[task.priority] || "default"}
            variant="outlined"
            sx={{ height: 22, fontSize: "0.7rem" }}
          />
        </Box>

        {/* Type-specific content */}
        {renderTypeSpecificContent()}

        {/* Dates Section */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mb: 1 }}>
          {task.startDate && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <CalendarTodayIcon
                fontSize="small"
                color="action"
                sx={{ fontSize: 14 }}
              />
              <Typography variant="caption" color="text.secondary">
                Start: {formatDateForDisplay(task.startDate, "MMM DD, YYYY")}
              </Typography>
            </Box>
          )}
          {task.dueDate && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <CalendarTodayIcon
                fontSize="small"
                color="action"
                sx={{ fontSize: 14 }}
              />
              <Typography variant="caption" color="text.secondary">
                Due: {formatDateForDisplay(task.dueDate, "MMM DD, YYYY")}
              </Typography>
              {deadlineInfo && (
                <MuiChip
                  label={deadlineInfo.text}
                  size="small"
                  color={deadlineInfo.color}
                  sx={{ height: 18, fontSize: "0.65rem", ml: 0.5 }}
                />
              )}
            </Box>
          )}
        </Box>

        {/* Tags (max 3) */}
        {task.tags && task.tags.length > 0 && (
          <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
            {task.tags.slice(0, 3).map((tag, index) => (
              <MuiChip
                key={index}
                label={tag}
                size="small"
                variant="outlined"
                sx={{ height: 20, fontSize: "0.65rem" }}
              />
            ))}
            {task.tags.length > 3 && (
              <Typography variant="caption" color="primary">
                +{task.tags.length - 3}
              </Typography>
            )}
          </Box>
        )}
      </Box>
    ),
    [task, handleCardClick, renderTypeSpecificContent, deadlineInfo]
  );

  /** Render card actions (counts) */
  const cardActions = useMemo(
    () => (
      <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
        <Tooltip title="Attachments">
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <AttachFileIcon
              fontSize="small"
              color="action"
              sx={{ fontSize: 16 }}
            />
            <Typography variant="caption" color="text.secondary">
              {task.attachments?.length || 0}
            </Typography>
          </Box>
        </Tooltip>
        {task.taskType !== TASK_TYPES.ROUTINE_TASK && (
          <Tooltip title="Activities">
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <TimelineIcon
                fontSize="small"
                color="action"
                sx={{ fontSize: 16 }}
              />
              <Typography variant="caption" color="text.secondary">
                {task.activitiesCount || 0}
              </Typography>
            </Box>
          </Tooltip>
        )}
        <Tooltip title="Comments">
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <CommentIcon
              fontSize="small"
              color="action"
              sx={{ fontSize: 16 }}
            />
            <Typography variant="caption" color="text.secondary">
              {task.commentsCount || 0}
            </Typography>
          </Box>
        </Tooltip>
      </Box>
    ),
    [task]
  );

  return (
    <MuiCard
      avatar={headerAvatar}
      action={headerAction}
      title={cardTitle}
      subheader={cardSubheader}
      headerSx={{
        pb: 0,
        "& .MuiCardHeader-title": {
          fontSize: "0.95rem",
          fontWeight: 600,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        },
      }}
      contentSx={{ pt: 1.5, pb: 1 }}
      actionsSx={{ pt: 0, px: 2, pb: 1.5 }}
      actions={cardActions}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        opacity: task.isDeleted ? 0.7 : 1,
        border: task.isDeleted
          ? `1px solid ${theme.palette.error.main}`
          : "none",
        "&:hover": { boxShadow: theme.shadows[4] },
      }}
    >
      {cardContent}
    </MuiCard>
  );
});

TaskCard.displayName = "TaskCard";

export default TaskCard;
