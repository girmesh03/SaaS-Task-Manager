/**
 * FilterChipGroup Component - Active Filters Display
 *
 * Requirements: 16.5
 */

import { Stack, Chip, Button } from "@mui/material";
import { formatDateForDisplay } from "../../utils/dateUtils";

const FilterChipGroup = ({
  filters,
  labelMap = {}, // Map of filter keys to display labels
  onDelete, // (key) => void
  onClearAll,
}) => {
  if (!filters) return null;

  const renderValue = (key, value) => {
    // Check for Date Range
    if (value && typeof value === "object" && (value.start || value.end)) {
      const start = value.start ? formatDateForDisplay(value.start, "MMM DD") : "?";
      const end = value.end ? formatDateForDisplay(value.end, "MMM DD") : "?";
      return `${start} - ${end}`;
    }

    // Check for Array
    if (Array.isArray(value)) {
      return value.join(", ");
    }

    // Check for Boolean
    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }

    return value;
  };

  const activeFilters = Object.entries(filters).filter(([key, value]) => {
    // Skip internal or persistence keys like 'page', 'limit' if they are passed here.
    // Usually only 'filters' object is passed, but just in case.
    if (key === "page" || key === "limit" || key === "sort") return false;

    if (value === null || value === undefined || value === "") return false;
    if (Array.isArray(value) && value.length === 0) return false;
    // Check empty date range
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      !value.start &&
      !value.end
    )
      return false;

    return true;
  });

  if (activeFilters.length === 0) return null;

  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center" sx={{ mt: 1, gap: 1 }}>
      {activeFilters.map(([key, value]) => (
        <Chip
          key={key}
          label={`${labelMap[key] || key}: ${renderValue(key, value)}`}
          onDelete={() => onDelete(key)}
          size="small"
        />
      ))}
      <Button
        variant="text"
        size="small"
        onClick={onClearAll}
        color="primary"
        sx={{ minWidth: "auto" }}
      >
        Clear All
      </Button>
    </Stack>
  );
};

export default FilterChipGroup;
