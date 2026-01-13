/**
 * TaskCommentForm Component - Task Comment Create/Reply Form
 *
 * Form component for creating comments on tasks, activities, or replying to comments.
 * Supports @mentions with autocomplete and file attachments.
 *
 * Key constraints:
 * - Comment max 2000 characters
 * - Max 5 mentions
 * - Max 10 attachments
 * - Max depth 3 for replies (comment → reply → reply to reply)
 *
 * Requirements: 9.2, 9.3, 9.4, 9.5
 */

import { useState, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  IconButton,
  InputBase,
  Paper,
  Stack,
  CircularProgress,
  Alert,
  Popover,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Chip,
  Tooltip,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import AlternateEmailIcon from "@mui/icons-material/AlternateEmail";
import AddIcon from "@mui/icons-material/Add";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import LinkIcon from "@mui/icons-material/Link";
import ImageIcon from "@mui/icons-material/Image";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import CloseIcon from "@mui/icons-material/Close";
import ReplyIcon from "@mui/icons-material/Reply";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { MuiAvatar } from "../common";
import useAuth from "../../hooks/useAuth";
import { useGetUsersQuery } from "../../redux/features/userApi";
import { useCreateTaskCommentMutation } from "../../redux/features/taskCommentApi";
import { handleApiError } from "../../utils/errorHandler";
import { LIMITS } from "../../utils/constants";

/**
 * Default form values
 */
const DEFAULT_VALUES = {
  comment: "",
  mentionIds: [],
};

/**
 * TaskCommentForm Component
 *
 * @param {Object} props - Component props
 * @param {string} props.parentId - Parent ID (Task, TaskActivity, or TaskComment)
 * @param {string} props.parentModel - Parent model type ("BaseTask", "TaskActivity", "TaskComment")
 * @param {number} props.depth - Current comment depth (0 for root, 1 for reply, 2 for reply to reply)
 * @param {boolean} props.isReply - Whether this is a reply form
 * @param {Function} props.onSuccess - Callback on successful comment creation
 * @param {Function} props.onCancel - Callback when reply form is cancelled
 * @param {string} props.replyToUser - Username being replied to (for display)
 * @param {boolean} props.autoFocus - Whether to auto-focus the comment field
 * @param {string} props.placeholder - Custom placeholder text
 */
const TaskCommentForm = ({
  parentId,
  parentModel = "BaseTask",
  depth = 0,
  isReply = false,
  onSuccess,
  onCancel,
  replyToUser,
  autoFocus = false,
  placeholder,
}) => {
  const { user } = useAuth();
  const [mentionAnchorEl, setMentionAnchorEl] = useState(null);
  const [selectedMentions, setSelectedMentions] = useState([]);

  // API mutations
  const [createComment, { isLoading: isCreating }] =
    useCreateTaskCommentMutation();

  // Get department ID from user
  const departmentId = useMemo(() => {
    return user?.department?._id || user?.department;
  }, [user]);

  // Fetch users from same department for mentions
  const { data: usersData } = useGetUsersQuery(
    {
      limit: 100,
      deleted: false,
      departmentId: departmentId,
    },
    { skip: !departmentId }
  );

  // Memoize user options for mentions
  const userOptions = useMemo(() => {
    if (!usersData?.data) return [];
    return usersData.data
      .filter((u) => u._id !== user?._id) // Exclude current user
      .map((u) => ({
        id: u._id,
        name: u.fullName || `${u.firstName} ${u.lastName}`,
        avatar: u.profilePicture?.url,
        role: u.role,
      }));
  }, [usersData, user]);

  // React Hook Form setup
  const { register, handleSubmit, reset, setValue, getValues } = useForm({
    defaultValues: DEFAULT_VALUES,
    mode: "onBlur",
  });

  /**
   * Handle form submission
   */
  const onSubmit = useCallback(
    async (data) => {
      try {
        // Validate depth
        if (depth >= LIMITS.MAX_COMMENT_DEPTH) {
          toast.error("Maximum comment depth reached. Cannot reply further.");
          return;
        }

        const commentText = data.comment?.trim();
        if (!commentText) {
          toast.error("Comment cannot be empty");
          return;
        }

        if (commentText.length > LIMITS.COMMENT_MAX) {
          toast.error(`Comment cannot exceed ${LIMITS.COMMENT_MAX} characters`);
          return;
        }

        // Prepare payload
        const payload = {
          comment: commentText,
          parentId: parentId,
          parentModel: parentModel,
          mentionIds: selectedMentions.map((m) => m.id),
        };

        await createComment(payload).unwrap();
        toast.success(
          isReply ? "Reply posted successfully" : "Comment posted successfully"
        );

        // Reset form
        reset(DEFAULT_VALUES);
        setSelectedMentions([]);

        // Call success callback
        onSuccess?.();
      } catch (error) {
        const { message, fieldErrors } = handleApiError(error);
        toast.error(message);

        if (Object.keys(fieldErrors).length > 0) {
          console.error("Field errors:", fieldErrors);
        }
      }
    },
    [
      parentId,
      parentModel,
      depth,
      isReply,
      createComment,
      reset,
      onSuccess,
      selectedMentions,
    ]
  );

  /**
   * Handle cancel for reply form
   */
  const handleCancel = useCallback(() => {
    reset(DEFAULT_VALUES);
    setSelectedMentions([]);
    onCancel?.();
  }, [reset, onCancel]);

  /**
   * Get placeholder text
   */
  const placeholderText = useMemo(() => {
    if (placeholder) return placeholder;
    if (isReply && replyToUser) return `Reply to ${replyToUser}...`;
    if (isReply) return "Write a reply...";
    return "Type a message...";
  }, [placeholder, isReply, replyToUser]);

  /**
   * Handle mention button click
   */
  const handleMentionClick = useCallback((event) => {
    setMentionAnchorEl(event.currentTarget);
  }, []);

  /**
   * Handle mention popover close
   */
  const handleMentionClose = useCallback(() => {
    setMentionAnchorEl(null);
  }, []);

  /**
   * Handle user selection for mention
   */
  const handleSelectMention = useCallback(
    (userOption) => {
      if (selectedMentions.length >= LIMITS.MAX_MENTIONS) {
        toast.warning(`Cannot mention more than ${LIMITS.MAX_MENTIONS} users`);
        return;
      }

      // Check if already selected
      if (selectedMentions.some((m) => m.id === userOption.id)) {
        return;
      }

      setSelectedMentions((prev) => [...prev, userOption]);

      // Add @mention to comment text
      const currentComment = getValues("comment") || "";
      const mentionText = `@${userOption.name} `;
      setValue("comment", currentComment + mentionText);

      handleMentionClose();
    },
    [selectedMentions, getValues, setValue, handleMentionClose]
  );

  /**
   * Handle removing a mention
   */
  const handleRemoveMention = useCallback(
    (mentionId) => {
      const mention = selectedMentions.find((m) => m.id === mentionId);
      if (mention) {
        // Remove from selected mentions
        setSelectedMentions((prev) => prev.filter((m) => m.id !== mentionId));

        // Remove @mention from comment text
        const currentComment = getValues("comment") || "";
        const mentionText = `@${mention.name} `;
        setValue("comment", currentComment.replace(mentionText, ""));
      }
    },
    [selectedMentions, getValues, setValue]
  );

  // Filter out already selected users
  const availableUsers = useMemo(() => {
    return userOptions.filter(
      (u) => !selectedMentions.some((m) => m.id === u.id)
    );
  }, [userOptions, selectedMentions]);

  const mentionOpen = Boolean(mentionAnchorEl);

  // If max depth reached, show error
  if (depth >= LIMITS.MAX_COMMENT_DEPTH) {
    return (
      <Alert severity="error" sx={{ my: 1 }}>
        Maximum comment depth reached. Cannot reply to this comment.
      </Alert>
    );
  }

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      sx={{
        bgcolor: isReply ? "action.hover" : "background.paper",
        borderRadius: isReply ? 1 : 0,
        border: isReply ? "1px solid" : "none",
        borderColor: "divider",
        p: isReply ? 1.5 : 0,
      }}
    >
      {/* Reply indicator */}
      {isReply && replyToUser && (
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ mb: 1, px: 1 }}
        >
          <ReplyIcon fontSize="small" color="action" />
          <Typography variant="caption" color="text.secondary">
            Replying to <strong>@{replyToUser}</strong>
          </Typography>
          {onCancel && (
            <IconButton size="small" onClick={handleCancel}>
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Stack>
      )}

      {/* Selected mentions chips */}
      {selectedMentions.length > 0 && (
        <Stack
          direction="row"
          spacing={0.5}
          flexWrap="wrap"
          sx={{ mb: 1, px: 1 }}
        >
          {selectedMentions.map((mention) => (
            <Chip
              key={mention.id}
              label={`@${mention.name}`}
              size="small"
              onDelete={() => handleRemoveMention(mention.id)}
              sx={{ mb: 0.5 }}
            />
          ))}
        </Stack>
      )}

      {/* Main input area */}
      <Paper
        elevation={0}
        sx={{
          display: "flex",
          alignItems: "center",
          p: 1,
          gap: 1,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 3,
        }}
      >
        {/* Add button */}
        <IconButton size="small" color="primary">
          <AddIcon />
        </IconButton>

        {/* Text input */}
        <InputBase
          {...register("comment")}
          placeholder={placeholderText}
          autoFocus={autoFocus || isReply}
          multiline
          maxRows={4}
          sx={{
            flex: 1,
            fontSize: "0.875rem",
            "& .MuiInputBase-input": {
              p: 0,
            },
          }}
        />

        {/* Mention button */}
        <Tooltip title="Mention user">
          <IconButton size="small" onClick={handleMentionClick} color="action">
            <AlternateEmailIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        {/* Send button */}
        <IconButton
          type="submit"
          disabled={isCreating}
          sx={{
            bgcolor: "primary.main",
            color: "white",
            "&:hover": {
              bgcolor: "primary.dark",
            },
            "&.Mui-disabled": {
              bgcolor: "grey.300",
              color: "grey.500",
            },
            width: 36,
            height: 36,
          }}
        >
          {isCreating ? (
            <CircularProgress size={18} color="inherit" />
          ) : (
            <SendIcon fontSize="small" />
          )}
        </IconButton>
      </Paper>

      {/* Formatting toolbar */}
      <Stack
        direction="row"
        spacing={0.5}
        sx={{ mt: 1, px: 1 }}
        alignItems="center"
      >
        <Tooltip title="Bold">
          <IconButton size="small" color="action">
            <FormatBoldIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Italic">
          <IconButton size="small" color="action">
            <FormatItalicIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="List">
          <IconButton size="small" color="action">
            <FormatListBulletedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Link">
          <IconButton size="small" color="action">
            <LinkIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Image">
          <IconButton size="small" color="action">
            <ImageIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Emoji">
          <IconButton size="small" color="action">
            <EmojiEmotionsIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        {/* Cancel button for replies */}
        {isReply && onCancel && (
          <Box sx={{ ml: "auto" }}>
            <IconButton size="small" onClick={handleCancel} color="error">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
      </Stack>

      {/* Mention Popover */}
      <Popover
        open={mentionOpen}
        anchorEl={mentionAnchorEl}
        onClose={handleMentionClose}
        anchorOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
      >
        <Box sx={{ width: 280, maxHeight: 300, overflow: "auto" }}>
          <Typography
            variant="subtitle2"
            sx={{ p: 1.5, borderBottom: 1, borderColor: "divider" }}
          >
            Mention a user
          </Typography>
          {availableUsers.length === 0 ? (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ p: 2, textAlign: "center" }}
            >
              No users available
            </Typography>
          ) : (
            <List dense disablePadding>
              {availableUsers.map((userOption) => (
                <ListItemButton
                  key={userOption.id}
                  onClick={() => handleSelectMention(userOption)}
                >
                  <ListItemAvatar sx={{ minWidth: 40 }}>
                    <MuiAvatar
                      src={userOption.avatar}
                      name={userOption.name}
                      size={32}
                    />
                  </ListItemAvatar>
                  <ListItemText
                    primary={userOption.name}
                    secondary={userOption.role}
                    primaryTypographyProps={{ variant: "body2" }}
                    secondaryTypographyProps={{ variant: "caption" }}
                  />
                </ListItemButton>
              ))}
            </List>
          )}
        </Box>
      </Popover>
    </Box>
  );
};

export default TaskCommentForm;
