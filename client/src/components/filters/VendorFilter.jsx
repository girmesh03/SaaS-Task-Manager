/**
 * VendorFilter Component - Filter bar for Vendors
 *
 * Requirements: 16.9
 */

import { Box, Stack, FormControlLabel, Switch } from "@mui/material";
import FilterTextField from "./FilterTextField";
import FilterChipGroup from "./FilterChipGroup";

const VendorFilter = ({
  filters,
  onChange,
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

  const LABEL_MAP = {
    search: "Search",
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

export default VendorFilter;
