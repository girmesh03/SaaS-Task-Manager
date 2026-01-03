/**
 * MuiSlider Component - Reusable Slider with React Hook Form Integration
 *
 * Uses forwardRef for optimal performance with spread register pattern.
 * Provides consistent styling and error handling.
 *
 * Features:
 * - Slider with value display
 * - Proper ref forwarding with forwardRef
 * - Error and helperText display
 * - Min/max/step support
 * - Theme styling applied
 * - Memoized value display
 * - NEVER uses watch() method
 *
 * Requirements: 28.1, 31.10, 32.10
 */

import { forwardRef, useMemo } from "react";
import {
  FormControl,
  FormLabel,
  Slider,
  FormHelperText,
  Box,
  Typography,
} from "@mui/material";

/**
 * MuiSlider Component
 *
 * @example
 * // Basic usage with spread register
 * const { register, watch, setValue } = useForm();
 * const sliderValue = watch("percentage", 0);
 *
 * <MuiSlider
 *   {...register("percentage", {
 *     required: "Percentage is required",
 *     min: { value: 0, message: "Must be >= 0" },
 *     max: { value: 100, message: "Must be <= 100" }
 *   })}
 *   error={errors.percentage}
 *   helperText="Skill proficiency level"
 *   label="Skill Percentage"
 *   value={sliderValue}
 *   onChange={(e, newValue) => setValue("percentage", newValue)}
 *   min={0}
 *   max={100}
 * />
 */
const MuiSlider = forwardRef(
  (
    {
      name,
      onChange,
      onBlur,
      error,
      helperText,
      label,
      value = 0,
      min = 0,
      max = 100,
      step = 1,
      marks,
      disabled = false,
      required = false,
      valueLabelDisplay = "auto",
      valueLabelFormat,
      color = "primary",
      size = "medium",
      showValue = true,
      ...muiProps
    },
    ref
  ) => {
    // Memoize value display
    const displayValue = useMemo(() => {
      if (!showValue) return null;
      return valueLabelFormat ? valueLabelFormat(value) : value;
    }, [showValue, value, valueLabelFormat]);

    return (
      <FormControl
        fullWidth
        error={!!error}
        required={required}
        disabled={disabled}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
          <FormLabel>{label}</FormLabel>
          {showValue && (
            <Typography variant="body2" color="text.secondary">
              {displayValue}
            </Typography>
          )}
        </Box>

        {/* Hidden input for react-hook-form registration */}
        <input
          name={name}
          onBlur={onBlur}
          ref={ref}
          type="hidden"
          value={value}
        />

        <Slider
          value={value || 0}
          onChange={onChange}
          min={min}
          max={max}
          step={step}
          marks={marks}
          disabled={disabled}
          valueLabelDisplay={valueLabelDisplay}
          valueLabelFormat={valueLabelFormat}
          color={color}
          size={size}
          {...muiProps}
        />
        {(error || helperText) && (
          <FormHelperText>{error?.message || helperText}</FormHelperText>
        )}
      </FormControl>
    );
  }
);

MuiSlider.displayName = "MuiSlider";

export default MuiSlider;
