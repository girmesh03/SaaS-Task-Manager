/**
 * MuiRadioGroup Component - Reusable Radio Group with React Hook Form Integration
 *
 * Wraps MUI RadioGroup with Controller from react-hook-form.
 * Provides consistent styling and error handling.
 *
 * Features:
 * - Radio group with multiple options
 * - Proper ref forwarding
 * - Error display
 * - Theme styling applied
 *
 * Requirements: 28.1, 31.10, 32.10
 */

import { Controller } from "react-hook-form";
import {
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormHelperText,
} from "@mui/material";
import PropTypes from "prop-types";

/**
 * MuiRadioGroup Component
 *
 * @param {Object} props - Component props
 * @param {Object} props.control - React Hook Form control object
 * @param {string} props.name - Field name for form registration
 * @param {string} props.label - Radio group label
 * @param {Array} props.options - Array of options [{ label, value }, ...]
 * @param {Object} props.rules - Validation rules (react-hook-form format)
 * @param {any} props.defaultValue - Default value
 * @param {boolean} props.disabled - Whether radio group is disabled
 * @param {boolean} props.required - Whether field is required (visual indicator)
 * @param {string} props.row - Whether to display options in a row (default: false)
 * @param {string} props.size - Radio size (small, medium)
 * @param {string} props.color - Radio color (primary, secondary, etc.)
 *
 * @returns {JSX.Element} MuiRadioGroup component
 *
 * @example
 * // Basic usage
 * <MuiRadioGroup
 *   control={control}
 *   name="gender"
 *   label="Gender"
 *   options={[
 *     { label: "Male", value: "male" },
 *     { label: "Female", value: "female" },
 *     { label: "Other", value: "other" }
 *   ]}
 *   rules={{ required: "Gender is required" }}
 * />
 *
 * @example
 * // Horizontal layout
 * <MuiRadioGroup
 *   control={control}
 *   name="priority"
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
const MuiRadioGroup = ({
  control,
  name,
  label,
  options = [],
  rules = {},
  defaultValue = "",
  disabled = false,
  required = false,
  row = false,
  size = "medium",
  color = "primary",
  ...otherProps
}) => {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      defaultValue={defaultValue}
      render={({ field: { onChange, value, ref }, fieldState: { error } }) => (
        <FormControl error={!!error} required={required} disabled={disabled}>
          <FormLabel>{label}</FormLabel>
          <RadioGroup
            value={value}
            onChange={onChange}
            row={row}
            ref={ref} // Forward ref correctly
            {...otherProps}
          >
            {options.map((option) => (
              <FormControlLabel
                key={option.value}
                value={option.value}
                control={<Radio size={size} color={color} />}
                label={option.label}
                disabled={option.disabled || disabled}
              />
            ))}
          </RadioGroup>
          {error && <FormHelperText>{error.message}</FormHelperText>}
        </FormControl>
      )}
    />
  );
};

MuiRadioGroup.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.any.isRequired,
      disabled: PropTypes.bool,
    })
  ).isRequired,
  rules: PropTypes.object,
  defaultValue: PropTypes.any,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  row: PropTypes.bool,
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
};

export default MuiRadioGroup;
