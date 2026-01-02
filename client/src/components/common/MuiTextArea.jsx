/**
 * MuiTextArea Component - Reusable Text Area with React Hook Form Integration
 *
 * Extends MuiTextField with multiline prop for text area functionality.
 * Provides auto-resize, character counter, and consistent styling.
 *
 * Features:
 * - Multiline text input with auto-resize
 * - Character counter
 * - Configurable rows and maxRows
 * - All MuiTextField features
 *
 * Requirements: 15.2, 28.3
 */

import MuiTextField from "./MuiTextField";
import PropTypes from "prop-types";

/**
 * MuiTextArea Component
 *
 * @param {Object} props - Component props
 * @param {Object} props.control - React Hook Form control object
 * @param {string} props.name - Field name for form registration
 * @param {string} props.label - Field label
 * @param {Object} props.rules - Validation rules (react-hook-form format)
 * @param {any} props.defaultValue - Default value for the field
 * @param {number} props.rows - Number of rows (default: 4)
 * @param {number} props.maxRows - Maximum rows for auto-resize
 * @param {number} props.minRows - Minimum rows for auto-resize
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.disabled - Whether field is disabled
 * @param {boolean} props.required - Whether field is required (visual indicator)
 * @param {boolean} props.fullWidth - Whether field takes full width (default: true)
 * @param {string} props.size - Field size (small, medium)
 * @param {string} props.variant - Field variant (outlined, filled, standard)
 *
 * @returns {JSX.Element} MuiTextArea component
 *
 * @example
 * // Basic usage
 * <MuiTextArea
 *   control={control}
 *   name="description"
 *   label="Description"
 *   rules={{ required: "Description is required", maxLength: { value: 2000, message: "Max 2000 characters" } }}
 * />
 *
 * @example
 * // With custom rows and auto-resize
 * <MuiTextArea
 *   control={control}
 *   name="comments"
 *   label="Comments"
 *   rows={6}
 *   maxRows={12}
 *   rules={{ maxLength: { value: 5000, message: "Max 5000 characters" } }}
 * />
 *
 * @example
 * // With placeholder
 * <MuiTextArea
 *   control={control}
 *   name="notes"
 *   label="Notes"
 *   placeholder="Enter your notes here..."
 *   rows={3}
 * />
 */
const MuiTextArea = ({
  control,
  name,
  label,
  rules = {},
  defaultValue = "",
  rows = 4,
  maxRows,
  minRows,
  placeholder,
  disabled = false,
  required = false,
  fullWidth = true,
  size = "medium",
  variant = "outlined",
  ...otherProps
}) => {
  return (
    <MuiTextField
      control={control}
      name={name}
      label={label}
      rules={rules}
      defaultValue={defaultValue}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      fullWidth={fullWidth}
      size={size}
      variant={variant}
      multiline
      rows={rows}
      maxRows={maxRows}
      minRows={minRows}
      {...otherProps}
    />
  );
};

MuiTextArea.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  rules: PropTypes.object,
  defaultValue: PropTypes.any,
  rows: PropTypes.number,
  maxRows: PropTypes.number,
  minRows: PropTypes.number,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  fullWidth: PropTypes.bool,
  size: PropTypes.oneOf(["small", "medium"]),
  variant: PropTypes.oneOf(["outlined", "filled", "standard"]),
};

export default MuiTextArea;
