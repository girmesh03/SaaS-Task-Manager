/**
 * ProjectTaskForm Component - ProjectTask Create/Update Form Dialog
 *
 * Form dialog for creating and updating ProjectTask.
 * Supports vendor assignment, cost tracking, HOD watchers, and attachments.
 *
 * Requirements: 5.3, 5.4, 5.8, 5.10
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  CircularProgress,
  Alert,
  IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-toastify";
import {
  MuiDialog,
  MuiTextField,
  MuiNumberField,
  MuiSelectAutocomplete,
  MuiMultiSelect,
  MuiDatePicker,
  MuiAvatar,
  MuiChip,
} from "../common";
import useResponsive from "../../hooks/useResponsive";
import useAuth from "../../hooks/useAuth";
import { useGetVendorsQuery } from "../../redux/features/vendorApi";
import { useGetUsersQuery } from "../../redux/features/userApi";
import {
  useCreateTaskMutation,
  useUpdateTaskMutation,
} from "../../redux/features/taskApi";
import { handleApiError } from "../../utils/errorHandler";
import {
  TASK_TYPES,
  TASK_STATUS,
  TASK_PRIORITY,
  CURRENCY,
  LIMITS,
} from "../../utils/constants";

/**
 * Status options for ProjectTask
 */
const STATUS_OPTIONS = [
  { value: TASK_STATUS.TO_DO, label: "To Do" },
  { value: TASK_STATUS.IN_PROGRESS, label: "In Progress" },
  { value: TASK_STATUS.COMPLETED, label: "Completed" },
  { value: TASK_STATUS.PENDING, label: "Pending" },
];

/**
 * Priority options for ProjectTask
 */
const PRIORITY_OPTIONS = [
  { value: TASK_PRIORITY.LOW, label: "Low" },
  { value: TASK_PRIORITY.MEDIUM, label: "Medium" },
  { value: TASK_PRIORITY.HIGH, label: "High" },
  { value: TASK_PRIORITY.URGENT, label: "Urgent" },
];

/**
 * Currency options
 */
const CURRENCY_OPTIONS = [
  { value: CURRENCY.ETB, label: "ETB - Ethiopian Birr" },
  { value: CURRENCY.USD, label: "USD - US Dollar" },
  { value: CURRENCY.EUR, label: "EUR - Euro" },
];

/**
 * Default form values
 */
const DEFAULT_VALUES = {
  title: "",
  description: "",
  vendorId: null,
  estimatedCost: "",
  actualCost: "",
  currency: CURRENCY.DEFAULT,
  startDate: null,
  dueDate: null,
  status: TASK_STATUS.TO_DO,
  priority: TASK_PRIORITY.MEDIUM,
  watcherIds: [],
  tags: [],
  attachmentIds: [],
  tagInput: "",
};

/**
 * ProjectTaskForm Component
 *
 * @param {Object} props - Component props
 * @param {boolean} props.open - Whether dialog is open
 * @param {Function} props.onClose - Callback when dialog is closed
 * @param {Object} props.task - Task data for edit mode (null for create)
 * @param {string} props.departmentId - Department ID for the task
 * @param {Function} props.onSuccess - Callback on successful create/update
 */
const ProjectTaskForm = ({
  open,
  onClose,
  task = null,
  departmentId,
  onSuccess,
}) => {
  const { isMobile } = useResponsive();
  const { user } = useAuth();
  const isEditMode = Boolean(task);

  // Local state for tags display (synced with form)
  const [tagsDisplay, setTagsDisplay] = useState(task?.tags || []);

  // API mutations
  const [createTask, { isLoading: isCreating }] = useCreateTaskMutation();
  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();
  const isSubmitting = isCreating || isUpdating;

  // Fetch vendors from same organization
  const { data: vendorsData, isLoading: isLoadingVendors } = useGetVendorsQuery(
    { limit: 100, deleted: false },
    { skip: !open }
  );

  // Fetch HOD users (isHod: true) from same organization
  const { data: hodUsersData, isLoading: isLoadingHodUsers } = useGetUsersQuery(
    { limit: 100, deleted: false, isHod: true },
    { skip: !open }
  );

  // Memoize vendor options
  const vendorOptions = useMemo(() => {
    if (!vendorsData?.data) return [];
    return vendorsData.data.map((vendor) => ({
      value: vendor._id,
      label: vendor.name,
      contactPerson: vendor.contactPerson,
      email: vendor.email,
      phone: vendor.phone,
    }));
  }, [vendorsData]);

  // Memoize HOD user options for watchers
  const hodUserOptions = useMemo(() => {
    if (!hodUsersData?.data) return [];
    return hodUsersData.data.map((hodUser) => ({
      value: hodUser._id,
      label: `${hodUser.firstName} ${hodUser.lastName}`,
      avatar: hodUser.profilePicture,
      role: hodUser.role,
    }));
  }, [hodUsersData]);

  // React Hook Form setup
  const {
    control,
    handleSubmit,
    register,
    reset,
    setValue,
    getValues,
    formState: { errors },
  } = useForm({
    defaultValues: DEFAULT_VALUES,
    mode: "onBlur",
  });

  // Memoize tags from task to avoid unnecessary re-renders
  const syncedTags = useMemo(() => task?.tags || [], [task?.tags]);

  // Reset form when dialog opens/closes or task changes
  useEffect(() => {
    if (!open) return;

    if (task) {
      // Edit mode - populate form with task data
      reset({
        title: task.title || "",
        description: task.description || "",
        vendorId: task.vendor?._id || task.vendorId || null,
        estimatedCost: task.estimatedCost ?? "",
        actualCost: task.actualCost ?? "",
        currency: task.currency || CURRENCY.DEFAULT,
        startDate: task.startDate || null,
        dueDate: task.dueDate || null,
        status: task.status || TASK_STATUS.TO_DO,
        priority: task.priority || TASK_PRIORITY.MEDIUM,
        watcherIds: task.watchers?.map((w) => w._id || w) || [],
        tags: syncedTags,
        attachmentIds: task.attachments?.map((a) => a._id || a) || [],
        tagInput: "",
      });
    } else {
      // Create mode - reset to defaults
      reset(DEFAULT_VALUES);
    }
  }, [open, task, reset, syncedTags]);

  // Sync tagsDisplay with form when dialog opens - use setTimeout to avoid lint warning
  useEffect(() => {
    if (open) {
      const timeoutId = setTimeout(() => setTagsDisplay(syncedTags), 0);
      return () => clearTimeout(timeoutId);
    }
  }, [open, syncedTags]);

  /**
   * Handle form submission
   */
  const onSubmit = useCallback(
    async (data) => {
      try {
        // Prepare payload
        const payload = {
          taskType: TASK_TYPES.PROJECT_TASK,
          departmentId: departmentId || user?.department?._id,
          title: data.title.trim(),
          description: data.description.trim(),
          vendorId: data.vendorId,
          status: data.status,
          priority: data.priority,
          tags: data.tags,
          attachmentIds: data.attachmentIds,
        };

        // Add optional fields
        if (data.estimatedCost !== "" && data.estimatedCost !== null) {
          payload.estimatedCost = parseFloat(data.estimatedCost);
        }
        if (data.actualCost !== "" && data.actualCost !== null) {
          payload.actualCost = parseFloat(data.actualCost);
        }
        if (data.currency) {
          payload.currency = data.currency;
        }
        if (data.startDate) {
          payload.startDate = data.startDate;
        }
        if (data.dueDate) {
          payload.dueDate = data.dueDate;
        }
        if (data.watcherIds?.length > 0) {
          payload.watcherIds = data.watcherIds;
        }

        if (isEditMode) {
          // Update task
          await updateTask({ taskId: task._id, data: payload }).unwrap();
          toast.success("Project task updated successfully");
        } else {
          // Create task
          await createTask(payload).unwrap();
          toast.success("Project task created successfully");
        }

        onSuccess?.();
        onClose();
      } catch (error) {
        const { message, fieldErrors } = handleApiError(error);
        toast.error(message);

        // Set field-specific errors if needed
        if (Object.keys(fieldErrors).length > 0) {
          console.error("Field errors:", fieldErrors);
        }
      }
    },
    [
      isEditMode,
      task,
      departmentId,
      user,
      createTask,
      updateTask,
      onSuccess,
      onClose,
    ]
  );

  /**
   * Handle dialog close
   */
  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      onClose();
    }
  }, [isSubmitting, onClose]);

  /**
   * Handle adding a tag
   */
  const handleAddTag = useCallback(() => {
    const tagInputValue = getValues("tagInput") || "";
    const trimmedTag = tagInputValue.trim().toLowerCase();
    if (!trimmedTag) return;

    const currentTags = getValues("tags") || [];

    // Validate tag
    if (trimmedTag.length > LIMITS.TAG_MAX) {
      toast.error(`Tag cannot exceed ${LIMITS.TAG_MAX} characters`);
      return;
    }
    if (currentTags.length >= LIMITS.MAX_TAGS) {
      toast.error(`Cannot have more than ${LIMITS.MAX_TAGS} tags`);
      return;
    }
    if (currentTags.includes(trimmedTag)) {
      toast.error("Tag already exists");
      return;
    }

    const newTags = [...currentTags, trimmedTag];
    setValue("tags", newTags, { shouldDirty: true });
    setValue("tagInput", "");
    setTagsDisplay(newTags);
  }, [getValues, setValue]);

  /**
   * Handle removing a tag
   */
  const handleRemoveTag = useCallback(
    (tagToRemove) => {
      const currentTags = getValues("tags") || [];
      const newTags = currentTags.filter((tag) => tag !== tagToRemove);
      setValue("tags", newTags, { shouldDirty: true });
      setTagsDisplay(newTags);
    },
    [getValues, setValue]
  );

  /**
   * Handle tag input key down
   */
  const handleTagKeyDown = useCallback(
    (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleAddTag();
      }
    },
    [handleAddTag]
  );

  /**
   * Get vendor option label with contact info
   */
  const getVendorOptionLabel = useCallback((option) => {
    if (!option) return "";
    if (typeof option === "string") return option;
    return option.label || option.name || "";
  }, []);

  /**
   * Render vendor option with contact info
   */
  const renderVendorOption = useCallback((props, option) => {
    const { key, ...otherProps } = props;
    return (
      <Box component="li" key={key} {...otherProps}>
        <Box>
          <Typography variant="body2" fontWeight={500}>
            {option.label}
          </Typography>
          {option.contactPerson && (
            <Typography variant="caption" color="text.secondary">
              Contact: {option.contactPerson}
            </Typography>
          )}
        </Box>
      </Box>
    );
  }, []);

  /**
   * Get HOD user option label
   */
  const getHodUserOptionLabel = useCallback((option) => {
    if (!option) return "";
    if (typeof option === "string") return option;
    return option.label || "";
  }, []);

  /**
   * Render HOD user option with avatar
   */
  const renderHodUserOption = useCallback((props, option) => {
    const { key, ...otherProps } = props;
    return (
      <Box
        component="li"
        key={key}
        {...otherProps}
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
        <MuiAvatar
          src={option.avatar}
          alt={option.label}
          size="small"
          sx={{ width: 24, height: 24 }}
        >
          {option.label?.charAt(0)}
        </MuiAvatar>
        <Box>
          <Typography variant="body2">{option.label}</Typography>
          <Typography variant="caption" color="text.secondary">
            {option.role}
          </Typography>
        </Box>
      </Box>
    );
  }, []);

  // Dialog actions
  const dialogActions = useMemo(
    () => (
      <>
        <Button
          onClick={handleClose}
          disabled={isSubmitting}
          color="inherit"
          size="small"
        >
          Cancel
        </Button>
        <Button
          type="button"
          form="project-task-form"
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          variant="contained"
          startIcon={isSubmitting ? <CircularProgress size={16} /> : null}
          size="small"
        >
          {isSubmitting
            ? isEditMode
              ? "Updating..."
              : "Creating..."
            : isEditMode
            ? "Update Task"
            : "Create Task"}
        </Button>
      </>
    ),
    [handleClose, handleSubmit, onSubmit, isSubmitting, isEditMode]
  );

  return (
    <MuiDialog
      open={open}
      onClose={handleClose}
      title={isEditMode ? "Edit Project Task" : "Create Project Task"}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      actions={dialogActions}
    >
      <Box
        component="form"
        id="project-task-form"
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        sx={{ pt: 1 }}
      >
        <Grid container spacing={2}>
          {/* Title - Full width */}
          <Grid size={12}>
            <MuiTextField
              {...register("title", {
                required: "Title is required",
                maxLength: {
                  value: LIMITS.TITLE_MAX,
                  message: `Title cannot exceed ${LIMITS.TITLE_MAX} characters`,
                },
              })}
              label="Title"
              placeholder="Enter task title"
              required
              error={errors.title}
              helperText={errors.title?.message}
            />
          </Grid>

          {/* Description - Full width, multiline */}
          <Grid size={12}>
            <MuiTextField
              {...register("description", {
                required: "Description is required",
                maxLength: {
                  value: LIMITS.DESCRIPTION_MAX,
                  message: `Description cannot exceed ${LIMITS.DESCRIPTION_MAX} characters`,
                },
              })}
              label="Description"
              placeholder="Enter task description"
              required
              multiline
              rows={3}
              error={errors.description}
              helperText={errors.description?.message}
            />
          </Grid>

          {/* Vendor - Half width */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="vendorId"
              control={control}
              rules={{ required: "Vendor is required" }}
              render={({ field: { onChange, value, ...field } }) => (
                <MuiSelectAutocomplete
                  {...field}
                  value={
                    vendorOptions.find((opt) => opt.value === value) || null
                  }
                  onChange={(newValue) => onChange(newValue?.value || null)}
                  options={vendorOptions}
                  label="Vendor"
                  placeholder="Select vendor"
                  required
                  isLoading={isLoadingVendors}
                  error={errors.vendorId}
                  helperText={errors.vendorId?.message}
                  getOptionLabel={getVendorOptionLabel}
                  renderOption={renderVendorOption}
                  isOptionEqualToValue={(option, val) =>
                    option?.value === val?.value
                  }
                />
              )}
            />
          </Grid>

          {/* Status - Half width */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="status"
              control={control}
              render={({ field: { onChange, value, ...field } }) => (
                <MuiSelectAutocomplete
                  {...field}
                  value={
                    STATUS_OPTIONS.find((opt) => opt.value === value) || null
                  }
                  onChange={(newValue) =>
                    onChange(newValue?.value || TASK_STATUS.TO_DO)
                  }
                  options={STATUS_OPTIONS}
                  label="Status"
                  placeholder="Select status"
                  disableClearable
                  error={errors.status}
                  helperText={errors.status?.message}
                  isOptionEqualToValue={(option, val) =>
                    option?.value === val?.value
                  }
                />
              )}
            />
          </Grid>

          {/* Priority - Half width */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="priority"
              control={control}
              render={({ field: { onChange, value, ...field } }) => (
                <MuiSelectAutocomplete
                  {...field}
                  value={
                    PRIORITY_OPTIONS.find((opt) => opt.value === value) || null
                  }
                  onChange={(newValue) =>
                    onChange(newValue?.value || TASK_PRIORITY.MEDIUM)
                  }
                  options={PRIORITY_OPTIONS}
                  label="Priority"
                  placeholder="Select priority"
                  disableClearable
                  error={errors.priority}
                  helperText={errors.priority?.message}
                  isOptionEqualToValue={(option, val) =>
                    option?.value === val?.value
                  }
                />
              )}
            />
          </Grid>

          {/* Currency - Half width */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="currency"
              control={control}
              render={({ field: { onChange, value, ...field } }) => (
                <MuiSelectAutocomplete
                  {...field}
                  value={
                    CURRENCY_OPTIONS.find((opt) => opt.value === value) || null
                  }
                  onChange={(newValue) =>
                    onChange(newValue?.value || CURRENCY.DEFAULT)
                  }
                  options={CURRENCY_OPTIONS}
                  label="Currency"
                  placeholder="Select currency"
                  disableClearable
                  error={errors.currency}
                  helperText={errors.currency?.message}
                  isOptionEqualToValue={(option, val) =>
                    option?.value === val?.value
                  }
                />
              )}
            />
          </Grid>

          {/* Estimated Cost - Half width */}
          <Grid size={{ xs: 12, md: 6 }}>
            <MuiNumberField
              {...register("estimatedCost", {
                min: {
                  value: 0,
                  message: "Estimated cost cannot be negative",
                },
              })}
              label="Estimated Cost"
              placeholder="0.00"
              min={0}
              decimalPlaces={2}
              error={errors.estimatedCost}
              helperText={errors.estimatedCost?.message}
            />
          </Grid>

          {/* Actual Cost - Half width */}
          <Grid size={{ xs: 12, md: 6 }}>
            <MuiNumberField
              {...register("actualCost", {
                min: {
                  value: 0,
                  message: "Actual cost cannot be negative",
                },
              })}
              label="Actual Cost"
              placeholder="0.00"
              min={0}
              decimalPlaces={2}
              error={errors.actualCost}
              helperText={errors.actualCost?.message}
            />
          </Grid>

          {/* Start Date - Half width */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="startDate"
              control={control}
              rules={{ required: "Start date is required" }}
              render={({ field: { onChange, value, ...field } }) => (
                <MuiDatePicker
                  {...field}
                  value={value}
                  onChange={onChange}
                  label="Start Date"
                  required
                  error={errors.startDate}
                  helperText={errors.startDate?.message}
                />
              )}
            />
          </Grid>

          {/* Due Date - Half width */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="dueDate"
              control={control}
              rules={{
                required: "Due date is required",
                validate: (value) => {
                  const startDate = getValues("startDate");
                  if (
                    startDate &&
                    value &&
                    new Date(value) < new Date(startDate)
                  ) {
                    return "Due date cannot be before start date";
                  }
                  return true;
                },
              }}
              render={({ field: { onChange, value, ...field } }) => (
                <MuiDatePicker
                  {...field}
                  value={value}
                  onChange={onChange}
                  label="Due Date"
                  required
                  error={errors.dueDate}
                  helperText={errors.dueDate?.message}
                />
              )}
            />
          </Grid>

          {/* Watchers (HOD Users Only) - Full width */}
          <Grid size={12}>
            <Controller
              name="watcherIds"
              control={control}
              render={({ field: { onChange, value, ...field } }) => (
                <MuiMultiSelect
                  {...field}
                  value={hodUserOptions.filter((opt) =>
                    value?.includes(opt.value)
                  )}
                  onChange={(newValue) =>
                    onChange(newValue?.map((v) => v.value) || [])
                  }
                  options={hodUserOptions}
                  label="Watchers (HOD Users)"
                  placeholder="Select watchers"
                  maxItems={LIMITS.MAX_WATCHERS}
                  isLoading={isLoadingHodUsers}
                  error={errors.watcherIds}
                  helperText={
                    errors.watcherIds?.message ||
                    "Only HOD users (Admin/SuperAdmin) can be watchers"
                  }
                  getOptionLabel={getHodUserOptionLabel}
                  renderOption={renderHodUserOption}
                  isOptionEqualToValue={(option, val) =>
                    option?.value === val?.value
                  }
                />
              )}
            />
          </Grid>

          {/* Tags - Full width with chip input */}
          <Grid size={12}>
            <MuiTextField
              {...register("tagInput")}
              label={`Tags (max ${LIMITS.MAX_TAGS})`}
              placeholder="Enter tag and press Enter or click +"
              disabled={tagsDisplay.length >= LIMITS.MAX_TAGS}
              onKeyDown={handleTagKeyDown}
              endAdornment={
                <IconButton
                  onClick={handleAddTag}
                  edge="end"
                  color="primary"
                  disabled={tagsDisplay.length >= LIMITS.MAX_TAGS}
                  size="small"
                >
                  <AddIcon />
                </IconButton>
              }
            />
            {tagsDisplay.length > 0 && (
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 1,
                  mt: 1,
                }}
              >
                {tagsDisplay.map((tag) => (
                  <MuiChip
                    key={tag}
                    label={tag}
                    size="small"
                    onDelete={() => handleRemoveTag(tag)}
                  />
                ))}
              </Box>
            )}
          </Grid>

          {/* Attachments placeholder */}
          <Grid size={12}>
            <Alert severity="info">
              File attachments can be added after creating the task.
            </Alert>
          </Grid>
        </Grid>
      </Box>
    </MuiDialog>
  );
};

export default ProjectTaskForm;
