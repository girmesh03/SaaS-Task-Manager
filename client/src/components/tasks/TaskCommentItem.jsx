/**
 * TaskCommentItem Component - Individual Comment Display
 *
 * Displays a single comment with:
 * - User avatar and name with role badge
 * - Comment text with highlighted @mentions
 * - Relative timestamp
 * - Edit history indicator
 * - Action buttons (Reply, Edit, Delete)
 * - Nested child comments (recursive)
 * - Like count and reply button
 *
 * Key constraints:
 * - Max depth 3 for nesting
 * - Only own comments can be edited/deleted
 * - Mentions highlighted in blue and clickable
 *
 * Requirements: 9.1, 9.8, 9.9
 */

import { memo, useState, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Stack,
  IconButton,
  Collapse,
  Tooltip,
  Chip,
} from "@mui/material";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbUpOutlinedIcon from "@mui/icons-material/ThumbUpOutlined";
import ReplyIcon from "@mui/icons-material/Reply";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RestoreIcon from "@mui/icons-material/Restore";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { toast } from "react-toastify";
import { MuiAvatar, MuiChip, MuiMenu, MuiDialogConfirm } from "../common";
import TaskCommentForm from "./TaskCommentForm";
import useAuth from "../../hooks/useAuth";
import useTimezone from "../../hooks/useTimezone";
import {
  useDeleteTaskCommentMutation,
  useRestoreTaskCommentMutation,
  useToggleLikeCommentMutation,
} from "../../redux/features/taskCommentApi";
import { handleApiError } from "../../utils/errorHandler";
import { LIMITS, USER_ROLES } from "../../utils/constants";

/**
 * Get role badge color based on user role
 */
const getRoleBadgeColor = (role) => {
  switch (role) {
    case USER_ROLES.SUPER_ADMIN:
      return "error";
    case USER_ROLES.ADMIN:
      return "primary";
    case USER_ROLES.MANAGER:
      return "secondary";
    case USER_ROLES.USER:
    default:
      return "default";
  }
};

/**
 * Get user display name safely
 */
const getUserDisplayName = (user) => {
  if (!user) return "Unknown";
  if (user.fullName) return user.fullName;
  if (user.firstName && user.lastName)
    return `${user.firstName} ${user.lastName}`;
  if (user.firstName) return user.firstName;
  return "Unknown";
};

/**
 * Get profile picture URL safely
 */
const getProfilePictureUrl = (user) => {
  if (!user) return null;
  if (user.profilePicture?.url) return user.profilePicture.url;
  return null;
};

/**
 * Parse comment text and highlight mentions
 */
const parseCommentWithMentions = (text, mentions = []) => {
  if (!text) return null;
  if (!mentions || mentions.length === 0) {
    return <Typography variant="body2">{text}</Typography>;
  }

  // Create a map of mention names for quick lookup
  const mentionNames = mentions.map((m) => getUserDisplayName(m));

  // Split text by @mentions pattern
  const parts = [];
  let lastIndex = 0;
  const mentionRegex = /@([A-Za-z\s]+)/g;
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    // Add text before mention
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        content: text.slice(lastIndex, match.index),
      });
    }

    // Check if this is a valid mention
    const mentionName = match[1].trim();
    const isMention = mentionNames.some(
      (name) =>
        name.toLowerCase().includes(mentionName.toLowerCase()) ||
        mentionName.toLowerCase().includes(name.toLowerCase().split(" ")[0])
    );

    if (isMention) {
      parts.push({
        type: "mention",
        content: match[0],
      });
    } else {
      parts.push({
        type: "text",
        content: match[0],
      });
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      type: "text",
      content: text.slice(lastIndex),
    });
  }

  return (
    <Typography variant="body2" component="span">
      {parts.map((part, index) =>
        part.type === "mention" ? (
          <Typography
            key={index}
            component="span"
            variant="body2"
            sx={{
              color: "primary.main",
              fontWeight: 500,
              cursor: "pointer",
              "&:hover": {
                textDecoration: "underline",
              },
            }}
          >
            {part.content}
          </Typography>
        ) : (
          <span key={index}>{part.content}</span>
        )
      )}
    </Typography>
  );
};

/**
 * TaskCommentItem Component
 *
 * @param {Object} props - Component props
 * @param {Object} props.comment - Comment object
 * @param {number} props.depth - Current nesting depth (0-2)
 * @param {Function} props.onCommentChange - Callback when comments change
 * @param {boolean} props.isDeleted - Whether parent task is deleted
 */
const TaskCommentItem = memo(
  ({ comment, depth = 0, onCommentChange, isDeleted = false }) => {
    const { user } = useAuth();
    const { formatRelative } = useTimezone();

    // Local state
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [menuAnchorEl, setMenuAnchorEl] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    // API mutations
    const [deleteComment, { isLoading: isDeleting }] =
      useDeleteTaskCommentMutation();
    const [restoreComment, { isLoading: isRestoring }] =
      useRestoreTaskCommentMutation();
    const [toggleLike, { isLoading: isLiking }] =
      useToggleLikeCommentMutation();

    // Check if current user has liked this comment
    const isLikedByMe = useMemo(() => {
      if (!user?._id || !comment.likes) return false;
      return comment.likes.some(
        (like) => (like._id || like).toString() === user._id.toString()
      );
    }, [user, comment.likes]);

    // Check if current user owns this comment
    const isOwnComment = useMemo(() => {
      const creatorId = comment.createdBy?._id || comment.createdBy;
      return user?._id === creatorId;
    }, [user, comment]);

    // Check if can reply (depth < max - 1 because reply adds 1 level)
    const canReply = useMemo(() => {
      return (
        depth < LIMITS.MAX_COMMENT_DEPTH - 1 && !comment.isDeleted && !isDeleted
      );
    }, [depth, comment.isDeleted, isDeleted]);

    // Check if can edit/delete
    const canEdit = useMemo(() => {
      return isOwnComment && !comment.isDeleted && !isDeleted;
    }, [isOwnComment, comment.isDeleted, isDeleted]);

    const canDelete = useMemo(() => {
      return isOwnComment && !comment.isDeleted && !isDeleted;
    }, [isOwnComment, comment.isDeleted, isDeleted]);

    const canRestore = useMemo(() => {
      return isOwnComment && comment.isDeleted;
    }, [isOwnComment, comment.isDeleted]);

    /**
     * Handle reply button click
     */
    const handleReplyClick = useCallback(() => {
      setShowReplyForm((prev) => !prev);
    }, []);

    /**
     * Handle reply form cancel
     */
    const handleReplyCancel = useCallback(() => {
      setShowReplyForm(false);
    }, []);

    /**
     * Handle reply success
     */
    const handleReplySuccess = useCallback(() => {
      setShowReplyForm(false);
      onCommentChange?.();
    }, [onCommentChange]);

    /**
     * Handle menu open
     */
    const handleMenuOpen = useCallback((event) => {
      setMenuAnchorEl(event.currentTarget);
    }, []);

    /**
     * Handle menu close
     */
    const handleMenuClose = useCallback(() => {
      setMenuAnchorEl(null);
    }, []);

    /**
     * Handle edit click
     */
    const handleEditClick = useCallback(() => {
      // TODO: Implement edit functionality
      toast.info("Edit functionality coming soon");
      handleMenuClose();
    }, [handleMenuClose]);

    /**
     * Handle delete click
     */
    const handleDeleteClick = useCallback(() => {
      setDeleteDialogOpen(true);
      handleMenuClose();
    }, [handleMenuClose]);

    /**
     * Handle delete confirm
     */
    const handleDeleteConfirm = useCallback(async () => {
      try {
        await deleteComment(comment._id).unwrap();
        toast.success("Comment deleted successfully");
        setDeleteDialogOpen(false);
        onCommentChange?.();
      } catch (error) {
        const { message } = handleApiError(error);
        toast.error(message);
      }
    }, [comment._id, deleteComment, onCommentChange]);

    /**
     * Handle delete cancel
     */
    const handleDeleteCancel = useCallback(() => {
      setDeleteDialogOpen(false);
    }, []);

    /**
     * Handle restore click
     */
    const handleRestoreClick = useCallback(async () => {
      try {
        await restoreComment(comment._id).unwrap();
        toast.success("Comment restored successfully");
        handleMenuClose();
        onCommentChange?.();
      } catch (error) {
        const { message } = handleApiError(error);
        toast.error(message);
      }
    }, [comment._id, restoreComment, handleMenuClose, onCommentChange]);

    /**
     * Handle like click
     */
    const handleLikeClick = useCallback(async () => {
      // Cannot like deleted comments or if parent is deleted
      if (comment.isDeleted || isDeleted) {
        toast.warning("Cannot like a deleted comment");
        return;
      }

      try {
        await toggleLike(comment._id).unwrap();
        onCommentChange?.();
      } catch (error) {
        const { message } = handleApiError(error);
        toast.error(message);
      }
    }, [
      comment._id,
      comment.isDeleted,
      isDeleted,
      toggleLike,
      onCommentChange,
    ]);

    /**
     * Build menu items
     */
    const menuItems = useMemo(() => {
      const items = [];

      if (canEdit) {
        items.push({
          id: "edit",
          label: "Edit",
          icon: <EditIcon fontSize="small" />,
          onClick: handleEditClick,
        });
      }

      if (canDelete) {
        items.push({
          id: "delete",
          label: "Delete",
          icon: <DeleteIcon fontSize="small" />,
          onClick: handleDeleteClick,
        });
      }

      if (canRestore) {
        items.push({
          id: "restore",
          label: "Restore",
          icon: <RestoreIcon fontSize="small" />,
          onClick: handleRestoreClick,
        });
      }

      return items;
    }, [
      canEdit,
      canDelete,
      canRestore,
      handleEditClick,
      handleDeleteClick,
      handleRestoreClick,
    ]);

    // Calculate indentation based on depth
    const indentPx = depth * 24;

    return (
      <Box
        sx={{
          ml: `${indentPx}px`,
          opacity: comment.isDeleted ? 0.6 : 1,
        }}
      >
        {/* Comment content */}
        <Stack direction="row" spacing={1.5} sx={{ py: 1.5 }}>
          {/* Avatar */}
          <MuiAvatar
            src={getProfilePictureUrl(comment.createdBy)}
            name={getUserDisplayName(comment.createdBy)}
            size={depth === 0 ? 40 : 32}
          />

          {/* Content */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Header: Name, Role Badge, Time */}
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              flexWrap="wrap"
              sx={{ mb: 0.5 }}
            >
              <Typography variant="subtitle2" fontWeight={600}>
                {getUserDisplayName(comment.createdBy)}
              </Typography>

              {/* Role badge */}
              {comment.createdBy?.role && (
                <MuiChip
                  label={comment.createdBy.role}
                  size="small"
                  color={getRoleBadgeColor(comment.createdBy.role)}
                  sx={{
                    height: 20,
                    fontSize: "0.65rem",
                    textTransform: "uppercase",
                  }}
                />
              )}

              {/* Timestamp */}
              <Typography variant="caption" color="text.secondary">
                {formatRelative(comment.createdAt)}
              </Typography>

              {/* Edited badge */}
              {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
                <Chip
                  label="Edited"
                  size="small"
                  variant="outlined"
                  sx={{ height: 18, fontSize: "0.6rem" }}
                />
              )}

              {/* Deleted badge */}
              {comment.isDeleted && (
                <MuiChip
                  label="Deleted"
                  size="small"
                  color="error"
                  sx={{ height: 20, fontSize: "0.65rem" }}
                />
              )}
            </Stack>

            {/* Comment text with mentions */}
            <Box sx={{ mb: 1 }}>
              {parseCommentWithMentions(comment.comment, comment.mentions)}
            </Box>

            {/* Attachments placeholder */}
            {comment.attachments?.length > 0 && (
              <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                {comment.attachments.slice(0, 4).map((attachment, idx) => (
                  <Box
                    key={attachment._id || idx}
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: 1,
                      bgcolor: "action.hover",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    }}
                  >
                    {attachment.url ? (
                      <Box
                        component="img"
                        src={attachment.url}
                        alt={attachment.name}
                        sx={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        File
                      </Typography>
                    )}
                  </Box>
                ))}
                {comment.attachments.length > 4 && (
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: 1,
                      bgcolor: "action.hover",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      +{comment.attachments.length - 4}
                    </Typography>
                  </Box>
                )}
              </Stack>
            )}

            {/* Actions: Like, Reply */}
            <Stack direction="row" spacing={0.5} alignItems="center">
              {/* Like button */}
              {!comment.isDeleted && !isDeleted && (
                <Tooltip title={isLikedByMe ? "Unlike" : "Like"}>
                  <IconButton
                    size="small"
                    onClick={handleLikeClick}
                    color={isLikedByMe ? "primary" : "default"}
                    disabled={isLiking}
                  >
                    {isLikedByMe ? (
                      <ThumbUpIcon fontSize="small" />
                    ) : (
                      <ThumbUpOutlinedIcon fontSize="small" />
                    )}
                  </IconButton>
                </Tooltip>
              )}

              {/* Like count */}
              {(comment.likeCount > 0 || comment.likes?.length > 0) && (
                <Typography variant="caption" color="text.secondary">
                  {comment.likeCount || comment.likes?.length || 0}
                </Typography>
              )}

              {/* Reply button */}
              {canReply && (
                <Tooltip title="Reply">
                  <IconButton
                    size="small"
                    onClick={handleReplyClick}
                    color={showReplyForm ? "primary" : "default"}
                  >
                    <ReplyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ cursor: canReply ? "pointer" : "default" }}
                onClick={canReply ? handleReplyClick : undefined}
              >
                Reply
              </Typography>

              {/* More menu */}
              {menuItems.length > 0 && (
                <IconButton
                  size="small"
                  onClick={handleMenuOpen}
                  disabled={isDeleting || isRestoring}
                  sx={{ ml: "auto" }}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              )}
            </Stack>

            {/* Reply form */}
            <Collapse in={showReplyForm}>
              <Box sx={{ mt: 1.5 }}>
                <TaskCommentForm
                  parentId={comment._id}
                  parentModel="TaskComment"
                  depth={depth + 1}
                  isReply
                  replyToUser={getUserDisplayName(comment.createdBy)}
                  onSuccess={handleReplySuccess}
                  onCancel={handleReplyCancel}
                  autoFocus
                />
              </Box>
            </Collapse>
          </Box>
        </Stack>

        {/* Child comments (recursive) */}
        {comment.children?.length > 0 && (
          <Box
            sx={{
              borderLeft: "2px solid",
              borderColor: "divider",
              ml: 2.5,
              pl: 1,
            }}
          >
            {comment.children.map((childComment) => (
              <TaskCommentItem
                key={childComment._id}
                comment={childComment}
                depth={depth + 1}
                onCommentChange={onCommentChange}
                isDeleted={isDeleted}
              />
            ))}
          </Box>
        )}

        {/* Action Menu */}
        <MuiMenu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={handleMenuClose}
          items={menuItems}
        />

        {/* Delete Confirmation Dialog */}
        <MuiDialogConfirm
          open={deleteDialogOpen}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title="Delete Comment"
          message="Are you sure you want to delete this comment? This action can be undone by restoring the comment."
          confirmText="Delete"
          confirmColor="error"
          isLoading={isDeleting}
        />
      </Box>
    );
  }
);

TaskCommentItem.displayName = "TaskCommentItem";

export default TaskCommentItem;
