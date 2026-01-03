/**
 * MuiTextArea Component - Reusable Text Area with React Hook Form Integration
 *
 * Multiline text field with character counter support.
 * Uses forwardRef for optimal performance with spread register pattern.
 * Maintains internal state for character counting to prevent parent re-renders (lag).
 *
 * Features:
 * - Multiline text input with auto-resize
 * - Character counter display (optimized)
 * - Configurable rows and maxRows
 * - All MuiTextField features
 *
 * Requirements: 15.2, 28.3
 */

import { forwardRef, useMemo, useState, useCallback } from "react";
import { TextField, FormHelperText, Box } from "@mui/material";

/**
 * MuiTextArea Component
 *
 * @example
 * // Basic usage with spread register (Uncontrolled - High Performance)
 * <MuiTextArea
 *   {...register("description", {
 *     required: "Description is required",
 *     maxLength: { value: 2000, message: "Max 2000 characters" }
 *   })}
 *   error={errors.description}
 *   label="Description"
 *   maxLength={2000}
 *   rows={4}
 * />
 */
const MuiTextArea = forwardRef(
  (
    {
      name,
      onChange,
      onBlur,
      error,
      helperText,
      label,
      value, // Optional: for controlled mode
      defaultValue, // Optional: for uncontrolled mode default
      maxLength,
      placeholder,
      disabled = false,
      required = false,
      fullWidth = true,
      size = "medium",
      variant = "outlined",
      margin,
      rows = 4,
      maxRows,
      minRows,
      ...muiProps
    },
    ref
  ) => {
    // Local state for character count in uncontrolled mode
    const [internalValue, setInternalValue] = useState(defaultValue || "");

    const handleLocalChange = useCallback((event) => {
      // Update local state for character counter
      setInternalValue(event.target.value);

      // Propagate change to parent (register or other handler)
      if (onChange) {
        onChange(event);
      }
    }, [onChange]);

    // Memoize character counter display
    const characterCounter = useMemo(() => {
      // If controlled (value provided), use it. Otherwise use internal state.
      // Note: In controlled mode, if parent updates are slow, counter will lag.
      // In uncontrolled mode (register), this is fast.
      const currentLength = (value !== undefined ? value : internalValue)?.length || 0;
      const showCounter = maxLength && maxLength > 0;

      if (!showCounter) return null;

      return (
        <FormHelperText
          sx={{
            textAlign: "right",
            mt: 0.5,
            color:
              currentLength > maxLength
                ? "error.main"
                : currentLength > maxLength * 0.9
                ? "warning.main"
                : "text.secondary",
          }}
        >
          {currentLength} / {maxLength}
        </FormHelperText>
      );
    }, [internalValue, value, maxLength]);

    // Memoize the TextField to avoid re-renders when only charCount changes
    // This fixes the lagging issue with multiline TextFields
    const memoizedTextField = useMemo(() => {
      return (
        <TextField
          name={name}
          value={value} // Pass controlled value if exists (otherwise undefined for uncontrolled)
          defaultValue={defaultValue} // Pass default value for uncontrolled mode
          onChange={handleLocalChange}
          onBlur={onBlur}
          inputRef={ref}
          label={label}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          error={!!error}
          helperText={error?.message || helperText || " "}
          fullWidth={fullWidth}
          size={size}
          variant={variant}
          margin={margin}
          multiline
          rows={rows}
          maxRows={maxRows}
          minRows={minRows}
          slotProps={{
            htmlInput: {
              maxLength: maxLength,
            },
          }}
          {...muiProps}
        />
      );
    }, [
      name,
      value,
      handleLocalChange,
      onBlur,
      ref,
      label,
      placeholder,
      disabled,
      required,
      error,
      helperText,
      fullWidth,
      size,
      variant,
      margin,
      rows,
      maxRows,
      minRows,
      maxLength,
      defaultValue,
      muiProps,
    ]);

    return (
      <Box sx={{ width: fullWidth ? "100%" : "auto" }}>
        {memoizedTextField}
        {characterCounter}
      </Box>
    );
  }
);

MuiTextArea.displayName = "MuiTextArea";

export default MuiTextArea;
