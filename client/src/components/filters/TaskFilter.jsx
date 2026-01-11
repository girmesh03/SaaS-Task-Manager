/**
 * TaskFilter Component - Filter bar for Tasks
 *
 * Requirements: 16.6
 */

import { Box, Grid, FormControlLabel, Switch } from "@mui/material";
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
      <Grid container spacing={2} alignItems="flex-start">
        {/* Row 1: Status, Priority, Type, Assignee, Vendor, Deleted */}
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <FilterSelect
            label="Status"
            value={filters.status}
            onChange={(val) => handleFilterChange("status", val)}
            options={statusOptions}
          />
        </Grid>

        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <FilterSelect
            label="Priority"
            value={filters.priority}
            onChange={(val) => handleFilterChange("priority", val)}
            options={priorityOptions}
          />
        </Grid>

        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <FilterSelect
            label="Type"
            value={filters.taskType}
            onChange={(val) => handleFilterChange("taskType", val)}
            options={typeOptions}
          />
        </Grid>

        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <FilterSelect
            label="Assignee"
            value={filters.assignee}
            onChange={(val) => handleFilterChange("assignee", val?.value)}
            options={assigneeOptions}
          />
        </Grid>

        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <FilterSelect
            label="Vendor"
            value={filters.vendor}
            onChange={(val) => handleFilterChange("vendor", val?.value)}
            options={vendorOptions}
          />
        </Grid>

        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <Box
            sx={{
              height: 40,
              display: "flex",
              alignItems: "center",
              border: 1,
              borderColor: "divider",
              borderRadius: 1,
              px: 1.5,
              bgcolor: "background.paper",
            }}
          >
            <FormControlLabel
              control={
                <Switch
                  checked={!!filters.isDeleted}
                  onChange={(e) =>
                    handleFilterChange("isDeleted", e.target.checked)
                  }
                  size="small"
                />
              }
              label="Deleted"
              sx={{
                m: 0,
                "& .MuiFormControlLabel-label": {
                  fontSize: "0.875rem",
                  color: "text.secondary",
                },
              }}
            />
          </Box>
        </Grid>

        {/* Row 2: Date Range */}
        <Grid size={12}>
          <FilterDateRange
            value={dateRangeValue}
            onChange={handleDateRangeChange}
          />
        </Grid>

        {/* Row 3: Active Chips */}
        <Grid size={12}>
          <FilterChipGroup
            filters={filters}
            labelMap={LABEL_MAP}
            onDelete={handleDeleteChip}
            onClearAll={handleClearAll}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default TaskFilter;
