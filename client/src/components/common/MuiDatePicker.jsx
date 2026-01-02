/**
 * MuiDatePicker Component - Reusable Date Picker with React Hook Form Integration
 *
 * Wraps MUI DatePicker with Controller from react-hook-form.
 * Automatically converts UTC ↔ local timezone for display and form state.
 *
 * Features:
 * - Automatic UTC to local conversion for display
 * - Automatic local to UTC conversion for form state
 * - Min/max date validation
 * - Calendar popup
 * - Theme styling applied
 * - Timezone awareness
 *
 * Requirements: 15.6, 28.7, 29.3, 29.4, 29.5
 */

import { Controller } from "react-hook-form";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { TextField, Box } from "@mui/material";
import PropTypes from "prop-types";
import { convertUTCToLocal, convertLocalToUTC } from "../../utils/dateUtils";
import dayjs from "dayjs";

/**
 * MuiDatePicker Component
 *
 * @param {Object} props - Component props
 * @param {Object} props.control - React Hook Form control object
 * @param {string} props.name - Field name for form registration
 * @param {string} props.label - Field label
 * @param {Object} props.rules - Validation rules (react-hook-form format)
 * @param {string} props.defaultValue - Default value (UTC ISO string)
 * @param {string|Date} props.minDate - Minimum date (UTC ISO string or Date)
 * @param {string|Date} props.maxDate - Maximum date (UTC ISO string or Date)
 * @param {boolean} props.disablePast - Whether to disable past dates
 * @param {boolean} props.disableFuture - Whether to disable future dates
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.disabled - Whether field is disabled
 * @param {boolean} props.required - Whether field is required (visual indicator)
 * @param {boolean} props.fullWidth - Whether field takes full width (default: true)
 * @param {string} props.size - Field size (small, medium)
 * @param {string} props.variant - Field variant (outlined, filled, standard)
 * @param {string} props.format - Date format for display (default: "MMM DD, YYYY")
 * @param {string} props.views - Date picker views (default: ['year', 'month', 'day'])
 * @param {string} props.openTo - Initial view to open (default: 'day')
 *
 * @returns {JSX.Element} MuiDatePicker component
 *
 * @example
 * // Basic usage
 * <MuiDatePicker
 *   control={control}
 *   name="startDate"
 *   label="Start Date"
 *   rules={{ required: "Start date is required" }}
 * />
 *
 * @example
 * // With min/max validation
 * <MuiDatePicker
 *   control={control}
 *   name="dueDate"
 *   label="Due Date"
 *   minDate={startDate}
 *   rules={{
 *     required: "Due date is required",
 *     validate: (value) => {
 *       if (startDate && value < startDate) {
 *         return "Due date must be after start date";
 *       }
 *       return true;
 *     }
 *   }}
 * />
 *
 * @example
 * // Disable future dates
 * <MuiDatePicker
 *   control={control}
 *   name="dateOfBirth"
 *   label="Date of Birth"
 *   disableFuture
 *   rules={{ required: "Date of birth is required" }}
 * />
 */
const MuiDatePicker = ({
  control,
  name,
  label,
  rules = {},
  defaultValue = null,
  minDate,
  maxDate,
  disablePast = false,
  disableFuture = false,
  placeholder,
  disabled = false,
  required = false,
  fullWidth = true,
  size = "medium",
  variant = "outlined",
  format = "MMM DD, YYYY",
  views = ["year", "month", "day"],
  openTo = "day",
  ...otherProps
}) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Controller
        name={name}
        control={control}
        rules={rules}
        defaultValue={defaultValue}
        render={({
          field: { onChange, value, ref },
          fieldState: { error },
        }) => {
          // Convert UTC to local for display
          const displayValue = value ? convertUTCToLocal(value) : null;

          // Convert min/max dates to local for picker
          const localMinDate = minDate ? convertUTCToLocal(minDate) : undefined;
          const localMaxDate = maxDate ? convertUTCToLocal(maxDate) : undefined;

          return (
            <Box sx={{ width: fullWidth ? "100%" : "auto" }}>
              <DatePicker
                value={displayValue}
                onChange={(newValue) => {
                  // Convert local to UTC for form state
                  const utcValue = newValue
                    ? convertLocalToUTC(newValue)
                    : null;
                  onChange(utcValue);
                }}
                minDate={localMinDate}
                maxDate={localMaxDate}
                disablePast={disablePast}
                disableFuture={disableFuture}
                disabled={disabled}
                format={format}
                views={views}
                openTo={openTo}
                slotProps={{
                  textField: {
                    inputRef: ref, // Forward ref correctly
                    label,
                    placeholder,
                    required,
                    error: !!error,
                    helperText: error?.message || " ", // Reserve space for error message
                    fullWidth,
                    size,
                    variant,
                  },
                }}
                {...otherProps}
              />
            </Box>
          );
        }}
      />
    </LocalizationProvider>
  );
};

MuiDatePicker.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  rules: PropTypes.object,
  defaultValue: PropTypes.string,
  minDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  maxDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  disablePast: PropTypes.bool,
  disableFuture: PropTypes.bool,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  fullWidth: PropTypes.bool,
  size: PropTypes.oneOf(["small", "medium"]),
  variant: PropTypes.oneOf(["outlined", "filled", "standard"]),
  format: PropTypes.string,
  views: PropTypes.arrayOf(PropTypes.oneOf(["year", "month", "day"])),
  openTo: PropTypes.oneOf(["year", "month", "day"]),
};

export default MuiDatePicker;
