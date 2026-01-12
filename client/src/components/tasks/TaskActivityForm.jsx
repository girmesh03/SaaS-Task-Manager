/**
 * TaskActivityForm Component - TaskActivity Create/Update Form Dialog
 *
 * Form dialog for creating and updating TaskActivity.
 * Supports dynamic materials array with auto-calculated costs.
 * Requires attachments as proof for activities with materials.
 *
 * Key constraints:
 * - Parent must be ProjectTask or AssignedTask (NOT RoutineTask)
 * - For AssignedTask: user must be in assignees array
 * - Attachments are required as proof
 * - Materials are optional but max 20
 *
 * Requirements: 8.2, 8.3, 8.4, 8.5, 8.9
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
} from "../common";
import useResponsive from "../../hooks/useResponsive";
import useAuth from "../../hooks/useAuth";
import { useGetMaterialsQuery } from "../../redux/features/materialApi";
import {
  useCreateTaskActivityMutation,
  useUpdateTaskActivityMutation,
} from "../../redux/features/taskActivityApi";
import { handleApiError } from "../../utils/errorHandler";
import { TASK_TYPES, LIMITS } from "../../utils/constants";

/**
 * Default form values
 */
const DEFAULT_VALUES = {
  activity: "",
  materials: [],
  attachmentIds: [],
};

/**
 * TaskActivityForm Component
 *
 * @param {Object} props - Component props
 * @param {boolean} props.open - Whether dialog is open
 * @param {Function} props.onClose - Callback when dialog is closed
 * @param {Object} props.activity - Activity data for edit mode (null for create)
 * @param {Object} props.task - Parent task object (required for create mode)
 * @param {Function} props.onSuccess - Callback on successful create/update
 */
const TaskActivityForm = ({
  open,
  onClose,
  activity = null,
  task = null,
  onSuccess,
}) => {
  const { isMobile } = useResponsive();
  const { user } = useAuth();
  const isEditMode = Boolean(activity);

  // API mutations
  const [createActivity, { isLoading: isCreating }] =
    useCreateTaskActivityMutation();
  const [updateActivity, { isLoading: isUpdating }] =
    useUpdateTaskActivityMutation();
  const isSubmitting = isCreating || isUpdating;

  // Validation state
  const [validationError, setValidationError] = useState(null);

  // Get department ID from task or activity
  const departmentId = useMemo(() => {
    if (activity?.department?._id) return activity.department._id;
    if (activity?.department) return activity.department;
    if (task?.department?._id) return task.department._id;
    if (task?.department) return task.department;
    return user?.department?._id;
  }, [activity, task, user]);

  // Fetch materials from same department
  const { data: materialsData, isLoading: isLoadingMaterials } =
    useGetMaterialsQuery(
      {
        limit: 100,
        deleted: false,
        departmentId: departmentId,
      },
      { skip: !open || !departmentId }
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
    formState: { errors },
  } = useForm({
    defaultValues: DEFAULT_VALUES,
    mode: "onBlur",
  });

  // Field array for materials
  const { fields, append, remove } = useFieldArray({
    control,
    name: "materials",
  });

  // Validate parent task type
  const validateParentTask = useCallback(() => {
    if (!task && !activity) {
      return { valid: false, error: "Parent task is required" };
    }

    const parentTask = task || activity?.parent;
    const taskType = parentTask?.taskType;

    // Check if parent is RoutineTask
    if (taskType === TASK_TYPES.ROUTINE_TASK) {
      return {
        valid: false,
        error:
          "RoutineTask does not support activities. Materials are added directly to the task.",
      };
    }

    // Check if parent is ProjectTask or AssignedTask
    if (
      taskType !== TASK_TYPES.PROJECT_TASK &&
      taskType !== TASK_TYPES.ASSIGNED_TASK
    ) {
      return {
        valid: false,
        error: "Parent must be ProjectTask or AssignedTask",
      };
    }

    // For AssignedTask, validate user is in assignees array
    if (taskType === TASK_TYPES.ASSIGNED_TASK && !isEditMode) {
      const assignees = parentTask?.assignees || [];
      const isAssigned = assignees.some(
        (assignee) => (assignee?._id || assignee) === user?._id
      );
      if (!isAssigned) {
        return {
          valid: false,
          error:
            "You must be assigned to this task to add activities. Only assignees can add activities to AssignedTask.",
        };
      }
    }

    return { valid: true, error: null };
  }, [task, activity, user, isEditMode]);

  // Check validation on mount and when task changes
  useEffect(() => {
    if (open) {
      const validation = validateParentTask();
      setValidationError(validation.error);
    }
  }, [open, validateParentTask]);

  // Reset form when dialog opens/closes or activity changes
  useEffect(() => {
    if (!open) return;

    if (activity) {
      // Edit mode - populate form with activity data
      const materialsArray =
        activity.materials?.map((m) => ({
          materialId: m.material?._id || m.material,
          quantity: m.quantity || 0,
          unit: m.material?.unit || "",
          price: m.material?.price || 0,
        })) || [];

      reset({
        activity: activity.activity || "",
        materials: materialsArray,
        attachmentIds: activity.attachments?.map((a) => a._id || a) || [],
      });
    } else {
      // Create mode - reset to defaults
      reset(DEFAULT_VALUES);
    }
  }, [open, activity, reset]);

  /**
   * Handle form submission
   */
  const onSubmit = useCallback(
    async (data) => {
      try {
        // Validate parent task
        const validation = validateParentTask();
        if (!validation.valid) {
          toast.error(validation.error);
          return;
        }

        // Prepare materials payload
        const materialsPayload = data.materials
          .filter((m) => m.materialId)
          .map((m) => ({
            materialId: m.materialId,
            quantity: parseFloat(m.quantity) || 0,
          }));

        // Prepare payload
        const payload = {
          activity: data.activity.trim(),
          materials: materialsPayload,
        };

        if (isEditMode) {
          // Update activity
          await updateActivity({
            activityId: activity._id,
            data: payload,
          }).unwrap();
          toast.success("Activity updated successfully");
        } else {
          // Create activity - include taskId
          payload.taskId = task._id;
          await createActivity(payload).unwrap();
          toast.success("Activity created successfully");
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
      activity,
      task,
      validateParentTask,
      createActivity,
      updateActivity,
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

  // Get task type for display
  const taskType = useMemo(() => {
    if (task?.taskType) return task.taskType;
    if (activity?.parent?.taskType) return activity.parent.taskType;
    return null;
  }, [task, activity]);

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
          form="task-activity-form"
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting || !!validationError}
          variant="contained"
          startIcon={isSubmitting ? <CircularProgress size={16} /> : null}
          size="small"
        >
          {isSubmitting
            ? isEditMode
              ? "Updating..."
              : "Creating..."
            : isEditMode
            ? "Update Activity"
            : "Add Activity"}
        </Button>
      </>
    ),
    [
      handleClose,
      handleSubmit,
      onSubmit,
      isSubmitting,
      isEditMode,
      validationError,
    ]
  );

  return (
    <MuiDialog
      open={open}
      onClose={handleClose}
      title={isEditMode ? "Edit Activity" : "Add Activity"}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      actions={dialogActions}
    >
      <Box
        component="form"
        id="task-activity-form"
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        sx={{ pt: 1 }}
      >
        {/* Validation Error Alert */}
        {validationError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {validationError}
          </Alert>
        )}

        {/* Task Type Info */}
        {taskType && !validationError && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Adding activity to{" "}
            <strong>
              {taskType === TASK_TYPES.PROJECT_TASK
                ? "Project Task"
                : "Assigned Task"}
            </strong>
            . Materials added here will be tracked as part of this activity.
          </Alert>
        )}

        <Grid container spacing={2}>
          {/* Activity Text - Full width, multiline */}
          <Grid size={12}>
            <MuiTextField
              {...register("activity", {
                required: "Activity description is required",
                maxLength: {
                  value: LIMITS.ACTIVITY_MAX,
                  message: `Activity cannot exceed ${LIMITS.ACTIVITY_MAX} characters`,
                },
              })}
              label="Activity Description"
              placeholder="Describe the activity performed..."
              required
              multiline
              rows={4}
              disabled={!!validationError}
              error={errors.activity}
              helperText={errors.activity?.message}
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
                Materials Used (max {LIMITS.MAX_MATERIALS})
              </Typography>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddMaterial}
                disabled={
                  fields.length >= LIMITS.MAX_MATERIALS || !!validationError
                }
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
                No materials added. Click &quot;Add Material&quot; to track
                materials used in this activity.
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
                      disabled={!!validationError}
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
                              disabled={!!validationError}
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
                              value: 1,
                              message: "Quantity must be >= 1",
                            },
                          }}
                          render={({ field }) => (
                            <MuiNumberField
                              {...field}
                              label="Quantity"
                              placeholder="1"
                              min={1}
                              required
                              disabled={!!validationError}
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

          {/* Attachments placeholder */}
          <Grid size={12}>
            <Alert severity="info">
              File attachments (required as proof) can be added after creating
              the activity.
            </Alert>
          </Grid>
        </Grid>
      </Box>
    </MuiDialog>
  );
};

export default TaskActivityForm;
