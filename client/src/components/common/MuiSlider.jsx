/**
 * MuiSlider Component - Reusable Slider with React Hook Form Integration
 *
 * Wraps MUI Slider with Controller from react-hook-form.
 * Provides consistent styling and error handling.
 *
 * Features:
 * - Slider with value display
 * - Proper ref forwarding
 * - Error display
 * - Min/max/step support
 * - Theme styling applied
 *
 * Requirements: 28.1, 31.10, 32.10
 */

import { Controller } from "react-hook-form";
import {
  FormControl,
  FormLabel,
  Slider,
  FormHelperText,
  Box,
  Typography,
} from "@mui/material";
import PropTypes from "prop-types";

/**
 * MuiSlider Component
 *
 * @param {Object} props - Component props
 * @param {Object} props.control - React Hook Form control object
 * @param {string} props.name - Field name for form registration
 * @param {string} props.label - Slider label
 * @param {Object} props.rules - Validation rules (react-hook-form format)
 * @param {number} props.defaultValue - Default value
 * @param {number} props.min - Minimum value (default: 0)
 * @param {number} props.max - Maximum value (default: 100)
 * @param {number} props.step - Step increment (default: 1)
 * @param {Array} props.marks - Marks to display on slider
 * @param {boolean} props.disabled - Whether slider is disabled
 * @param {boolean} props.required - Whether field is required (visual indicator)
 * @param {string} props.valueLabelDisplay - Value label display (auto, on, off)
 * @param {Function} props.valueLabelFormat - Function to format value label
 * @param {string} props.color - Slider color (primary, secondary, etc.)
 * @param {string} props.size - Slider size (small, medium)
 * @param {boolean} props.showValue - Whether to show current value (default: true)
 *
 * @returns {JSX.Element} MuiSlider component
 *
 * @example
 * // Basic usage
 * <MuiSlider
 *   control={control}
 *   name="percentage"
 *   label="Skill Percentage"
 *   min={0}
 *   max={100}
 *   rules={{ required: "Percentage is required" }}
 * />
 *
 * @example
 * // With marks
 * <MuiSlider
 *   control={control}
 *   name="priority"
 *   label="Priority Level"
 *   min={1}
 *   max={4}
 *   step={1}
 *   marks={[
 *     { value: 1, label: "Low" },
 *     { value: 2, label: "Medium" },
 *     { value: 3, label: "High" },
 *     { value: 4, label: "Urgent" }
 *   ]}
 * />
 */
const MuiSlider = ({
  control,
  name,
  label,
  rules = {},
  defaultValue = 0,
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
  ...otherProps
}) => {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      defaultValue={defaultValue}
      render={({ field: { onChange, value, ref }, fieldState: { error } }) => (
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
                {valueLabelFormat ? valueLabelFormat(value) : value}
              </Typography>
            )}
          </Box>
          <Slider
            value={value || defaultValue}
            onChange={(event, newValue) => onChange(newValue)}
            ref={ref} // Forward ref correctly
            min={min}
            max={max}
            step={step}
            marks={marks}
            disabled={disabled}
            valueLabelDisplay={valueLabelDisplay}
            valueLabelFormat={valueLabelFormat}
            color={color}
            size={size}
            {...otherProps}
          />
          {error && <FormHelperText>{error.message}</FormHelperText>}
        </FormControl>
      )}
    />
  );
};

MuiSlider.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  rules: PropTypes.object,
  defaultValue: PropTypes.number,
  min: PropTypes.number,
  max: PropTypes.number,
  step: PropTypes.number,
  marks: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.number.isRequired,
      label: PropTypes.string,
    })
  ),
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  valueLabelDisplay: PropTypes.oneOf(["auto", "on", "off"]),
  valueLabelFormat: PropTypes.func,
  color: PropTypes.oneOf([
    "primary",
    "secondary",
    "error",
    "info",
    "success",
    "warning",
  ]),
  size: PropTypes.oneOf(["small", "medium"]),
  showValue: PropTypes.bool,
};

export default MuiSlider;
