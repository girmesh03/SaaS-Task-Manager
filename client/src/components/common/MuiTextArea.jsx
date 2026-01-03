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

import { forwardRef, useMemo, useState, useEffect } from "react";
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
    // Local state for character count to avoid parent re-renders (lag fix)
    // If value is provided (controlled), use it. Otherwise default to empty string.
    const [internalValue, setInternalValue] = useState(value || "");

    // Sync internal value if controlled value changes
    useEffect(() => {
      if (value !== undefined) {
        setInternalValue(value);
      }
    }, [value]);

    const handleLocalChange = (event) => {
      // Update local state for character counter
      setInternalValue(event.target.value);

      // Propagate change to parent (register or other handler)
      if (onChange) {
        onChange(event);
      }
    };

    // Memoize character counter display
    const characterCounter = useMemo(() => {
      const currentLength = internalValue?.length || 0;
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
    }, [internalValue, maxLength]);

    return (
      <Box sx={{ width: fullWidth ? "100%" : "auto" }}>
        <TextField
          name={name}
          value={value} // Pass controlled value if exists, otherwise undefined (uncontrolled)
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

        {/* Character Counter */}
        {characterCounter}
      </Box>
    );
  }
);

MuiTextArea.displayName = "MuiTextArea";

export default MuiTextArea;
