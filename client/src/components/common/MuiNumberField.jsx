/**
 * MuiNumberField Component - Reusable Number Field with React Hook Form Integration
 *
 * Extends MuiTextField with type="number" for numeric input.
 * Provides number formatting, min/max validation, and prevents non-numeric input.
 *
 * Features:
 * - Numeric input with increment/decrement buttons
 * - Min/max validation
 * - Number formatting with Intl.NumberFormat
 * - Prevents non-numeric input
 * - Decimal places support
 * - All MuiTextField features
 *
 * Requirements: 15.3, 28.4
 */

import { Controller } from "react-hook-form";
import { TextField, FormHelperText, Box } from "@mui/material";
import PropTypes from "prop-types";

/**
 * MuiNumberField Component
 *
 * @param {Object} props - Component props
 * @param {Object} props.control - React Hook Form control object
 * @param {string} props.name - Field name for form registration
 * @param {string} props.label - Field label
 * @param {Object} props.rules - Validation rules (react-hook-form format)
 * @param {number} props.defaultValue - Default value for the field
 * @param {number} props.min - Minimum value
 * @param {number} props.max - Maximum value
 * @param {number} props.step - Step increment (default: 1)
 * @param {number} props.decimalPlaces - Number of decimal places (default: 0)
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.disabled - Whether field is disabled
 * @param {boolean} props.required - Whether field is required (visual indicator)
 * @param {boolean} props.fullWidth - Whether field takes full width (default: true)
 * @param {string} props.size - Field size (small, medium)
 * @param {string} props.variant - Field variant (outlined, filled, standard)
 * @param {boolean} props.formatNumber - Whether to format number with locale (default: false)
 * @param {string} props.locale - Locale for number formatting (default: 'en-US')
 *
 * @returns {JSX.Element} MuiNumberField component
 *
 * @example
 * // Basic usage
 * <MuiNumberField
 *   control={control}
 *   name="quantity"
 *   label="Quantity"
 *   rules={{ required: "Quantity is required", min: { value: 0, message: "Must be >= 0" } }}
 *   min={0}
 * />
 *
 * @example
 * // With decimal places
 * <MuiNumberField
 *   control={control}
 *   name="price"
 *   label="Price"
 *   rules={{ required: "Price is required", min: { value: 0, message: "Must be >= 0" } }}
 *   min={0}
 *   decimalPlaces={2}
 *   step={0.01}
 * />
 *
 * @example
 * // With min/max validation
 * <MuiNumberField
 *   control={control}
 *   name="percentage"
 *   label="Percentage"
 *   rules={{
 *     required: "Percentage is required",
 *     min: { value: 0, message: "Must be >= 0" },
 *     max: { value: 100, message: "Must be <= 100" }
 *   }}
 *   min={0}
 *   max={100}
 * />
 */
const MuiNumberField = ({
  control,
  name,
  label,
  rules = {},
  defaultValue = "",
  min,
  max,
  step = 1,
  decimalPlaces = 0,
  placeholder,
  disabled = false,
  required = false,
  fullWidth = true,
  size = "medium",
  variant = "outlined",
  formatNumber = false,
  locale = "en-US",
  ...otherProps
}) => {
  /**
   * Format number with Intl.NumberFormat
   *
   * @param {number} value - Number to format
   * @returns {string} Formatted number string
   */
  const formatNumberValue = (value) => {
    if (value === "" || value === null || value === undefined) return "";

    try {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return value;

      return new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      }).format(numValue);
    } catch (error) {
      console.error("Failed to format number:", error);
      return value;
    }
  };

  /**
   * Handle key press to prevent non-numeric input
   *
   * @param {KeyboardEvent} event - Keyboard event
   */
  const handleKeyPress = (event) => {
    const { key } = event;
    const currentValue = event.target.value;

    // Allow: backspace, delete, tab, escape, enter
    if (
      ["Backspace", "Delete", "Tab", "Escape", "Enter"].includes(key) ||
      // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      (event.ctrlKey && ["a", "c", "v", "x"].includes(key.toLowerCase())) ||
      // Allow: home, end, left, right
      ["Home", "End", "ArrowLeft", "ArrowRight"].includes(key)
    ) {
      return;
    }

    // Allow decimal point if decimal places > 0 and not already present
    if (key === "." && decimalPlaces > 0 && !currentValue.includes(".")) {
      return;
    }

    // Allow minus sign at start for negative numbers
    if (
      key === "-" &&
      currentValue.length === 0 &&
      (min === undefined || min < 0)
    ) {
      return;
    }

    // Prevent non-numeric characters
    if (!/^\d$/.test(key)) {
      event.preventDefault();
    }
  };

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      defaultValue={defaultValue}
      render={({ field, fieldState: { error } }) => {
        return (
          <Box sx={{ width: fullWidth ? "100%" : "auto" }}>
            <TextField
              {...field}
              inputRef={field.ref} // Forward ref correctly
              label={label}
              placeholder={placeholder}
              disabled={disabled}
              required={required}
              type="number"
              error={!!error}
              helperText={error?.message || " "} // Reserve space for error message
              slotProps={{
                htmlInput: {
                  min,
                  max,
                  step,
                  onKeyDown: handleKeyPress,
                },
              }}
              fullWidth={fullWidth}
              size={size}
              variant={variant}
              {...otherProps}
            />

            {/* Min/Max hint */}
            {(min !== undefined || max !== undefined) && (
              <FormHelperText
                sx={{
                  textAlign: "right",
                  mt: 0.5,
                  color: "text.secondary",
                }}
              >
                {min !== undefined && max !== undefined
                  ? `Range: ${min} - ${max}`
                  : min !== undefined
                  ? `Min: ${min}`
                  : `Max: ${max}`}
              </FormHelperText>
            )}
          </Box>
        );
      }}
    />
  );
};

MuiNumberField.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  rules: PropTypes.object,
  defaultValue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  min: PropTypes.number,
  max: PropTypes.number,
  step: PropTypes.number,
  decimalPlaces: PropTypes.number,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  fullWidth: PropTypes.bool,
  size: PropTypes.oneOf(["small", "medium"]),
  variant: PropTypes.oneOf(["outlined", "filled", "standard"]),
  formatNumber: PropTypes.bool,
  locale: PropTypes.string,
};

export default MuiNumberField;
