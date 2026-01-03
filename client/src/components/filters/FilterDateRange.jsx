/**
 * FilterDateRange Component - Date Range Filter with Presets
 *
 * Requirements: 16.3, 16.4
 */

import { Box, Stack, Chip, Typography } from "@mui/material";
import MuiDateRangePicker from "../common/MuiDateRangePicker";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { getUserTimezone } from "../../utils/dateUtils";

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

const FilterDateRange = ({ value, onChange, label = "Date Range" }) => {
  const userTimezone = getUserTimezone();

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
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
        {label}
      </Typography>

      {/* Date Range Picker */}
      <MuiDateRangePicker
        value={value}
        onChange={onChange}
        label=""
        fullWidth
        size="small"
      />

      {/* Presets */}
      <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap", gap: 0.5 }}>
        {PRESETS.map((preset) => (
          <Chip
            key={preset.value}
            label={preset.label}
            size="small"
            onClick={() => handlePresetClick(preset.value)}
            variant="outlined"
            clickable
             /* Logic to highlight selected preset could be added here if needed,
                but validating if current range matches preset is complex due to ms precision.
                Keep it simple as action buttons for now. */
          />
        ))}
      </Stack>
    </Box>
  );
};

export default FilterDateRange;
