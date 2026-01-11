/**
 * TasksList Component - Task List Display (Three-Layer Pattern Middle Layer)
 *
 * List component for displaying tasks in a grid layout.
 * Maps tasks array to TaskCard components.
 * Supports loading state with skeleton cards.
 * Supports empty state with create button.
 * Supports server-side pagination.
 *
 * Requirements: 5.1, 6.1, 7.1
 */

import { useMemo, useCallback } from "react";
import { Box, Typography, Grid, Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import { MuiSkeleton, MuiPagination, MuiCard } from "../common";
import { TaskCard } from "./index";

/**
 * Skeleton card for loading state
 */
const TaskCardSkeleton = () => (
  <MuiCard
    sx={{
      height: "100%",
      display: "flex",
      flexDirection: "column",
    }}
  >
    <Box sx={{ p: 2 }}>
      {/* Header skeleton */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <MuiSkeleton variant="circular" width={36} height={36} />
        <Box sx={{ flex: 1 }}>
          <MuiSkeleton variant="text" width="60%" height={20} />
          <MuiSkeleton variant="text" width="40%" height={16} />
        </Box>
      </Box>
      {/* Description skeleton */}
      <MuiSkeleton variant="text" width="100%" height={16} />
      <MuiSkeleton variant="text" width="80%" height={16} sx={{ mb: 1.5 }} />
      {/* Badges skeleton */}
      <Box sx={{ display: "flex", gap: 1, mb: 1.5 }}>
        <MuiSkeleton variant="rounded" width={70} height={22} />
        <MuiSkeleton variant="rounded" width={60} height={22} />
      </Box>
      {/* Content skeleton */}
      <MuiSkeleton variant="text" width="70%" height={14} />
      <MuiSkeleton variant="text" width="50%" height={14} sx={{ mb: 1 }} />
      {/* Dates skeleton */}
      <MuiSkeleton variant="text" width="60%" height={14} />
      <MuiSkeleton variant="text" width="55%" height={14} sx={{ mb: 1 }} />
      {/* Tags skeleton */}
      <Box sx={{ display: "flex", gap: 0.5 }}>
        <MuiSkeleton variant="rounded" width={50} height={20} />
        <MuiSkeleton variant="rounded" width={45} height={20} />
      </Box>
    </Box>
    {/* Actions skeleton */}
    <Box sx={{ px: 2, pb: 1.5, mt: "auto" }}>
      <Box sx={{ display: "flex", gap: 2 }}>
        <MuiSkeleton variant="text" width={30} height={16} />
        <MuiSkeleton variant="text" width={30} height={16} />
        <MuiSkeleton variant="text" width={30} height={16} />
      </Box>
    </Box>
  </MuiCard>
);

/**
 * Empty state component
 */
const EmptyState = ({ onCreateTask, canCreate }) => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      py: 8,
      px: 2,
      textAlign: "center",
    }}
  >
    <SearchOffIcon sx={{ fontSize: 80, color: "text.disabled", mb: 2 }} />
    <Typography variant="h6" color="text.secondary" gutterBottom>
      No tasks found
    </Typography>
    <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>
      Try adjusting your filters or create a new task
    </Typography>
    {canCreate && onCreateTask && (
      <Button
        variant="contained"
        color="primary"
        startIcon={<AddIcon />}
        onClick={onCreateTask}
      >
        Create Task
      </Button>
    )}
  </Box>
);

/**
 * TasksList Component
 *
 * @param {Object} props - Component props
 * @param {Array} props.tasks - Array of task objects
 * @param {boolean} props.isLoading - Loading state
 * @param {Function} props.onView - Callback when view action is clicked
 * @param {Function} props.onEdit - Callback when edit action is clicked
 * @param {Function} props.onDelete - Callback when delete action is clicked
 * @param {Function} props.onRestore - Callback when restore action is clicked
 * @param {Function} props.onCreateTask - Callback when create task button is clicked
 * @param {boolean} props.canCreate - Whether user can create tasks
 * @param {number} props.page - Current page (1-based)
 * @param {number} props.totalPages - Total number of pages
 * @param {Function} props.onPageChange - Callback when page changes
 * @param {number} props.skeletonCount - Number of skeleton cards to show during loading
 */
const TasksList = ({
  tasks = [],
  isLoading = false,
  onView,
  onEdit,
  onDelete,
  onRestore,
  onCreateTask,
  canCreate = true,
  page = 1,
  totalPages = 1,
  onPageChange,
  skeletonCount = 6,
}) => {
  /**
   * Handle page change
   */
  const handlePageChange = useCallback(
    (_event, newPage) => {
      if (onPageChange) {
        onPageChange(newPage);
      }
    },
    [onPageChange]
  );

  /**
   * Memoized skeleton cards for loading state
   */
  const skeletonCards = useMemo(
    () =>
      Array.from({ length: skeletonCount }).map((_, index) => (
        <Grid key={`skeleton-${index}`} size={{ xs: 12, sm: 6, lg: 4 }}>
          <TaskCardSkeleton />
        </Grid>
      )),
    [skeletonCount]
  );

  /**
   * Memoized task cards
   */
  const taskCards = useMemo(
    () =>
      tasks.map((task) => (
        <Grid key={task._id} size={{ xs: 12, sm: 6, lg: 4 }}>
          <TaskCard
            task={task}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            onRestore={onRestore}
          />
        </Grid>
      )),
    [tasks, onView, onEdit, onDelete, onRestore]
  );

  /**
   * Show pagination only when there are multiple pages
   */
  const showPagination = useMemo(
    () => totalPages > 1 && !isLoading && tasks.length > 0,
    [totalPages, isLoading, tasks.length]
  );

  // Loading state
  if (isLoading) {
    return (
      <Grid container spacing={2}>
        {skeletonCards}
      </Grid>
    );
  }

  // Empty state
  if (!tasks || tasks.length === 0) {
    return <EmptyState onCreateTask={onCreateTask} canCreate={canCreate} />;
  }

  // Tasks list with pagination
  return (
    <>
      <Grid container spacing={2}>
        {taskCards}
      </Grid>

      {/* Pagination */}
      {showPagination && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            mt: 3,
            pt: 2,
            borderTop: 1,
            borderColor: "divider",
          }}
        >
          <MuiPagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            shape="rounded"
            variant="outlined"
            showFirstButton
            showLastButton
          />
        </Box>
      )}
    </>
  );
};

export default TasksList;
