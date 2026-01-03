/**
 * TaskFilter Component - Filter bar for Tasks
 *
 * Requirements: 16.6
 */

import { Box, Stack, FormControlLabel, Switch } from "@mui/material";
import FilterTextField from "./FilterTextField";
import FilterSelect from "./FilterSelect";
import FilterDateRange from "./FilterDateRange";
import FilterChipGroup from "./FilterChipGroup";
import { TASK_STATUS, TASK_PRIORITY, TASK_TYPES } from "../../utils/constants";

const TaskFilter = ({
  filters,
  onChange,
  users = [], // Array of { _id, fullName }
  vendors = [], // Array of { _id, name }
}) => {
  const handleFilterChange = (key, value) => {
    onChange({
      ...filters,
      [key]: value,
      page: 1, // Reset page on filter change
    });
  };

  const handleDateRangeChange = (range) => {
    onChange({
      ...filters,
      startDate: range.start,
      endDate: range.end,
      page: 1,
    });
  };

  const handleClearAll = () => {
    onChange({
      page: 1,
      limit: filters.limit || 10,
    });
  };

  const handleDeleteChip = (key) => {
    const newFilters = { ...filters };

    if (key === "startDate" || key === "endDate") {
      delete newFilters.startDate;
      delete newFilters.endDate;
    } else {
      delete newFilters[key];
    }

    onChange(newFilters);
  };

  // Convert separate start/end dates to object for FilterDateRange
  const dateRangeValue = {
    start: filters.startDate || null,
    end: filters.endDate || null,
  };

  // Options
  const statusOptions = Object.values(TASK_STATUS);
  const priorityOptions = Object.values(TASK_PRIORITY);
  const typeOptions = Object.values(TASK_TYPES);
  const assigneeOptions = users.map((u) => ({
    label: u.fullName || u.email,
    value: u._id,
  }));
  const vendorOptions = vendors.map((v) => ({
    label: v.name,
    value: v._id,
  }));

  const LABEL_MAP = {
    search: "Search",
    status: "Status",
    priority: "Priority",
    taskType: "Type",
    assignee: "Assignee",
    vendor: "Vendor",
    startDate: "From",
    endDate: "To",
    isDeleted: "Deleted",
  };

  return (
    <Box>
      <Stack spacing={2}>
        {/* Search */}
        <FilterTextField
          value={filters.search}
          onChange={(val) => handleFilterChange("search", val)}
          fullWidth
        />

        {/* Filters Row 1 */}
        <Stack
          direction="row"
          spacing={2}
          flexWrap="wrap"
          useFlexGap
          sx={{ alignItems: "center" }}
        >
          <Box sx={{ minWidth: 150 }}>
            <FilterSelect
              label="Status"
              value={filters.status}
              onChange={(val) => handleFilterChange("status", val)}
              options={statusOptions}
            />
          </Box>
          <Box sx={{ minWidth: 150 }}>
            <FilterSelect
              label="Priority"
              value={filters.priority}
              onChange={(val) => handleFilterChange("priority", val)}
              options={priorityOptions}
            />
          </Box>
          <Box sx={{ minWidth: 150 }}>
            <FilterSelect
              label="Type"
              value={filters.taskType}
              onChange={(val) => handleFilterChange("taskType", val)}
              options={typeOptions}
            />
          </Box>
        </Stack>

        {/* Filters Row 2 */}
        <Stack
          direction="row"
          spacing={2}
          flexWrap="wrap"
          useFlexGap
          sx={{ alignItems: "center" }}
        >
          <Box sx={{ minWidth: 200 }}>
            <FilterSelect
              label="Assignee"
              value={filters.assignee}
              onChange={(val) => handleFilterChange("assignee", val?.value)}
              options={assigneeOptions}
            />
          </Box>
          <Box sx={{ minWidth: 200 }}>
            <FilterSelect
              label="Vendor"
              value={filters.vendor}
              onChange={(val) => handleFilterChange("vendor", val?.value)}
              options={vendorOptions}
            />
          </Box>
        </Stack>

        {/* Filters Row 3: Date & Toggles */}
        <Stack
          direction="row"
          spacing={2}
          flexWrap="wrap"
          useFlexGap
          sx={{ alignItems: "center" }}
        >
          <FilterDateRange
            value={dateRangeValue}
            onChange={handleDateRangeChange}
          />

          <FormControlLabel
            control={
              <Switch
                checked={!!filters.isDeleted}
                onChange={(e) =>
                  handleFilterChange("isDeleted", e.target.checked)
                }
              />
            }
            label="Show Deleted"
          />
        </Stack>

        {/* Active Chips */}
        <FilterChipGroup
          filters={filters}
          labelMap={LABEL_MAP}
          onDelete={handleDeleteChip}
          onClearAll={handleClearAll}
        />
      </Stack>
    </Box>
  );
};

export default TaskFilter;
