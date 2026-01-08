/**
 * MuiDatePicker Component - Reusable Date Picker Component
 *
 * MuiDatePicker is a pure UI component that wraps MUI's DatePicker.
 * It does not depend on react-hook-form's Controller internally.
 * It accepts standard controlled component props: value (UTC string or null), onChange (UTC string or null), error, helperText.
 *
 * Features:
 * - Automatic UTC to local conversion for display
 * - Automatic local to UTC conversion for form state
 * - Min/max date validation
 * - Calendar popup
 * - Theme styling applied
 * - Timezone awareness
 *
 * NOTE: LocalizationProvider is now provided at the app level in main.jsx
 *
 * Requirements: 15.6, 28.7, 29.3, 29.4, 29.5
 */

import { forwardRef } from "react";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Box } from "@mui/material";
import { convertUTCToLocal, convertLocalToUTC } from "../../utils/dateUtils";

/**
 * MuiDatePicker Component
 *
 * @param {Object} props - Component props
 * @param {string} props.value - The selected date (UTC ISO string)
 * @param {Function} props.onChange - Handler for change events (newValue as UTC ISO string)
 * @param {Function} props.onBlur - Handler for blur events
 * @param {string} props.name - Field name
 * @param {string} props.label - Field label
 * @param {Object} props.error - Error object
 * @param {string} props.helperText - Helper text to display
 * @param {string|Date} props.minDate - Minimum date (UTC ISO string or Date)
 * @param {string|Date} props.maxDate - Maximum date (UTC ISO string or Date)
 * @param {boolean} props.disablePast - Whether to disable past dates
 * @param {boolean} props.disableFuture - Whether to disable future dates
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.disabled - Whether field is disabled
 * @param {boolean} props.required - Whether field is required
 * @param {boolean} props.fullWidth - Whether field takes full width
 * @param {string} props.size - Field size
 * @param {string} props.variant - Field variant
 * @param {string} props.format - Date format for display
 * @param {string} props.views - Date picker views
 * @param {string} props.openTo - Initial view to open
 */
const MuiDatePicker = forwardRef(
  (
    {
      value = null,
      onChange,
      onBlur,
      name,
      label,
      error,
      helperText,
      minDate,
      maxDate,
      disablePast = false,
      disableFuture = false,
      placeholder,
      disabled = false,
      required = false,
      fullWidth = true,
      size = "small",
      variant = "outlined",
      format = "MMM DD, YYYY",
      views = ["year", "month", "day"],
      openTo = "day",
      ...otherProps
    },
    ref
  ) => {
    // Convert UTC to local for display
    const displayValue = value ? convertUTCToLocal(value) : null;

    // Convert min/max dates to local for picker
    const localMinDate = minDate ? convertUTCToLocal(minDate) : undefined;
    const localMaxDate = maxDate ? convertUTCToLocal(maxDate) : undefined;

    return (
      <DatePicker
        value={displayValue}
        onChange={(newValue) => {
          // Convert local to UTC for form state
          const utcValue = newValue ? convertLocalToUTC(newValue) : null;
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
        inputRef={ref}
        slotProps={{
          textField: {
            name,
            onBlur,
            label,
            placeholder,
            required,
            error: !!error,
            helperText: error?.message || helperText || " ", // Reserve space for error message
            fullWidth,
            size,
            variant,
          },
        }}
        {...otherProps}
      />
    );
  }
);

MuiDatePicker.displayName = "MuiDatePicker";

export default MuiDatePicker;
