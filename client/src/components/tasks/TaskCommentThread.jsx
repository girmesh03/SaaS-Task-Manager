/**
 * TaskCommentThread Component - Comment Thread Display
 *
 * Displays a complete comment thread with:
 * - Comment form at top for adding new comments
 * - Nested comments display (max depth 3)
 * - Empty state when no comments
 * - Real-time updates via Socket.IO
 * - Support for Task and TaskActivity parents
 *
 * Key features:
 * - Builds tree structure from flat comment list
 * - Recursive rendering with TaskCommentItem
 * - Loading and error states
 * - Comment count display
 *
 * Requirements: 9.1, 9.10
 */

import { useMemo, useCallback, useEffect } from "react";
import { Box, Typography, Stack, Paper, Divider, Alert } from "@mui/material";
import CommentIcon from "@mui/icons-material/Comment";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import { MuiLoading } from "../common";
import TaskCommentForm from "./TaskCommentForm";
import TaskCommentItem from "./TaskCommentItem";
import { useGetTaskCommentsQuery } from "../../redux/features/taskCommentApi";
import { handleApiError } from "../../utils/errorHandler";
import { toast } from "react-toastify";

/**
 * Build comment tree from flat list
 *
 * Converts flat array of comments into nested tree structure
 * based on parent-child relationships.
 *
 * @param {Array} comments - Flat array of comments
 * @param {string} parentId - Parent ID to filter root comments
 * @param {string} parentModel - Parent model type ("BaseTask" or "TaskActivity")
 * @returns {Array} Nested comment tree
 */
const buildCommentTree = (comments, parentId, parentModel) => {
  if (!comments || comments.length === 0) return [];

  // Create a map for quick lookup
  const commentMap = new Map();
  comments.forEach((comment) => {
    commentMap.set(comment._id, { ...comment, children: [] });
  });

  // Build tree structure
  const rootComments = [];

  comments.forEach((comment) => {
    const commentWithChildren = commentMap.get(comment._id);

    // Check if this is a root comment (direct child of task/activity)
    if (
      comment.parent === parentId ||
      comment.parent?._id === parentId ||
      (comment.parentModel === parentModel &&
        (comment.parent === parentId || comment.parent?._id === parentId))
    ) {
      rootComments.push(commentWithChildren);
    } else if (comment.parentModel === "TaskComment") {
      // This is a reply to another comment
      const parentComment = commentMap.get(
        comment.parent?._id || comment.parent
      );
      if (parentComment) {
        parentComment.children.push(commentWithChildren);
      }
    }
  });

  // Sort root comments by createdAt (oldest fironversation flow)
  rootComments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  // Sort children recursively
  const sortChildren = (comments) => {
    comments.forEach((comment) => {
      if (comment.children?.length > 0) {
        comment.children.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
        sortChildren(comment.children);
      }
    });
  };
  sortChildren(rootComments);

  return rootComments;
};

/**
 * TaskCommentThread Component
 *
 * @param {Object} props - Component props
 * @param {string} props.parentId - Parent ID (Task or TaskActivity)
 * @param {string} props.parentModel - Parent model type ("BaseTask" or "TaskActivity")
 * @param {boolean} props.isDeleted - Whether parent is deleted
 * @param {string} props.title - Optional title override
 * @param {boolean} props.showForm - Whether to show the comment form (default: true)
 */
const TaskCommentThread = ({
  parentId,
  parentModel = "BaseTask",
  isDeleted = false,
  title = "Comments",
  showForm = true,
}) => {
  // RTK Query - Fetch comments
  const {
    data: commentsResponse,
    isLoading,
    isFetching,
    error: commentsError,
  } = useGetTaskCommentsQuery(
    {
      // Use taskId to get all comments including nested replies
      taskId: parentModel === "BaseTask" ? parentId : undefined,
      // For TaskActivity, use parentId (activity comments don't have nested structure)
      task: parentModel === "TaskActivity" ? undefined : undefined,
      activity: parentModel === "TaskActivity" ? parentId : undefined,
      deleted: isDeleted ? "true" : "false",
      limit: 100, // Get all comments for the thread
    },
    { skip: !parentId }
  );

  // Extract comments from response
  const comments = useMemo(
    () => commentsResponse?.data || [],
    [commentsResponse]
  );

  // Build comment tree
  const commentTree = useMemo(
    () => buildCommentTree(comments, parentId, parentModel),
    [comments, parentId, parentModel]
  );

  // Total comment count (including nested)
  const totalComments = useMemo(() => comments.length, [comments]);

  // Handle API errors
  useEffect(() => {
    if (commentsError) {
      const { message } = handleApiError(commentsError);
      toast.error(message);
    }
  }, [commentsError]);

  /**
   * Handle comment change (create, update, delete)
   * RTK Query will automatically refetch due to cache invalidation
   */
  const handleCommentChange = useCallback(() => {
    // Cache invalidation handles refetch automatically
    // This callback can be used for additional logic if needed
  }, []);

  /**
   * Handle form success
   */
  const handleFormSuccess = useCallback(() => {
    // Scroll to bottom to show new comment (optional)
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <MuiLoading message="Loading comments..." size={24} />
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: { xs: 1, sm: 3 } }}>
      {/* Header */}
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <CommentIcon color="action" />
          <Typography variant="h6">{title}</Typography>
          {totalComments > 0 && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                bgcolor: "action.hover",
                px: 1,
                py: 0.25,
                borderRadius: 1,
              }}
            >
              {totalComments}
            </Typography>
          )}
        </Stack>

        {isFetching && !isLoading && (
          <Typography variant="caption" color="text.secondary">
            Updating...
          </Typography>
        )}
      </Stack>

      <Divider sx={{ mb: 2 }} />

      {/* Comment Form */}
      {showForm && !isDeleted && (
        <Box sx={{ mb: 3 }}>
          <TaskCommentForm
            parentId={parentId}
            parentModel={parentModel}
            depth={0}
            onSuccess={handleFormSuccess}
            placeholder={`Add a comment...`}
          />
        </Box>
      )}

      {/* Deleted notice */}
      {isDeleted && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          This {parentModel === "BaseTask" ? "task" : "activity"} is deleted.
          Comments are read-only.
        </Alert>
      )}

      {/* Comments List */}
      {commentTree.length === 0 ? (
        /* Empty State */
        <Box
          sx={{
            py: 6,
            textAlign: "center",
          }}
        >
          <ChatBubbleOutlineIcon
            sx={{ fontSize: 48, color: "text.disabled", mb: 2 }}
          />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No comments yet
          </Typography>
          <Typography variant="body2" color="text.disabled">
            Be the first to comment
          </Typography>
        </Box>
      ) : (
        /* Comment Thread */
        <Stack spacing={0} divider={<Divider />}>
          {commentTree.map((comment) => (
            <TaskCommentItem
              key={comment._id}
              comment={comment}
              depth={0}
              onCommentChange={handleCommentChange}
              isDeleted={isDeleted}
            />
          ))}
        </Stack>
      )}
    </Paper>
  );
};

export default TaskCommentThread;
