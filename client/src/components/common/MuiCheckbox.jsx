/**
 * MuiCheckbox Component - Reusable Checkbox with React Hook Form Integration
 *
 * Wraps MUI Checkbox with Controller from react-hook-form.
 * Provides consistent styling and error handling.
 *
 * Features:
 * - Checkbox with label
 * - Proper ref forwarding
 * - Error display
 * - Theme styling applied
 *
 * Requirements: 28.1, 31.10, 32.10
 */

import { Controller } from "react-hook-form";
import { FormControlLabel, Checkbox, FormHelperText, Box } from "@mui/material";
import PropTypes from "prop-types";

/**
 * MuiCheckbox Component
 *
 * @param {Object} props - Component props
 * @param {Object} props.control - React Hook Form control object
 * @param {string} props.name - Field name for form registration
 * @param {string} props.label - Checkbox label
 * @param {Object} props.rules - Validation rules (react-hook-form format)
 * @param {boolean} props.defaultValue - Default value (default: false)
 * @param {boolean} props.disabled - Whether checkbox is disabled
 * @param {string} props.size - Checkbox size (small, medium)
 * @param {string} props.color - Checkbox color (primary, secondary, etc.)
 * @param {string} props.labelPlacement - Label placement (end, start, top, bottom)
 *
 * @returns {JSX.Element} MuiCheckbox component
 *
 * @example
 * // Basic usage
 * <MuiCheckbox
 *   control={control}
 *   name="rememberMe"
 *   label="Remember Me"
 * />
 *
 * @example
 * // With validation
 * <MuiCheckbox
 *   control={control}
 *   name="agreeToTerms"
 *   label="I agree to the terms and conditions"
 *   rules={{ required: "You must agree to the terms" }}
 * />
 */
const MuiCheckbox = ({
  control,
  name,
  label,
  rules = {},
  defaultValue = false,
  disabled = false,
  size = "medium",
  color = "primary",
  labelPlacement = "end",
  ...otherProps
}) => {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      defaultValue={defaultValue}
      render={({ field: { onChange, value, ref }, fieldState: { error } }) => (
        <Box>
          <FormControlLabel
            control={
              <Checkbox
                checked={!!value}
                onChange={(e) => onChange(e.target.checked)}
                ref={ref} // Forward ref correctly
                disabled={disabled}
                size={size}
                color={color}
                {...otherProps}
              />
            }
            label={label}
            labelPlacement={labelPlacement}
          />
          {error && (
            <FormHelperText error sx={{ ml: 2 }}>
              {error.message}
            </FormHelperText>
          )}
        </Box>
      )}
    />
  );
};

MuiCheckbox.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  rules: PropTypes.object,
  defaultValue: PropTypes.bool,
  disabled: PropTypes.bool,
  size: PropTypes.oneOf(["small", "medium"]),
  color: PropTypes.oneOf([
    "primary",
    "secondary",
    "error",
    "info",
    "success",
    "warning",
    "default",
  ]),
  labelPlacement: PropTypes.oneOf(["end", "start", "top", "bottom"]),
};

export default MuiCheckbox;
