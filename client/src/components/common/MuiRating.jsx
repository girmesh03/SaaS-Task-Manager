/**
 * MuiRating Component - Reusable Rating with React Hook Form Integration
 *
 * Wraps MUI Rating with Controller from react-hook-form.
 * Provides consistent styling and error handling.
 *
 * Features:
 * - Star rating with customizable max value
 * - Proper ref forwarding
 * - Error display
 * - Half-star precision support
 * - Theme styling applied
 *
 * Requirements: 28.1, 31.10, 32.10
 */

import { Controller } from "react-hook-form";
import {
  FormControl,
  FormLabel,
  Rating,
  FormHelperText,
  Box,
} from "@mui/material";
import PropTypes from "prop-types";

/**
 * MuiRating Component
 *
 * @param {Object} props - Component props
 * @param {Object} props.control - React Hook Form control object
 * @param {string} props.name - Field name for form registration
 * @param {string} props.label - Rating label
 * @param {Object} props.rules - Validation rules (react-hook-form format)
 * @param {number} props.defaultValue - Default value (default: 0)
 * @param {number} props.max - Maximum rating value (default: 5)
 * @param {number} props.precision - Precision (0.5 for half stars, 1 for full stars)
 * @param {boolean} props.disabled - Whether rating is disabled
 * @param {boolean} props.readOnly - Whether rating is read-only
 * @param {boolean} props.required - Whether field is required (visual indicator)
 * @param {string} props.size - Rating size (small, medium, large)
 * @param {ReactNode} props.icon - Custom icon component
 * @param {ReactNode} props.emptyIcon - Custom empty icon component
 *
 * @returns {JSX.Element} MuiRating component
 *
 * @example
 * // Basic usage
 * <MuiRating
 *   control={control}
 *   name="rating"
 *   label="Rate this product"
 *   rules={{ required: "Rating is required" }}
 * />
 *
 * @example
 * // With half-star precision
 * <MuiRating
 *   control={control}
 *   name="rating"
 *   label="Rate this service"
 *   precision={0.5}
 *   max={5}
 * />
 *
 * @example
 * // Read-only display
 * <MuiRating
 *   control={control}
 *   name="averageRating"
 *   label="Average Rating"
 *   readOnly
 *   precision={0.1}
 * />
 */
const MuiRating = ({
  control,
  name,
  label,
  rules = {},
  defaultValue = 0,
  max = 5,
  precision = 1,
  disabled = false,
  readOnly = false,
  required = false,
  size = "medium",
  icon,
  emptyIcon,
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {label && <FormLabel>{label}</FormLabel>}
            <Rating
              value={value || 0}
              onChange={(_, newValue) => onChange(newValue)}
              ref={ref} // Forward ref correctly
              max={max}
              precision={precision}
              disabled={disabled}
              readOnly={readOnly}
              size={size}
              icon={icon}
              emptyIcon={emptyIcon}
              {...otherProps}
            />
          </Box>
          {error && <FormHelperText>{error.message}</FormHelperText>}
        </FormControl>
      )}
    />
  );
};

MuiRating.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  label: PropTypes.string,
  rules: PropTypes.object,
  defaultValue: PropTypes.number,
  max: PropTypes.number,
  precision: PropTypes.number,
  disabled: PropTypes.bool,
  readOnly: PropTypes.bool,
  required: PropTypes.bool,
  size: PropTypes.oneOf(["small", "medium", "large"]),
  icon: PropTypes.node,
  emptyIcon: PropTypes.node,
};

export default MuiRating;
