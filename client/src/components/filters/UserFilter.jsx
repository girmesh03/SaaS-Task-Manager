/**
 * UserFilter Component - Filter bar for Users
 *
 * Requirements: 16.7
 */

import { Box, Stack, FormControlLabel, Switch } from "@mui/material";
import FilterTextField from "./FilterTextField";
import FilterSelect from "./FilterSelect";
import FilterChipGroup from "./FilterChipGroup";
import { USER_ROLES, USER_STATUS } from "../../utils/constants";

const UserFilter = ({
  filters,
  onChange,
  departments = [], // Array of { _id, name }
}) => {
  const handleFilterChange = (key, value) => {
    onChange({
      ...filters,
      [key]: value,
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
    delete newFilters[key];
    onChange(newFilters);
  };

  // Options
  const roleOptions = Object.values(USER_ROLES);
  // Status usually refers to account status but we have USER_STATUS (Online presence)
  // We can also filter by 'isActive' if needed, but per requirements let's use USER_STATUS or maybe both?
  // Requirements say "status". Let's use USER_STATUS (Online, Offline, Away)
  const statusOptions = Object.values(USER_STATUS);

  const departmentOptions = departments.map((d) => ({
    label: d.name,
    value: d._id,
  }));

  const LABEL_MAP = {
    search: "Search",
    role: "Role",
    department: "Department",
    status: "Status",
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

        {/* Filter Row */}
        <Stack
          direction="row"
          spacing={2}
          flexWrap="wrap"
          useFlexGap
          sx={{ alignItems: "center" }}
        >
          <Box sx={{ minWidth: 150 }}>
            <FilterSelect
              label="Role"
              value={filters.role}
              onChange={(val) => handleFilterChange("role", val)}
              options={roleOptions}
            />
          </Box>
          <Box sx={{ minWidth: 150 }}>
            <FilterSelect
              label="Department"
              value={filters.department}
              onChange={(val) => handleFilterChange("department", val?.value)}
              options={departmentOptions}
            />
          </Box>
          <Box sx={{ minWidth: 150 }}>
             <FilterSelect
              label="Status"
              value={filters.status}
              onChange={(val) => handleFilterChange("status", val)}
              options={statusOptions}
            />
          </Box>

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

export default UserFilter;
