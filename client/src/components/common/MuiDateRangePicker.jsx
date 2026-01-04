/**
 * MuiDateRangePicker Component - Reusable Date Range Picker Component
 *
 * MuiDateRangePicker is a pure UI component that wraps two MUI DatePickers.
 * It does not depend on react-hook-form's Controller internally.
 * It accepts standard controlled component props: value ({start, end}), onChange, error, helperText.
 *
 * Features:
 * - Start and end date selection
 * - Automatic UTC to local conversion for display
 * - Automatic local to UTC conversion for form state
 * - End date validation (must be after start date)
 * - Theme styling applied
 * - Timezone awareness
 *
 * NOTE: LocalizationProvider is now provided at the app level in main.jsx
 *
 * Requirements: 15.7, 28.8, 29.3, 29.4, 29.5
 */

import { forwardRef } from "react";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Box, Stack } from "@mui/material";
import { convertUTCToLocal, convertLocalToUTC } from "../../utils/dateUtils";

/**
 * MuiDateRangePicker Component
 *
 * @param {Object} props - Component props
 * @param {Object} props.value - Selected range { start: UTC string, end: UTC string }
 * @param {Function} props.onChange - Handler for change events ({ start, end })
 * @param {Function} props.onBlur - Handler for blur events
 * @param {string} props.name - Field name
 * @param {string} props.label - Field label
 * @param {Object} props.error - Error object
 * @param {string} props.helperText - Helper text to display
 * @param {string|Date} props.minDate - Minimum date (UTC ISO string or Date)
 * @param {string|Date} props.maxDate - Maximum date (UTC ISO string or Date)
 * @param {boolean} props.disablePast - Whether to disable past dates
 * @param {boolean} props.disableFuture - Whether to disable future dates
 * @param {boolean} props.disabled - Whether fields are disabled
 * @param {boolean} props.required - Whether fields are required
 * @param {boolean} props.fullWidth - Whether fields take full width
 * @param {string} props.size - Field size
 * @param {string} props.variant - Field variant
 * @param {string} props.format - Date format for display
 */
const MuiDateRangePicker = forwardRef(
  (
    {
      value = { start: null, end: null },
      onChange,
      onBlur,
      name,
      label = "Date Range",
      error,
      helperText,
      minDate,
      maxDate,
      disablePast = false,
      disableFuture = false,
      disabled = false,
      required = false,
      fullWidth = true,
      size = "small",
      variant = "outlined",
      format = "MMM DD, YYYY",
      ...otherProps
    },
    ref
  ) => {
    // Ensure dateRange is always an object with start/end
    const dateRange =
      value && typeof value === "object" ? value : { start: null, end: null };

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
            inputRef={ref} // Forward ref to the first input for focus management
            slotProps={{
              textField: {
                name: `${name}.start`,
                onBlur,
                required,
                error: !!error,
                helperText: error?.message || helperText || " ",
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
                name: `${name}.end`,
                onBlur,
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
  }
);

MuiDateRangePicker.displayName = "MuiDateRangePicker";

export default MuiDateRangePicker;
