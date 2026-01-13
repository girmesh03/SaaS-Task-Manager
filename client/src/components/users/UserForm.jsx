/**
 * UserForm Component - User Create/Update Form Dialog
 *
 * Form dialog for creating and updating users.
 * Supports role assignment, department selection, skills management, and profile picture upload.
 *
 * Requirements: 4.3, 4.4
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
  FormControlLabel,
  Checkbox,
  FormGroup,
  LinearProgress,
  Divider,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { toast } from "react-toastify";
import {
  MuiDialog,
  MuiTextField,
  MuiSelectAutocomplete,
  MuiDatePicker,
  MuiAvatar,
  MuiNumberField,
} from "../common";
import useResponsive from "../../hooks/useResponsive";
import useAuth from "../../hooks/useAuth";
import { useGetDepartmentsQuery } from "../../redux/features/departmentApi";
import {
  useCreateUserMutation,
  useUpdateUserMutation,
} from "../../redux/features/userApi";
import { handleApiError } from "../../utils/errorHandler";
import { convertLocalToUTC, convertUTCToLocal } from "../../utils/dateUtils";
import { USER_ROLES, LIMITS } from "../../utils/constants";

/**
 * Role options
 */
const ROLE_OPTIONS = [
  { value: USER_ROLES.SUPER_ADMIN, label: "SuperAdmin" },
  { value: USER_ROLES.ADMIN, label: "Admin" },
  { value: USER_ROLES.MANAGER, label: "Manager" },
  { value: USER_ROLES.USER, label: "User" },
];

/**
 * Default form values
 */
const DEFAULT_VALUES = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  employeeId: "",
  dateOfBirth: null,
  joinedAt: null,
  position: "",
  role: USER_ROLES.USER,
  departmentId: "",
  profilePicture: { url: "", publicId: "" },
  skills: [],
  emailPreferences: {
    enabled: true,
    taskNotifications: true,
    taskReminders: true,
    mentions: true,
    announcements: true,
    welcomeEmails: true,
    passwordReset: true,
  },
};

/**
 * Calculate password strength
 */
const calculatePasswordStrength = (password) => {
  if (!password) return { strength: 0, label: "", color: "default" };

  let strength = 0;
  if (password.length >= 8) strength += 25;
  if (password.length >= 12) strength += 25;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
  if (/\d/.test(password)) strength += 12.5;
  if (/[^a-zA-Z0-9]/.test(password)) strength += 12.5;

  let label = "";
  let color = "default";
  if (strength < 25) {
    label = "Weak";
    color = "error";
  } else if (strength < 50) {
    label = "Fair";
    color = "warning";
  } else if (strength < 75) {
    label = "Good";
    color = "info";
  } else {
    label = "Strong";
    color = "success";
  }

  return { strength, label, color };
};

/**
 * UserForm Component
 *
 * @param {Object} props - Component props
 * @param {boolean} props.open - Whether dialog is open
 * @param {Function} props.onClose - Callback when dialog is closed
 * @param {Object} props.user - User data for edit mode (null for create)
 * @param {Function} props.onSuccess - Callback on successful create/update
 */
const UserForm = ({ open, onClose, user = null, onSuccess }) => {
  const { isMobile } = useResponsive();
  useAuth(); // Ensure user is authenticated
  const isEditMode = Boolean(user);

  // Local state
  const [passwordStrength, setPasswordStrength] = useState({
    strength: 0,
    label: "",
    color: "default",
  });
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Derive profile picture preview from user prop or local state
  const [uploadedPicture, setUploadedPicture] = useState(null);
  const profilePicturePreview =
    uploadedPicture || user?.profilePicture?.url || "";

  // API mutations
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const isSubmitting = isCreating || isUpdating;

  // Fetch departments from same organization
  const { data: departmentsData, isLoading: isLoadingDepartments } =
    useGetDepartmentsQuery({ limit: 100, deleted: false }, { skip: !open });

  // Memoize department options
  const departmentOptions = useMemo(() => {
    if (!departmentsData?.data) return [];
    return departmentsData.data.map((dept) => ({
      value: dept._id,
      label: dept.name,
    }));
  }, [departmentsData]);

  // React Hook Form setup
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: DEFAULT_VALUES,
    mode: "onBlur",
  });

  // Field array for skills
  const { fields, append, remove } = useFieldArray({
    control,
    name: "skills",
  });

  // Check if user is current HOD
  const isCurrentHOD = useMemo(() => {
    if (!isEditMode || !user) return false;
    // Check if user is HOD of their department
    const userDept = departmentsData?.data?.find(
      (d) => d._id === user.department?._id || d._id === user.department
    );
    return userDept?.hod?._id === user._id || userDept?.hod === user._id;
  }, [isEditMode, user, departmentsData]);

  // Reset form when dialog opens/closes or user changes
  useEffect(() => {
    if (!open) return;

    if (user) {
      // Edit mode - populate form with user data
      reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        password: "", // Never populate password in edit mode
        employeeId: user.employeeId || "",
        dateOfBirth: user.dateOfBirth
          ? convertUTCToLocal(user.dateOfBirth)
          : null,
        joinedAt: user.joinedAt ? convertUTCToLocal(user.joinedAt) : null,
        position: user.position || "",
        role: user.role || USER_ROLES.USER,
        departmentId: user.department?._id || user.department || "",
        profilePicture: user.profilePicture || { url: "", publicId: "" },
        skills: user.skills || [],
        emailPreferences:
          user.emailPreferences || DEFAULT_VALUES.emailPreferences,
      });
    } else {
      // Create mode - reset to defaults
      reset(DEFAULT_VALUES);
    }

    // Cleanup function to reset state when dialog closes
    return () => {
      setUploadedPicture(null);
      setPasswordStrength({ strength: 0, label: "", color: "default" });
    };
  }, [open, user, reset]);

  /**
   * Handle password change to update strength indicator
   */
  const handlePasswordChange = useCallback(
    (e, field) => {
      const newPassword = e.target.value;
      field.onChange(e);
      if (!isEditMode && newPassword) {
        setPasswordStrength(calculatePasswordStrength(newPassword));
      } else {
        setPasswordStrength({ strength: 0, label: "", color: "default" });
      }
    },
    [isEditMode]
  );

  /**
   * Handle Cloudinary upload
   */
  const handleImageUpload = useCallback(() => {
    setIsUploadingImage(true);

    // Cloudinary upload widget
    const cloudinaryWidget = window.cloudinary.createUploadWidget(
      {
        cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
        uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
        sources: ["local", "camera"],
        multiple: false,
        maxFileSize: 10000000, // 10MB
        clientAllowedFormats: ["jpg", "jpeg", "png", "gif", "webp", "svg"],
        cropping: true,
        croppingAspectRatio: 1,
        croppingShowDimensions: true,
        folder: "user-profiles",
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          toast.error("Failed to upload image");
          setIsUploadingImage(false);
          return;
        }

        if (result.event === "success") {
          const { secure_url, public_id } = result.info;
          setValue("profilePicture", {
            url: secure_url,
            publicId: public_id,
          });
          setUploadedPicture(secure_url);
          toast.success("Image uploaded successfully");
          setIsUploadingImage(false);
        }
      }
    );

    cloudinaryWidget.open();
  }, [setValue]);

  /**
   * Handle form submission
   */
  const onSubmit = useCallback(
    async (data) => {
      try {
        // Validate HOD constraints
        if (isEditMode && isCurrentHOD) {
          // Check if role is being changed from HOD role
          const wasHod =
            user.role === USER_ROLES.SUPER_ADMIN ||
            user.role === USER_ROLES.ADMIN;
          const willBeHod =
            data.role === USER_ROLES.SUPER_ADMIN ||
            data.role === USER_ROLES.ADMIN;

          if (wasHod && !willBeHod) {
            toast.error(
              "Cannot change role. User is the HOD of their department. Please assign a new HOD first."
            );
            return;
          }

          // Check if department is being changed
          if (
            data.departmentId &&
            data.departmentId !== (user.department?._id || user.department)
          ) {
            toast.error(
              "Cannot change department. User is the HOD of their current department. Please assign a new HOD first."
            );
            return;
          }
        }

        // Prepare payload
        const payload = {
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          email: data.email.trim().toLowerCase(),
          position: data.position?.trim() || undefined,
          role: data.role,
          departmentId: data.departmentId,
          employeeId: data.employeeId?.trim() || undefined,
          dateOfBirth: data.dateOfBirth
            ? convertLocalToUTC(data.dateOfBirth)
            : undefined,
          joinedAt: data.joinedAt
            ? convertLocalToUTC(data.joinedAt)
            : undefined,
          profilePicture: data.profilePicture?.url
            ? {
                url: data.profilePicture.url,
                publicId: data.profilePicture.publicId,
              }
            : undefined,
          skills: data.skills.map((skill) => ({
            skill: skill.skill.trim(),
            percentage: parseInt(skill.percentage, 10),
          })),
          emailPreferences: data.emailPreferences,
        };

        // Add password only in create mode
        if (!isEditMode && data.password) {
          payload.password = data.password;
        }

        // Call API
        let result;
        if (isEditMode) {
          result = await updateUser({
            userId: user._id,
            data: payload,
          }).unwrap();
          toast.success("User updated successfully");
        } else {
          result = await createUser(payload).unwrap();
          toast.success("User created successfully");
        }

        // Call success callback
        if (onSuccess) {
          onSuccess(result.data);
        }

        // Close dialog
        onClose();
      } catch (error) {
        console.error("User form error:", error);
        handleApiError(error);
      }
    },
    [isEditMode, isCurrentHOD, user, createUser, updateUser, onSuccess, onClose]
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
   * Add skill
   */
  const handleAddSkill = useCallback(() => {
    if (fields.length >= LIMITS.MAX_SKILLS) {
      toast.error(`Maximum ${LIMITS.MAX_SKILLS} skills allowed`);
      return;
    }
    append({ skill: "", percentage: 0 });
  }, [fields.length, append]);

  /**
   * Remove skill
   */
  const handleRemoveSkill = useCallback(
    (index) => {
      remove(index);
    },
    [remove]
  );

  return (
    <MuiDialog
      open={open}
      onClose={handleClose}
      title={isEditMode ? "Edit User" : "Create User"}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      actions={
        <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
          <Button onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            startIcon={
              isSubmitting ? <CircularProgress size={20} /> : undefined
            }
          >
            {isSubmitting
              ? isEditMode
                ? "Updating..."
                : "Creating..."
              : isEditMode
              ? "Update User"
              : "Create User"}
          </Button>
        </Box>
      }
    >
      <Box component="form" noValidate>
        {/* HOD Warning */}
        {isEditMode && isCurrentHOD && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            This user is the Head of Department. Role and department changes are
            restricted. Please assign a new HOD first.
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Profile Picture */}
          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <MuiAvatar
                src={profilePicturePreview}
                alt="User Profile"
                sx={{ width: 100, height: 100 }}
              />
              <Box>
                <Button
                  variant="outlined"
                  startIcon={<CloudUploadIcon />}
                  onClick={handleImageUpload}
                  disabled={isUploadingImage || isSubmitting}
                >
                  {isUploadingImage ? "Uploading..." : "Upload Picture"}
                </Button>
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Max 10MB. Formats: JPG, PNG, GIF, WebP, SVG
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* First Name */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="firstName"
              control={control}
              rules={{
                required: "First name is required",
                maxLength: {
                  value: LIMITS.FIRST_NAME_MAX,
                  message: `First name cannot exceed ${LIMITS.FIRST_NAME_MAX} characters`,
                },
              }}
              render={({ field }) => (
                <MuiTextField
                  {...field}
                  label="First Name"
                  required
                  error={!!errors.firstName}
                  helperText={errors.firstName?.message}
                  disabled={isSubmitting}
                  inputProps={{ maxLength: LIMITS.FIRST_NAME_MAX }}
                />
              )}
            />
          </Grid>

          {/* Last Name */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="lastName"
              control={control}
              rules={{
                required: "Last name is required",
                maxLength: {
                  value: LIMITS.LAST_NAME_MAX,
                  message: `Last name cannot exceed ${LIMITS.LAST_NAME_MAX} characters`,
                },
              }}
              render={({ field }) => (
                <MuiTextField
                  {...field}
                  label="Last Name"
                  required
                  error={!!errors.lastName}
                  helperText={errors.lastName?.message}
                  disabled={isSubmitting}
                  inputProps={{ maxLength: LIMITS.LAST_NAME_MAX }}
                />
              )}
            />
          </Grid>

          {/* Email */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="email"
              control={control}
              rules={{
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email format",
                },
                maxLength: {
                  value: LIMITS.EMAIL_MAX,
                  message: `Email cannot exceed ${LIMITS.EMAIL_MAX} characters`,
                },
              }}
              render={({ field }) => (
                <MuiTextField
                  {...field}
                  label="Email"
                  type="email"
                  required
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  disabled={isSubmitting}
                  inputProps={{ maxLength: LIMITS.EMAIL_MAX }}
                />
              )}
            />
          </Grid>

          {/* Password (Create mode only) */}
          {!isEditMode && (
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="password"
                control={control}
                rules={{
                  required: "Password is required",
                  minLength: {
                    value: LIMITS.PASSWORD_MIN,
                    message: `Password must be at least ${LIMITS.PASSWORD_MIN} characters`,
                  },
                  pattern: {
                    value:
                      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                    message:
                      "Password must contain uppercase, lowercase, number, and special character",
                  },
                }}
                render={({ field }) => (
                  <Box>
                    <MuiTextField
                      {...field}
                      onChange={(e) => handlePasswordChange(e, field)}
                      label="Password"
                      type="password"
                      required
                      error={!!errors.password}
                      helperText={errors.password?.message}
                      disabled={isSubmitting}
                    />
                    {passwordStrength.strength > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          <LinearProgress
                            variant="determinate"
                            value={passwordStrength.strength}
                            color={passwordStrength.color}
                            sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                          />
                          <Typography
                            variant="caption"
                            color={`${passwordStrength.color}.main`}
                          >
                            {passwordStrength.label}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </Box>
                )}
              />
            </Grid>
          )}

          {/* Employee ID */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="employeeId"
              control={control}
              rules={{
                pattern: {
                  value: /^(?!0000)\d{4}$/,
                  message: "Employee ID must be 4 digits (0001-9999)",
                },
              }}
              render={({ field }) => (
                <MuiTextField
                  {...field}
                  label="Employee ID"
                  placeholder="0001-9999"
                  error={!!errors.employeeId}
                  helperText={errors.employeeId?.message}
                  disabled={isSubmitting}
                  inputProps={{ maxLength: 4 }}
                />
              )}
            />
          </Grid>

          {/* Date of Birth */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="dateOfBirth"
              control={control}
              rules={{
                validate: (value) => {
                  if (value && new Date(value) > new Date()) {
                    return "Date of birth cannot be in the future";
                  }
                  return true;
                },
              }}
              render={({ field }) => (
                <MuiDatePicker
                  {...field}
                  label="Date of Birth"
                  maxDate={new Date()}
                  error={!!errors.dateOfBirth}
                  helperText={errors.dateOfBirth?.message}
                  disabled={isSubmitting}
                />
              )}
            />
          </Grid>

          {/* Joined At */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="joinedAt"
              control={control}
              rules={{
                required: "Joined date is required",
                validate: (value) => {
                  if (value && new Date(value) > new Date()) {
                    return "Joined date cannot be in the future";
                  }
                  return true;
                },
              }}
              render={({ field }) => (
                <MuiDatePicker
                  {...field}
                  label="Joined At"
                  required
                  maxDate={new Date()}
                  error={!!errors.joinedAt}
                  helperText={errors.joinedAt?.message}
                  disabled={isSubmitting}
                />
              )}
            />
          </Grid>

          {/* Position */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="position"
              control={control}
              rules={{
                maxLength: {
                  value: LIMITS.POSITION_MAX,
                  message: `Position cannot exceed ${LIMITS.POSITION_MAX} characters`,
                },
              }}
              render={({ field }) => (
                <MuiTextField
                  {...field}
                  label="Position"
                  error={!!errors.position}
                  helperText={errors.position?.message}
                  disabled={isSubmitting}
                  inputProps={{ maxLength: LIMITS.POSITION_MAX }}
                />
              )}
            />
          </Grid>

          {/* Role */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="role"
              control={control}
              rules={{ required: "Role is required" }}
              render={({ field }) => (
                <MuiSelectAutocomplete
                  {...field}
                  label="Role"
                  options={ROLE_OPTIONS}
                  required
                  error={!!errors.role}
                  helperText={errors.role?.message}
                  disabled={isSubmitting || (isEditMode && isCurrentHOD)}
                />
              )}
            />
          </Grid>

          {/* Department */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="departmentId"
              control={control}
              rules={{ required: "Department is required" }}
              render={({ field }) => (
                <MuiSelectAutocomplete
                  {...field}
                  label="Department"
                  options={departmentOptions}
                  required
                  loading={isLoadingDepartments}
                  error={!!errors.departmentId}
                  helperText={errors.departmentId?.message}
                  disabled={isSubmitting || (isEditMode && isCurrentHOD)}
                />
              )}
            />
          </Grid>

          {/* Skills Section */}
          <Grid size={{ xs: 12 }}>
            <Divider sx={{ my: 2 }} />
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6">Skills</Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddSkill}
                disabled={isSubmitting || fields.length >= LIMITS.MAX_SKILLS}
                size="small"
              >
                Add Skill
              </Button>
            </Box>

            {fields.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No skills added yet. Click "Add Skill" to add skills.
              </Typography>
            )}

            {fields.map((field, index) => (
              <Grid container spacing={2} key={field.id} sx={{ mb: 2 }}>
                <Grid size={{ xs: 12, sm: 7 }}>
                  <Controller
                    name={`skills.${index}.skill`}
                    control={control}
                    rules={{
                      required: "Skill name is required",
                      maxLength: {
                        value: LIMITS.SKILL_MAX,
                        message: `Skill cannot exceed ${LIMITS.SKILL_MAX} characters`,
                      },
                    }}
                    render={({ field }) => (
                      <MuiTextField
                        {...field}
                        label="Skill Name"
                        required
                        error={!!errors.skills?.[index]?.skill}
                        helperText={errors.skills?.[index]?.skill?.message}
                        disabled={isSubmitting}
                        inputProps={{ maxLength: LIMITS.SKILL_MAX }}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 10, sm: 4 }}>
                  <Controller
                    name={`skills.${index}.percentage`}
                    control={control}
                    rules={{
                      required: "Percentage is required",
                      min: {
                        value: 0,
                        message: "Percentage must be at least 0",
                      },
                      max: {
                        value: 100,
                        message: "Percentage cannot exceed 100",
                      },
                    }}
                    render={({ field }) => (
                      <MuiNumberField
                        {...field}
                        label="Percentage"
                        required
                        min={0}
                        max={100}
                        error={!!errors.skills?.[index]?.percentage}
                        helperText={errors.skills?.[index]?.percentage?.message}
                        disabled={isSubmitting}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 2, sm: 1 }}>
                  <IconButton
                    onClick={() => handleRemoveSkill(index)}
                    disabled={isSubmitting}
                    color="error"
                    sx={{ mt: 1 }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Grid>
              </Grid>
            ))}
          </Grid>

          {/* Email Preferences Section */}
          <Grid size={{ xs: 12 }}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" sx={{ mb: 2 }}>
              Email Preferences
            </Typography>

            <FormGroup>
              <Controller
                name="emailPreferences.enabled"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        {...field}
                        checked={field.value}
                        disabled={isSubmitting}
                      />
                    }
                    label="Enable Email Notifications"
                  />
                )}
              />
              <Controller
                name="emailPreferences.taskNotifications"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        {...field}
                        checked={field.value}
                        disabled={isSubmitting}
                      />
                    }
                    label="Task Notifications"
                  />
                )}
              />
              <Controller
                name="emailPreferences.taskReminders"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        {...field}
                        checked={field.value}
                        disabled={isSubmitting}
                      />
                    }
                    label="Task Reminders"
                  />
                )}
              />
              <Controller
                name="emailPreferences.mentions"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        {...field}
                        checked={field.value}
                        disabled={isSubmitting}
                      />
                    }
                    label="Mentions"
                  />
                )}
              />
              <Controller
                name="emailPreferences.announcements"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        {...field}
                        checked={field.value}
                        disabled={isSubmitting}
                      />
                    }
                    label="Announcements"
                  />
                )}
              />
              <Controller
                name="emailPreferences.welcomeEmails"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        {...field}
                        checked={field.value}
                        disabled={isSubmitting}
                      />
                    }
                    label="Welcome Emails"
                  />
                )}
              />
              <Controller
                name="emailPreferences.passwordReset"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        {...field}
                        checked={field.value}
                        disabled={isSubmitting}
                      />
                    }
                    label="Password Reset"
                  />
                )}
              />
            </FormGroup>
          </Grid>
        </Grid>
      </Box>
    </MuiDialog>
  );
};

export default UserForm;
