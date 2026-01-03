/**
 * MuiDateRangePicker Component - Reusable Date Range Picker with React Hook Form Integration
 *
 * Uses two MUI DatePicker components (Community Version) for start and end dates.
 * Automatically converts UTC ↔ local timezone for display and form state.
 *
 * Features:
 * - Start and end date selection
 * - Automatic UTC to local conversion for display
 * - Automatic local to UTC conversion for form state
 * - End date validation (must be after start date)
 * - Theme styling applied
 * - Timezone awareness
 *
 * Requirements: 15.7, 28.8, 29.3, 29.4, 29.5
 */

import { Controller } from "react-hook-form";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Box, Stack } from "@mui/material";
import PropTypes from "prop-types";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);

// Timezone utility functions (inline to avoid import issues)
const getUserTimezone = () => {
  return dayjs.tz.guess();
};

const convertUTCToLocal = (utcDate) => {
  if (!utcDate) return null;
  return dayjs.utc(utcDate).tz(getUserTimezone());
};

const convertLocalToUTC = (localDate) => {
  if (!localDate) return null;
  return dayjs.tz(localDate, getUserTimezone()).utc().toISOString();
};

/**
 * MuiDateRangePicker Component
 *
 * @param {Object} props - Component props
 * @param {Object} props.control - React Hook Form control object
 * @param {string} props.name - Field name for form registration
 * @param {string} props.label - Field label (used as prefix for start/end labels)
 * @param {Object} props.rules - Validation rules (react-hook-form format)
 * @param {Object} props.defaultValue - Default value { start: null, end: null }
 * @param {string|Date} props.minDate - Minimum date (UTC ISO string or Date)
 * @param {string|Date} props.maxDate - Maximum date (UTC ISO string or Date)
 * @param {boolean} props.disablePast - Whether to disable past dates
 * @param {boolean} props.disableFuture - Whether to disable future dates
 * @param {boolean} props.disabled - Whether fields are disabled
 * @param {boolean} props.required - Whether fields are required (visual indicator)
 * @param {boolean} props.fullWidth - Whether fields take full width (default: true)
 * @param {string} props.size - Field size (small, medium)
 * @param {string} props.variant - Field variant (outlined, filled, standard)
 * @param {string} props.format - Date format for display (default: "MMM DD, YYYY")
 *
 * @returns {JSX.Element} MuiDateRangePicker component
 *
 * @example
 * // Basic usage
 * <MuiDateRangePicker
 *   control={control}
 *   name="dateRange"
 *   label="Date Range"
 *   rules={{
 *     validate: (value) => (value.start && value.end) || "Please select date range"
 *   }}
 * />
 *
 * @example
 * // With validation
 * <MuiDateRangePicker
 *   control={control}
 *   name="projectDuration"
 *   label="Project Duration"
 *   rules={{
 *     validate: (value) => {
 *       if (!value.start || !value.end) return "Both dates are required";
 *       if (dayjs(value.end).isBefore(dayjs(value.start))) {
 *         return "End date must be after start date";
 *       }
 *       return true;
 *     }
 *   }}
 * />
 */
const MuiDateRangePicker = ({
  control,
  name,
  label = "Date Range",
  rules = {},
  defaultValue = { start: null, end: null },
  minDate,
  maxDate,
  disablePast = false,
  disableFuture = false,
  disabled = false,
  required = false,
  fullWidth = true,
  size = "medium",
  variant = "outlined",
  format = "MMM DD, YYYY",
  ...otherProps
}) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Controller
        name={name}
        control={control}
        rules={rules}
        defaultValue={defaultValue}
        render={({ field: { onChange, value }, fieldState: { error } }) => {
          const dateRange = value || { start: null, end: null };

          // Convert UTC to local for display
          const displayStartDate = dateRange.start
            ? convertUTCToLocal(dateRange.start)
            : null;
          const displayEndDate = dateRange.end
            ? convertUTCToLocal(dateRange.end)
            : null;

          // Convert min/max dates to local for picker
          const localMinDate = minDate ? convertUTCToLocal(minDate) : undefined;
          const localMaxDate = maxDate ? convertUTCToLocal(maxDate) : undefined;

          const handleStartDateChange = (newValue) => {
            const utcValue = newValue ? convertLocalToUTC(newValue) : null;
            onChange({
              start: utcValue,
              end: dateRange.end,
            });
          };

          const handleEndDateChange = (newValue) => {
            const utcValue = newValue ? convertLocalToUTC(newValue) : null;
            onChange({
              start: dateRange.start,
              end: utcValue,
            });
          };

          return (
            <Box sx={{ width: fullWidth ? "100%" : "auto" }}>
              <Stack spacing={2}>
                {/* Start Date Picker */}
                <DatePicker
                  label={`${label} - Start`}
                  value={displayStartDate}
                  onChange={handleStartDateChange}
                  minDate={localMinDate}
                  maxDate={displayEndDate || localMaxDate}
                  disablePast={disablePast}
                  disableFuture={disableFuture}
                  disabled={disabled}
                  format={format}
                  slotProps={{
                    textField: {
                      required,
                      error: !!error,
                      helperText: error?.message || " ",
                      fullWidth,
                      size,
                      variant,
                    },
                  }}
                  {...otherProps}
                />

                {/* End Date Picker */}
                <DatePicker
                  label={`${label} - End`}
                  value={displayEndDate}
                  onChange={handleEndDateChange}
                  minDate={displayStartDate || localMinDate}
                  maxDate={localMaxDate}
                  disablePast={disablePast}
                  disableFuture={disableFuture}
                  disabled={disabled}
                  format={format}
                  slotProps={{
                    textField: {
                      required,
                      error: !!error,
                      helperText: " ", // Reserve space
                      fullWidth,
                      size,
                      variant,
                    },
                  }}
                  {...otherProps}
                />
              </Stack>
            </Box>
          );
        }}
      />
    </LocalizationProvider>
  );
};

MuiDateRangePicker.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  label: PropTypes.string,
  rules: PropTypes.object,
  defaultValue: PropTypes.shape({
    start: PropTypes.string,
    end: PropTypes.string,
  }),
  minDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  maxDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  disablePast: PropTypes.bool,
  disableFuture: PropTypes.bool,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  fullWidth: PropTypes.bool,
  size: PropTypes.oneOf(["small", "medium"]),
  variant: PropTypes.oneOf(["outlined", "filled", "standard"]),
  format: PropTypes.string,
};

export default MuiDateRangePicker;
