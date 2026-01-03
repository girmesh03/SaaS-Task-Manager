/**
 * MuiSwitch Component - Reusable Switch with React Hook Form Integration
 *
 * Uses forwardRef for optimal performance with spread register pattern.
 * Provides consistent styling and error handling.
 *
 * Features:
 * - Switch with label
 * - Proper ref forwarding with forwardRef
 * - Error and helperText display
 * - Theme styling applied
 * - NEVER uses watch() method
 *
 * Requirements: 28.1, 31.10, 32.10
 */

import { forwardRef } from "react";
import { FormControlLabel, Switch, FormHelperText, Box } from "@mui/material";

/**
 * MuiSwitch Component
 *
 * @example
 * // Basic usage with spread register
 * <MuiSwitch
 *   {...register("emailNotifications")}
 *   error={errors.emailNotifications}
 *   helperText="Receive email updates"
 *   label="Email Notifications"
 * />
 */
const MuiSwitch = forwardRef(
  (
    {
      name,
      onChange,
      onBlur,
      error,
      helperText,
      label,
      disabled = false,
      size = "medium",
      color = "primary",
      labelPlacement = "end",
      ...muiProps
    },
    ref
  ) => {
    return (
      <Box>
        <FormControlLabel
          control={
            <Switch
              name={name}
              onChange={onChange}
              onBlur={onBlur}
              inputRef={ref}
              disabled={disabled}
              size={size}
              color={color}
              {...muiProps}
            />
          }
          label={label}
          labelPlacement={labelPlacement}
        />
        {(error || helperText) && (
          <FormHelperText error={!!error} sx={{ ml: 2 }}>
            {error?.message || helperText}
          </FormHelperText>
        )}
      </Box>
    );
  }
);

MuiSwitch.displayName = "MuiSwitch";

export default MuiSwitch;
