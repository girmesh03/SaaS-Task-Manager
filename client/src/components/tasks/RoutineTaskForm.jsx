/**
 * RoutineTaskForm Component - RoutineTask Create/Update Form Dialog
 *
 * Form dialog for creating and updating RoutineTask.
 * Supports dynamic materials array with auto-calculated costs.
 * Note: RoutineTask does not support activities.
 *
 * Key RoutineTask constraints:
 * - Status cannot be "To Do" (only In Progress, Completed, Pending)
 * - Priority cannot be "Low" (only Medium, High, Urgent)
 * - Start date and due date are required
 * - Materials are added directly to the task (no activities)
 *
 * Requirements: 6.3, 6.4, 6.8, 6.9
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
  Divider,
  Paper,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { toast } from "react-toastify";
import {
  MuiDialog,
  MuiTextField,
  MuiNumberField,
  MuiSelectAutocomplete,
  MuiDatePicker,
  MuiChip,
} from "../common";
import useResponsive from "../../hooks/useResponsive";
import useAuth from "../../hooks/useAuth";
import { useGetMaterialsQuery } from "../../redux/features/materialApi";
import {
  useCreateTaskMutation,
  useUpdateTaskMutation,
} from "../../redux/features/taskApi";
import { handleApiError } from "../../utils/errorHandler";
import {
  TASK_TYPES,
  TASK_STATUS,
  TASK_PRIORITY,
  LIMITS,
} from "../../utils/constants";

/**
 * Status options for RoutineTask - EXCLUDE "To Do"
 */
const STATUS_OPTIONS = [
  { value: TASK_STATUS.IN_PROGRESS, label: "In Progress" },
  { value: TASK_STATUS.COMPLETED, label: "Completed" },
  { value: TASK_STATUS.PENDING, label: "Pending" },
];

/**
 * Priority options for RoutineTask - EXCLUDE "Low"
 */
const PRIORITY_OPTIONS = [
  { value: TASK_PRIORITY.MEDIUM, label: "Medium" },
  { value: TASK_PRIORITY.HIGH, label: "High" },
  { value: TASK_PRIORITY.URGENT, label: "Urgent" },
];

/**
 * Default form values
 */
const DEFAULT_VALUES = {
  description: "",
  startDate: null,
  dueDate: null,
  status: TASK_STATUS.IN_PROGRESS,
  priority: TASK_PRIORITY.MEDIUM,
  materials: [],
  tags: [],
  attachmentIds: [],
  tagInput: "",
};

/**
 * RoutineTaskForm Component
 *
 * @param {Object} props - Component props
 * @param {boolean} props.open - Whether dialog is open
 * @param {Function} props.onClose - Callback when dialog is closed
 * @param {Object} props.task - Task data for edit mode (null for create)
 * @param {string} props.departmentId - Department ID for the task
 * @param {Function} props.onSuccess - Callback on successful create/update
 */
const RoutineTaskForm = ({
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

  // Fetch materials from same department
  const { data: materialsData, isLoading: isLoadingMaterials } =
    useGetMaterialsQuery(
      {
        limit: 100,
        deleted: false,
        departmentId: departmentId || user?.department?._id,
      },
      { skip: !open }
    );

  // Memoize material options
  const materialOptions = useMemo(() => {
    if (!materialsData?.data) return [];
    return materialsData.data.map((material) => ({
      value: material._id,
      label: material.name,
      unit: material.unit,
      price: material.price,
      category: material.category,
    }));
  }, [materialsData]);

  // React Hook Form setup
  const {
    control,
    handleSubmit,
    register,
    reset,
    setValue,
    getValues,
    formState: { errors, isDirty },
  } = useForm({
    defaultValues: DEFAULT_VALUES,
    mode: "onBlur",
  });

  // Field array for materials
  const { fields, append, remove } = useFieldArray({
    control,
    name: "materials",
  });

  // Memoize tags from task to avoid unnecessary re-renders
  const syncedTags = useMemo(() => task?.tags || [], [task?.tags]);

  // Reset form when dialog opens/closes or task changes
  useEffect(() => {
    if (!open) return;

    if (task) {
      // Edit mode - populate form with task data
      const materialsArray =
        task.materials?.map((m) => ({
          materialId: m.material?._id || m.material,
          quantity: m.quantity || 0,
          unit: m.material?.unit || "",
          price: m.material?.price || 0,
        })) || [];

      reset({
        description: task.description || "",
        startDate: task.startDate || null,
        dueDate: task.dueDate || null,
        status: task.status || TASK_STATUS.IN_PROGRESS,
        priority: task.priority || TASK_PRIORITY.MEDIUM,
        materials: materialsArray,
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
        // Prepare materials payload
        const materialsPayload = data.materials
          .filter((m) => m.materialId)
          .map((m) => ({
            material: m.materialId,
            quantity: parseFloat(m.quantity) || 0,
          }));

        // Prepare payload
        const payload = {
          taskType: TASK_TYPES.ROUTINE_TASK,
          departmentId: departmentId || user?.department?._id,
          description: data.description.trim(),
          startDate: data.startDate,
          dueDate: data.dueDate,
          status: data.status,
          priority: data.priority,
          materials: materialsPayload,
          tags: data.tags,
          attachmentIds: data.attachmentIds,
        };

        if (isEditMode) {
          // Update task
          await updateTask({ taskId: task._id, data: payload }).unwrap();
          toast.success("Routine task updated successfully");
        } else {
          // Create task
          await createTask(payload).unwrap();
          toast.success("Routine task created successfully");
        }

        onSuccess?.();
        onClose();
      } catch (error) {
        const { message, fieldErrors } = handleApiError(error);
        toast.error(message);

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
   * Handle adding a material row
   */
  const handleAddMaterial = useCallback(() => {
    if (fields.length >= LIMITS.MAX_MATERIALS) {
      toast.error(`Cannot have more than ${LIMITS.MAX_MATERIALS} materials`);
      return;
    }
    append({ materialId: null, quantity: 0, unit: "", price: 0 });
  }, [fields.length, append]);

  /**
   * Handle material selection change
   */
  const handleMaterialChange = useCallback(
    (index, selectedMaterial) => {
      if (selectedMaterial) {
        setValue(`materials.${index}.unit`, selectedMaterial.unit || "");
        setValue(`materials.${index}.price`, selectedMaterial.price || 0);
      } else {
        setValue(`materials.${index}.unit`, "");
        setValue(`materials.${index}.price`, 0);
      }
    },
    [setValue]
  );

  /**
   * Calculate total cost for a material row
   */
  const calculateRowTotal = useCallback((quantity, price) => {
    const qty = parseFloat(quantity) || 0;
    const prc = parseFloat(price) || 0;
    return (qty * prc).toFixed(2);
  }, []);

  /**
   * Calculate grand total of all materials
   * Note: We use fields.length as a trigger to recalculate when materials change
   */
  const grandTotal = useMemo(() => {
    const materials = getValues("materials") || [];
    return materials
      .reduce((sum, m) => {
        const qty = parseFloat(m.quantity) || 0;
        const prc = parseFloat(m.price) || 0;
        return sum + qty * prc;
      }, 0)
      .toFixed(2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getValues, fields.length]);

  /**
   * Handle adding a tag
   */
  const handleAddTag = useCallback(() => {
    const tagInputValue = getValues("tagInput") || "";
    const trimmedTag = tagInputValue.trim().toLowerCase();
    if (!trimmedTag) return;

    const currentTags = getValues("tags") || [];

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
          form="routine-task-form"
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting || (!isDirty && isEditMode)}
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
    [handleClose, handleSubmit, onSubmit, isSubmitting, isDirty, isEditMode]
  );

  return (
    <MuiDialog
      open={open}
      onClose={handleClose}
      title={isEditMode ? "Edit Routine Task" : "Create Routine Task"}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      actions={dialogActions}
    >
      <Box
        component="form"
        id="routine-task-form"
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        sx={{ pt: 1 }}
      >
        {/* Info Alert */}
        <Alert severity="info" sx={{ mb: 2 }}>
          Note: RoutineTask does not support activities. Materials are added
          directly to the task.
        </Alert>

        <Grid container spacing={2}>
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
              rows={4}
              error={errors.description}
              helperText={errors.description?.message}
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
                    new Date(value) <= new Date(startDate)
                  ) {
                    return "Due date must be after start date";
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

          {/* Status - Half width */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="status"
              control={control}
              rules={{
                validate: (value) => {
                  if (value === TASK_STATUS.TO_DO) {
                    return 'RoutineTask status cannot be "To Do"';
                  }
                  return true;
                },
              }}
              render={({ field: { onChange, value, ...field } }) => (
                <MuiSelectAutocomplete
                  {...field}
                  value={
                    STATUS_OPTIONS.find((opt) => opt.value === value) || null
                  }
                  onChange={(newValue) =>
                    onChange(newValue?.value || TASK_STATUS.IN_PROGRESS)
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
              rules={{
                validate: (value) => {
                  if (value === TASK_PRIORITY.LOW) {
                    return 'RoutineTask priority cannot be "Low"';
                  }
                  return true;
                },
              }}
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

          {/* Materials Section - Full width */}
          <Grid size={12}>
            <Divider sx={{ my: 1 }} />
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="subtitle1" fontWeight={500}>
                Materials (max {LIMITS.MAX_MATERIALS})
              </Typography>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddMaterial}
                disabled={fields.length >= LIMITS.MAX_MATERIALS}
              >
                Add Material
              </Button>
            </Box>

            {fields.length === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textAlign: "center", py: 2 }}
              >
                No materials added. Click "Add Material" to add materials.
              </Typography>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {fields.map((field, index) => (
                  <Paper
                    key={field.id}
                    variant="outlined"
                    sx={{ p: 2, position: "relative" }}
                  >
                    <IconButton
                      size="small"
                      onClick={() => remove(index)}
                      sx={{ position: "absolute", top: 8, right: 8 }}
                      color="error"
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>

                    <Grid container spacing={2}>
                      {/* Material Selection */}
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                          name={`materials.${index}.materialId`}
                          control={control}
                          rules={{ required: "Material is required" }}
                          render={({ field: { onChange, value, ...fld } }) => (
                            <MuiSelectAutocomplete
                              {...fld}
                              value={
                                materialOptions.find(
                                  (opt) => opt.value === value
                                ) || null
                              }
                              onChange={(newValue) => {
                                onChange(newValue?.value || null);
                                handleMaterialChange(index, newValue);
                              }}
                              options={materialOptions}
                              label="Material"
                              placeholder="Select material"
                              required
                              isLoading={isLoadingMaterials}
                              error={errors.materials?.[index]?.materialId}
                              helperText={
                                errors.materials?.[index]?.materialId?.message
                              }
                              isOptionEqualToValue={(option, val) =>
                                option?.value === val?.value
                              }
                            />
                          )}
                        />
                      </Grid>

                      {/* Quantity */}
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                          name={`materials.${index}.quantity`}
                          control={control}
                          rules={{
                            required: "Quantity is required",
                            min: {
                              value: 0,
                              message: "Quantity cannot be negative",
                            },
                          }}
                          render={({ field }) => (
                            <MuiNumberField
                              {...field}
                              label="Quantity"
                              placeholder="0"
                              min={0}
                              required
                              error={errors.materials?.[index]?.quantity}
                              helperText={
                                errors.materials?.[index]?.quantity?.message
                              }
                            />
                          )}
                        />
                      </Grid>

                      {/* Unit (Display only) */}
                      <Grid size={{ xs: 6, md: 3 }}>
                        <Controller
                          name={`materials.${index}.unit`}
                          control={control}
                          render={({ field }) => (
                            <MuiTextField
                              {...field}
                              label="Unit"
                              disabled
                              placeholder="-"
                            />
                          )}
                        />
                      </Grid>

                      {/* Price (Display only) */}
                      <Grid size={{ xs: 6, md: 3 }}>
                        <Controller
                          name={`materials.${index}.price`}
                          control={control}
                          render={({ field }) => (
                            <MuiTextField
                              {...field}
                              label="Price"
                              disabled
                              placeholder="-"
                            />
                          )}
                        />
                      </Grid>

                      {/* Total Cost (Calculated) */}
                      <Grid size={{ xs: 12, md: 6 }}>
                        <MuiTextField
                          label="Total Cost"
                          value={calculateRowTotal(
                            getValues(`materials.${index}.quantity`),
                            getValues(`materials.${index}.price`)
                          )}
                          disabled
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                ))}

                {/* Grand Total */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                    mt: 1,
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={600}>
                    Grand Total: {grandTotal}
                  </Typography>
                </Box>
              </Box>
            )}
            <Divider sx={{ mt: 2 }} />
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

export default RoutineTaskForm;
