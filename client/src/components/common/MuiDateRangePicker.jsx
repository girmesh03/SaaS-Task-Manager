/**
 * MuiDateRangePicker Component - Reusable Date Range Picker with React Hook Form Integration
 *
 * Wraps MUI DateRangePicker with Controller from react-hook-form.
 * Automatically converts UTC ↔ local timezone for both start and end dates.
 *
 * Features:
 * - Start/end date selection
 * - Automatic UTC to local conversion for display
 * - Automatic local to UTC conversion for form state
 * - End date validation (must be after start date)
 * - Dual calendar display
 * - Preset ranges support
 * - Theme styling applied
 *
 * Requirements: 15.7, 28.8
 */

import { Controller } from "react-hook-form";
import { DateRangePicker } from "@mui/x-date-pickers-pro/DateRangePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Box, Stack, Button } from "@mui/material";
import PropTypes from "prop-types";
import { convertUTCToLocal, convertLocalToUTC } from "../../utils/dateUtils";
import dayjs from "dayjs";

/**
 * MuiDateRangePicker Component
 *
 * @param {Object} props - Component props
 * @param {Object} props.control - React Hook Form control object
 * @param {string} props.name - Field name for form registration
 * @param {string} props.label - Field label
 * @param {Object} props.rules - Validation rules (react-hook-form format)
 * @param {Array} props.defaultValue - Default value [startDate, endDate] (UTC ISO strings)
 * @param {Array} props.presetRanges - Preset date ranges (e.g., [{ label: "Today", getValue: () => [dayjs(), dayjs()] }])
 * @param {boolean} props.disabled - Whether field is disabled
 * @param {boolean} props.required - Whether field is required (visual indicator)
 * @param {boolean} props.fullWidth - Whether field takes full width (default: true)
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
 *     validate: (value) => {
 *       if (!value[0] || !value[1]) return "Both dates are required";
 *       if (value[1] < value[0]) return "End date must be after start date";
 *       return true;
 *     }
 *   }}
 * />
 *
 * @example
 * // With preset ranges
 * <MuiDateRangePicker
 *   control={control}
 *   name="dateRange"
 *   label="Date Range"
 *   presetRanges={[
 *     { label: "Today", getValue: () => [dayjs(), dayjs()] },
 *     { label: "This Week", getValue: () => [dayjs().startOf('week'), dayjs().endOf('week')] },
 *     { label: "This Month", getValue: () => [dayjs().startOf('month'), dayjs().endOf('month')] },
 *     { label: "Last 7 Days", getValue: () => [dayjs().subtract(7, 'day'), dayjs()] },
 *     { label: "Last 30 Days", getValue: () => [dayjs().subtract(30, 'day'), dayjs()] },
 *   ]}
 * />
 */
const MuiDateRangePicker = ({
  control,
  name,
  label,
  rules = {},
  defaultValue = [null, null],
  presetRanges = [],
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
        render={({
          field: { onChange, value, ref },
          fieldState: { error },
        }) => {
          // Convert UTC to local for display
          const displayValue = [
            value?.[0] ? convertUTCToLocal(value[0]) : null,
            value?.[1] ? convertUTCToLocal(value[1]) : null,
          ];

          // Handle date range change
          const handleChange = (newValue) => {
            // Convert local to UTC for form state
            const utcValue = [
              newValue?.[0] ? convertLocalToUTC(newValue[0]) : null,
              newValue?.[1] ? convertLocalToUTC(newValue[1]) : null,
            ];
            onChange(utcValue);
          };

          // Handle preset range selection
          const handlePresetClick = (getValue) => {
            const [start, end] = getValue();
            handleChange([start, end]);
          };

          return (
            <Box sx={{ width: fullWidth ? "100%" : "auto" }}>
              <Stack spacing={2}>
                {/* Preset Ranges */}
                {presetRanges.length > 0 && (
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {presetRanges.map((preset) => (
                      <Button
                        key={preset.label}
                        size="small"
                        variant="outlined"
                        onClick={() => handlePresetClick(preset.getValue)}
                        disabled={disabled}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </Stack>
                )}

                {/* Date Range Picker */}
                <DateRangePicker
                  value={displayValue}
                  onChange={handleChange}
                  disabled={disabled}
                  localeText={{
                    start: `${label} - Start`,
                    end: `${label} - End`,
                  }}
                  slotProps={{
                    textField: ({ position }) => ({
                      inputRef: position === "start" ? ref : undefined, // Forward ref to start field
                      required,
                      error: !!error,
                      helperText:
                        position === "start" ? error?.message || " " : " ", // Show error only on start field
                      fullWidth,
                      size,
                      variant,
                    }),
                  }}
                  format={format}
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
  label: PropTypes.string.isRequired,
  rules: PropTypes.object,
  defaultValue: PropTypes.arrayOf(PropTypes.string),
  presetRanges: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      getValue: PropTypes.func.isRequired,
    })
  ),
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  fullWidth: PropTypes.bool,
  size: PropTypes.oneOf(["small", "medium"]),
  variant: PropTypes.oneOf(["outlined", "filled", "standard"]),
  format: PropTypes.string,
};

export default MuiDateRangePicker;
