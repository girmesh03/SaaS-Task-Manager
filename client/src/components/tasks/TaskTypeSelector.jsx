/**
 * TaskTypeSelector Component - Task Type Selection Dialog
 *
 * Dialog for selecting task type before creating a new task.
 * Displays 3 clickable cards for ProjectTask, RoutineTask, and AssignedTask.
 *
 * Requirements: 5.1, 6.1, 7.1
 */

import { useState, useCallback, memo } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  alpha,
  useTheme,
} from "@mui/material";
import WorkIcon from "@mui/icons-material/Work";
import RepeatIcon from "@mui/icons-material/Repeat";
import AssignmentIcon from "@mui/icons-material/Assignment";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { MuiDialog } from "../common";
import { TASK_TYPES } from "../../utils/constants";
import useResponsive from "../../hooks/useResponsive";

/**
 * Task type configuration
 * Defines the properties for each task type card
 */
const TASK_TYPE_CONFIG = [
  {
    type: TASK_TYPES.PROJECT_TASK,
    icon: WorkIcon,
    title: "Project Task",
    description: "Outsourced tasks to external vendors with cost tracking",
    features: [
      "Vendor assignment",
      "Cost tracking",
      "HOD watchers",
      "Activities with materials",
    ],
    color: "primary",
  },
  {
    type: TASK_TYPES.ROUTINE_TASK,
    icon: RepeatIcon,
    title: "Routine Task",
    description: "Daily tasks from outlets with direct material assignment",
    features: [
      "Direct material addition",
      "No activities",
      "Required dates not future",
      'Status NOT "To Do"',
      'Priority NOT "Low"',
    ],
    color: "warning",
  },
  {
    type: TASK_TYPES.ASSIGNED_TASK,
    icon: AssignmentIcon,
    title: "Assigned Task",
    description: "Internal tasks assigned to users with progress tracking",
    features: [
      "User assignment",
      "Activities with materials",
      "Optional dates",
      "All statuses/priorities",
    ],
    color: "success",
  },
];

/**
 * TaskTypeCard Component - Individual task type card
 *
 * @param {Object} props - Component props
 * @param {Object} props.config - Task type configuration
 * @param {Function} props.onSelect - Callback when card is selected
 * @param {boolean} props.isSelected - Whether this card is selected
 */
const TaskTypeCard = memo(({ config, onSelect, isSelected }) => {
  const theme = useTheme();
  const { isMobile } = useResponsive();
  const IconComponent = config.icon;

  const handleClick = useCallback(() => {
    onSelect(config.type);
  }, [onSelect, config.type]);

  return (
    <Card
      elevation={isSelected ? 4 : 1}
      sx={{
        height: "100%",
        transition: "all 0.2s ease-in-out",
        border: isSelected
          ? `2px solid ${theme.palette[config.color].main}`
          : `1px solid ${theme.palette.divider}`,
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: theme.shadows[4],
          borderColor: theme.palette[config.color].main,
        },
      }}
    >
      <CardActionArea
        onClick={handleClick}
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          p: 0,
        }}
      >
        <CardContent
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            p: isMobile ? 2 : 3,
          }}
        >
          {/* Icon */}
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: alpha(theme.palette[config.color].main, 0.1),
              mb: 2,
            }}
          >
            <IconComponent
              sx={{
                fontSize: 32,
                color: theme.palette[config.color].main,
              }}
            />
          </Box>

          {/* Title */}
          <Typography
            variant="h6"
            component="h3"
            gutterBottom
            sx={{ fontWeight: 600 }}
          >
            {config.title}
          </Typography>

          {/* Description */}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2, minHeight: isMobile ? "auto" : 40 }}
          >
            {config.description}
          </Typography>

          {/* Features List */}
          <List dense disablePadding sx={{ width: "100%", textAlign: "left" }}>
            {config.features.map((feature, index) => (
              <ListItem key={index} disablePadding sx={{ py: 0.25 }}>
                <ListItemIcon sx={{ minWidth: 28 }}>
                  <CheckCircleOutlineIcon
                    sx={{
                      fontSize: 16,
                      color: theme.palette[config.color].main,
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={feature}
                  primaryTypographyProps={{
                    variant: "caption",
                    color: "text.secondary",
                  }}
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </CardActionArea>
    </Card>
  );
});

TaskTypeCard.displayName = "TaskTypeCard";

/**
 * TaskTypeSelector Component
 *
 * @param {Object} props - Component props
 * @param {boolean} props.open - Whether dialog is open
 * @param {Function} props.onClose - Callback when dialog is closed
 * @param {Function} props.onSelectType - Callback when task type is selected
 */
const TaskTypeSelector = ({ open, onClose, onSelectType }) => {
  const { isMobile } = useResponsive();
  const [selectedType, setSelectedType] = useState(null);

  /**
   * Handle task type selection
   * Opens the corresponding form dialog
   */
  const handleSelectType = useCallback(
    (type) => {
      setSelectedType(type);
      if (onSelectType) {
        onSelectType(type);
      }
      onClose();
    },
    [onSelectType, onClose]
  );

  /**
   * Handle dialog close
   * Resets selected type
   */
  const handleClose = useCallback(() => {
    setSelectedType(null);
    onClose();
  }, [onClose]);

  return (
    <MuiDialog
      open={open}
      onClose={handleClose}
      title="Create New Task"
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      actions={
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
      }
    >
      <Box sx={{ py: 1 }}>
        {/* Subtitle */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 3, textAlign: "center" }}
        >
          Select the type of task you want to create
        </Typography>

        {/* Task Type Cards Grid */}
        <Grid container spacing={2}>
          {TASK_TYPE_CONFIG.map((config) => (
            <Grid key={config.type} size={{ xs: 12, sm: 6, md: 4 }}>
              <TaskTypeCard
                config={config}
                onSelect={handleSelectType}
                isSelected={selectedType === config.type}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    </MuiDialog>
  );
};

export default memo(TaskTypeSelector);
