/**
 * MuiRadioGroup Component - Reusable Radio Group with React Hook Form Integration
 *
 * Uses forwardRef for integration.
 * Designed to be a pure controlled component.
 *
 * Features:
 * - Radio group with multiple options
 * - Proper ref forwarding with forwardRef
 * - Error and helperText display
 * - Theme styling applied
 * - Memoized options for performance
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
 */
const MuiRadioGroup = forwardRef(
  (
    {
      name,
      value,
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
          value={value || ""} // Ensure controlled value
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
