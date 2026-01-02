/**
 * MuiTextField Component - Reusable Text Field with React Hook Form Integration
 *
 * Wraps MUI TextField with Controller from react-hook-form.
 * Provides consistent styling, error handling, and character counter.
 *
 * Features:
 * - Automatic error message display from validation
 * - Character counter if maxLength provided in rules
 * - Proper ref forwarding for react-hook-form
 * - Theme styling applied
 * - Accessibility compliant
 *
 * Requirements: 15.1, 28.2, 32.1, 32.2, 32.3
 */

import { Controller } from "react-hook-form";
import { TextField, FormHelperText, Box } from "@mui/material";
import PropTypes from "prop-types";

/**
 * MuiTextField Component
 *
 * @param {Object} props - Component props
 * @param {Object} props.control - React Hook Form control object
 * @param {string} props.name - Field name for form registration
 * @param {string} props.label - Field label
 * @param {Object} props.rules - Validation rules (react-hook-form format)
 * @param {any} props.defaultValue - Default value for the field
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.disabled - Whether field is disabled
 * @param {boolean} props.required - Whether field is required (visual indicator)
 * @param {string} props.type - Input type (text, email, password, etc.)
 * @param {Object} props.InputProps - Additional props for Input component
 * @param {Object} props.inputProps - Additional props for input element
 * @param {boolean} props.fullWidth - Whether field takes full width (default: true)
 * @param {string} props.size - Field size (small, medium)
 * @param {string} props.variant - Field variant (outlined, filled, standard)
 * @param {boolean} props.autoFocus - Whether field should auto-focus
 * @param {boolean} props.autoComplete - Autocomplete attribute
 * @param {number} props.maxRows - Maximum rows for multiline
 * @param {number} props.minRows - Minimum rows for multiline
 * @param {boolean} props.multiline - Whether field is multiline
 *
 * @returns {JSX.Element} MuiTextField component
 *
 * @example
 * // Basic usage
 * <MuiTextField
 *   control={control}
 *   name="firstName"
 *   label="First Name"
 *   rules={{ required: "First name is required", maxLength: { value: 20, message: "Max 20 characters" } }}
 * />
 *
 * @example
 * // With character counter
 * <MuiTextField
 *   control={control}
 *   name="description"
 *   label="Description"
 *   rules={{ maxLength: { value: 2000, message: "Max 2000 characters" } }}
 *   multiline
 *   rows={4}
 * />
 *
 * @example
 * // Email field
 * <MuiTextField
 *   control={control}
 *   name="email"
 *   label="Email"
 *   type="email"
 *   rules={{
 *     required: "Email is required",
 *     pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email" }
 *   }}
 * />
 */
const MuiTextField = ({
  control,
  name,
  label,
  rules = {},
  defaultValue = "",
  placeholder,
  disabled = false,
  required = false,
  type = "text",
  InputProps,
  inputProps,
  fullWidth = true,
  size = "medium",
  variant = "outlined",
  autoFocus = false,
  autoComplete,
  maxRows,
  minRows,
  multiline = false,
  ...otherProps
}) => {
  // Extract maxLength from rules for character counter
  const maxLength = rules.maxLength?.value || rules.maxLength;

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      defaultValue={defaultValue}
      render={({ field, fieldState: { error } }) => {
        const currentLength = field.value?.length || 0;
        const showCounter = maxLength && currentLength > 0;

        return (
          <Box sx={{ width: fullWidth ? "100%" : "auto" }}>
            <TextField
              {...field}
              inputRef={field.ref} // Forward ref correctly
              label={label}
              placeholder={placeholder}
              disabled={disabled}
              required={required}
              type={type}
              error={!!error}
              helperText={error?.message || " "} // Reserve space for error message
              slotProps={{
                input: InputProps,
                htmlInput: {
                  ...inputProps,
                  maxLength: maxLength, // Browser-level validation
                },
              }}
              fullWidth={fullWidth}
              size={size}
              variant={variant}
              autoFocus={autoFocus}
              autoComplete={autoComplete}
              maxRows={maxRows}
              minRows={minRows}
              multiline={multiline}
              {...otherProps}
            />

            {/* Character Counter */}
            {showCounter && (
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
            )}
          </Box>
        );
      }}
    />
  );
};

MuiTextField.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  rules: PropTypes.object,
  defaultValue: PropTypes.any,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  type: PropTypes.string,
  InputProps: PropTypes.object,
  inputProps: PropTypes.object,
  fullWidth: PropTypes.bool,
  size: PropTypes.oneOf(["small", "medium"]),
  variant: PropTypes.oneOf(["outlined", "filled", "standard"]),
  autoFocus: PropTypes.bool,
  autoComplete: PropTypes.string,
  maxRows: PropTypes.number,
  minRows: PropTypes.number,
  multiline: PropTypes.bool,
};

export default MuiTextField;
