/**
 * MuiRadioGroup Component - Reusable Radio Group with React Hook Form Integration
 *
 * Uses forwardRef for optimal performance with spread register pattern.
 * Provides consistent styling and error handling.
 *
 * Features:
 * - Radio group with multiple options
 * - Proper ref forwarding with forwardRef
 * - Error and helperText display
 * - Theme styling applied
 * - Memoized options for performance
 * - NEVER uses watch() method
 *
 * Requirements: 28.1, 31.10, 32.10
 */

import { forwardRef, useMemo } from "react";
import {
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormHelperText,
} from "@mui/material";

/**
 * MuiRadioGroup Component
 *
 * @example
 * // Basic usage with spread register
 * <MuiRadioGroup
 *   {...register("priority", { required: "Priority is required" })}
 *   error={errors.priority}
 *   helperText="Select task priority"
 *   label="Priority"
 *   options={[
 *     { label: "Low", value: "Low" },
 *     { label: "Medium", value: "Medium" },
 *     { label: "High", value: "High" },
 *     { label: "Urgent", value: "Urgent" }
 *   ]}
 *   row
 * />
 */
const MuiRadioGroup = forwardRef(
  (
    {
      name,
      onChange,
      onBlur,
      error,
      helperText,
      label,
      options = [],
      disabled = false,
      required = false,
      row = false,
      size = "medium",
      color = "primary",
      ...muiProps
    },
    ref
  ) => {
    // Memoize rendered options for performance
    const renderedOptions = useMemo(() => {
      return options.map((option) => (
        <FormControlLabel
          key={option.value}
          value={option.value}
          control={<Radio size={size} color={color} />}
          label={option.label}
          disabled={option.disabled || disabled}
        />
      ));
    }, [options, size, color, disabled]);

    return (
      <FormControl error={!!error} required={required} disabled={disabled}>
        <FormLabel>{label}</FormLabel>
        <RadioGroup
          name={name}
          onChange={onChange}
          onBlur={onBlur}
          ref={ref}
          row={row}
          {...muiProps}
        >
          {renderedOptions}
        </RadioGroup>
        {(error || helperText) && (
          <FormHelperText>{error?.message || helperText}</FormHelperText>
        )}
      </FormControl>
    );
  }
);

MuiRadioGroup.displayName = "MuiRadioGroup";

export default MuiRadioGroup;
