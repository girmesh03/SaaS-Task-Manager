/**
 * MaterialFilter Component - Filter bar for Materials
 *
 * Requirements: 16.8
 */

import { Box, Stack, FormControlLabel, Switch } from "@mui/material";
import FilterTextField from "./FilterTextField";
import FilterSelect from "./FilterSelect";
import FilterChipGroup from "./FilterChipGroup";
import { MATERIAL_CATEGORIES } from "../../utils/constants";

const MaterialFilter = ({
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
  const categoryOptions = Object.values(MATERIAL_CATEGORIES);
  const departmentOptions = departments.map((d) => ({
    label: d.name,
    value: d._id,
  }));

  const LABEL_MAP = {
    search: "Search",
    category: "Category",
    department: "Department",
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
          <Box sx={{ minWidth: 200 }}>
            <FilterSelect
              label="Category"
              value={filters.category}
              onChange={(val) => handleFilterChange("category", val)}
              options={categoryOptions}
            />
          </Box>
          <Box sx={{ minWidth: 200 }}>
             <FilterSelect
              label="Department"
              value={filters.department}
              onChange={(val) => handleFilterChange("department", val?.value)}
              options={departmentOptions}
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

export default MaterialFilter;
