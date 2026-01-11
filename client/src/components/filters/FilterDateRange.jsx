/**
 * FilterDateRange Component - Date Range Filter with Presets
 *
 * Requirements: 16.3, 16.4
 */

import { Box, Stack, Chip, TextField } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import {
  getUserTimezone,
  convertUTCToLocal,
  convertLocalToUTC,
} from "../../utils/dateUtils";

// Extend dayjs
dayjs.extend(utc);
dayjs.extend(timezone);

const PRESETS = [
  { label: "Today", value: "today" },
  { label: "This Week", value: "thisWeek" },
  { label: "This Month", value: "thisMonth" },
  { label: "Last 7 Days", value: "last7" },
  { label: "Last 30 Days", value: "last30" },
];

const FilterDateRange = ({ value, onChange }) => {
  const userTimezone = getUserTimezone();

  // Convert UTC to local for display
  const displayStartDate = value?.start ? convertUTCToLocal(value.start) : null;
  const displayEndDate = value?.end ? convertUTCToLocal(value.end) : null;

  const handleStartDateChange = (newValue) => {
    const utcValue = newValue ? convertLocalToUTC(newValue) : null;
    onChange({
      start: utcValue,
      end: value?.end || null,
    });
  };

  const handleEndDateChange = (newValue) => {
    const utcValue = newValue ? convertLocalToUTC(newValue) : null;
    onChange({
      start: value?.start || null,
      end: utcValue,
    });
  };

  const handlePresetClick = (presetValue) => {
    const now = dayjs().tz(userTimezone);
    let start, end;

    switch (presetValue) {
      case "today":
        start = now.startOf("day");
        end = now.endOf("day");
        break;
      case "thisWeek":
        start = now.startOf("week");
        end = now.endOf("week");
        break;
      case "thisMonth":
        start = now.startOf("month");
        end = now.endOf("month");
        break;
      case "last7":
        start = now.subtract(7, "day").startOf("day");
        end = now.endOf("day");
        break;
      case "last30":
        start = now.subtract(30, "day").startOf("day");
        end = now.endOf("day");
        break;
      default:
        return;
    }

    onChange({
      start: start.utc().toISOString(),
      end: end.utc().toISOString(),
    });
  };

  return (
    <Stack
      direction="row"
      spacing={1.5}
      alignItems="center"
      sx={{ flexWrap: "wrap", gap: 1 }}
    >
      {/* Start Date */}
      <DatePicker
        label="From"
        value={displayStartDate}
        onChange={handleStartDateChange}
        maxDate={displayEndDate}
        format="MMM DD, YYYY"
        slotProps={{
          textField: {
            size: "small",
            sx: { minWidth: 150, maxWidth: 170 },
          },
        }}
      />

      {/* End Date */}
      <DatePicker
        label="To"
        value={displayEndDate}
        onChange={handleEndDateChange}
        minDate={displayStartDate}
        format="MMM DD, YYYY"
        slotProps={{
          textField: {
            size: "small",
            sx: { minWidth: 150, maxWidth: 170 },
          },
        }}
      />

      {/* Presets */}
      <Stack
        direction="row"
        spacing={0.5}
        sx={{
          flexWrap: "wrap",
          gap: 0.5,
          "& .MuiChip-root": {
            height: 28,
          },
        }}
      >
        {PRESETS.map((preset) => (
          <Chip
            key={preset.value}
            label={preset.label}
            size="small"
            onClick={() => handlePresetClick(preset.value)}
            variant="outlined"
            clickable
          />
        ))}
      </Stack>
    </Stack>
  );
};

export default FilterDateRange;
