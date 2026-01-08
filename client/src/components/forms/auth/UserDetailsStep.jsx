import { useState } from "react";
import { useFormContext, Controller } from "react-hook-form";
import Grid from "@mui/material/Grid";
import { MuiTextField, MuiDatePicker } from "../../common";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import WorkIcon from "@mui/icons-material/Work";
import DepartmentIcon from "@mui/icons-material/AccountTree";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { IconButton } from "@mui/material";
import { LIMITS } from "../../../utils/constants.js";

const UserDetailsStep = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const {
    register,
    formState: { errors },
    getValues,
    control,
  } = useFormContext();

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleClickShowConfirmPassword = () =>
    setShowConfirmPassword((show) => !show);
  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <MuiTextField
          {...register("firstName", {
            required: "First name is required",
            minLength: { value: 2, message: "Minimum 2 characters" },
            maxLength: {
              value: LIMITS.FIRST_NAME_MAX,
              message: `Maximum ${LIMITS.FIRST_NAME_MAX} characters`,
            },
          })}
          error={errors.firstName}
          label="First Name"
          placeholder="e.g. John"
          fullWidth
          size="small"
          startAdornment={<PersonIcon fontSize="small" color="primary" />}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <MuiTextField
          {...register("lastName", {
            required: "Last name is required",
            minLength: { value: 2, message: "Minimum 2 characters" },
            maxLength: {
              value: LIMITS.LAST_NAME_MAX,
              message: `Maximum ${LIMITS.LAST_NAME_MAX} characters`,
            },
          })}
          error={errors.lastName}
          label="Last Name"
          placeholder="e.g. Doe"
          fullWidth
          size="small"
          startAdornment={<PersonIcon fontSize="small" color="primary" />}
        />
      </Grid>

      <Grid size={{ xs: 12 }}>
        <MuiTextField
          {...register("userEmail", {
            required: "Email is required",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Invalid email address",
            },
            validate: (value) => {
              const orgEmail = getValues("organizationEmail");
              if (
                value &&
                orgEmail &&
                value.toLowerCase() === orgEmail.toLowerCase()
              ) {
                return "User email cannot be the same as organization email";
              }
              return true;
            },
          })}
          error={errors.userEmail}
          label="Email Address"
          placeholder="e.g. john.doe@example.com"
          type="email"
          fullWidth
          size="small"
          autoComplete="email"
          startAdornment={<EmailIcon fontSize="small" color="primary" />}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <MuiTextField
          {...register("password", {
            required: "Password is required",
            minLength: {
              value: LIMITS.PASSWORD_MIN,
              message: `Minimum ${LIMITS.PASSWORD_MIN} characters`,
            },
            ...(import.meta.env.PROD && {
              pattern: {
                value:
                  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                message:
                  "Password must contain uppercase, lowercase, number and special character",
              },
            }),
          })}
          error={errors.password}
          label="Password"
          placeholder="Enter a strong password"
          type={showPassword ? "text" : "password"}
          fullWidth
          size="small"
          startAdornment={<LockIcon fontSize="small" color="primary" />}
          endAdornment={
            <IconButton
              aria-label="toggle password visibility"
              onClick={handleClickShowPassword}
              onMouseDown={handleMouseDownPassword}
              edge="end"
              size="small"
            >
              {showPassword ? (
                <VisibilityOff fontSize="small" />
              ) : (
                <Visibility fontSize="small" />
              )}
            </IconButton>
          }
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <MuiTextField
          {...register("confirmPassword", {
            required: "Please confirm your password",
            validate: (value) => {
              const password = getValues("password");
              return value === password || "Passwords do not match";
            },
          })}
          error={errors.confirmPassword}
          label="Confirm Password"
          placeholder="Repeat your password"
          type={showConfirmPassword ? "text" : "password"}
          fullWidth
          size="small"
          startAdornment={<LockIcon fontSize="small" color="primary" />}
          endAdornment={
            <IconButton
              aria-label="toggle confirm password visibility"
              onClick={handleClickShowConfirmPassword}
              onMouseDown={handleMouseDownPassword}
              edge="end"
              size="small"
            >
              {showConfirmPassword ? (
                <VisibilityOff fontSize="small" />
              ) : (
                <Visibility fontSize="small" />
              )}
            </IconButton>
          }
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <MuiTextField
          {...register("employeeId", {
            pattern: {
              value: /^(?!0000)\d{4}$/,
              message: "Must be 4 digits (0001-9999)",
            },
          })}
          error={errors.employeeId}
          label="Employee ID (Optional)"
          fullWidth
          size="small"
          placeholder="e.g. 1234"
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <Controller
          name="dateOfBirth"
          control={control}
          render={({ field: { onChange, value, onBlur, name }, fieldState: { error } }) => (
            <MuiDatePicker
              name={name}
              value={value}
              onChange={onChange}
              onBlur={onBlur}
              error={error}
              label="Date of Birth (Optional)"
              placeholder="Select your birth date"
              fullWidth
              size="small"
              disableFuture
            />
          )}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <MuiTextField
          {...register("position", {
            required: "Position is required",
            minLength: { value: 2, message: "Minimum 2 characters" },
            maxLength: {
              value: LIMITS.POSITION_MAX,
              message: `Maximum ${LIMITS.POSITION_MAX} characters`,
            },
          })}
          error={errors.position}
          label="Position"
          placeholder="e.g. Software Engineer"
          fullWidth
          size="small"
          startAdornment={<WorkIcon fontSize="small" color="primary" />}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <MuiTextField
          {...register("departmentName", {
            required: "Department name is required",
            minLength: { value: 2, message: "Minimum 2 characters" },
            maxLength: {
              value: LIMITS.DEPARTMENT_NAME_MAX,
              message: `Maximum ${LIMITS.DEPARTMENT_NAME_MAX} characters`,
            },
          })}
          error={errors.departmentName}
          label="Department Name"
          placeholder="e.g. IT, Marketing, Sales"
          fullWidth
          size="small"
          startAdornment={<DepartmentIcon fontSize="small" color="primary" />}
        />
      </Grid>

      <Grid size={{ xs: 12 }}>
        <MuiTextField
          {...register("departmentDesc", {
            required: "Department description is required",
            maxLength: {
              value: LIMITS.DESCRIPTION_MAX,
              message: `Maximum ${LIMITS.DESCRIPTION_MAX} characters`,
            },
          })}
          error={errors.departmentDesc}
          label="Department Description"
          placeholder="Briefly describe the department's role and responsibilities"
          fullWidth
          size="small"
          multiline
          rows={3}
        />
      </Grid>
    </Grid>
  );
};

export default UserDetailsStep;

