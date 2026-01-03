/**
 * MuiMultiSelect Component - Reusable Multi-Select with React Hook Form Integration
 *
 * Extends MuiSelectAutocomplete with multiple prop for multi-selection.
 * Displays selected items as Chips with delete icon.
 *
 * Features:
 * - Multiple selection with chips display
 * - Max items validation
 * - "Select all" option
 * - Selected count in label
 * - All MuiSelectAutocomplete features
 *
 * Requirements: 15.5, 28.6
 */

import { Controller } from "react-hook-form";
import { useMemo } from "react";
import {
  Autocomplete,
  TextField,
  CircularProgress,
  Box,
  Chip,
  Checkbox,
  FormHelperText,
} from "@mui/material";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import PropTypes from "prop-types";

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

/**
 * MuiMultiSelect Component
 *
 * @param {Object} props - Component props
 * @param {Object} props.control - React Hook Form control object
 * @param {string} props.name - Field name for form registration
 * @param {string} props.label - Field label
 * @param {Object} props.rules - Validation rules (react-hook-form format)
 * @param {Array} props.defaultValue - Default value for the field (array)
 * @param {Array} props.options - Array of options
 * @param {number} props.maxItems - Maximum number of items that can be selected
 * @param {boolean} props.selectAll - Whether to show "Select all" option (default: false)
 * @param {boolean} props.showCount - Whether to show selected count in label (default: true)
 * @param {boolean} props.isLoading - Whether options are loading
 * @param {Function} props.getOptionLabel - Function to get option label
 * @param {Function} props.getOptionValue - Function to get option value
 * @param {Function} props.isOptionEqualToValue - Function to compare options
 * @param {Function} props.filterOptions - Custom filter function
 * @param {Function} props.groupBy - Function to group options
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.disabled - Whether field is disabled
 * @param {boolean} props.required - Whether field is required (visual indicator)
 * @param {boolean} props.fullWidth - Whether field takes full width (default: true)
 * @param {string} props.size - Field size (small, medium)
 * @param {string} props.variant - Field variant (outlined, filled, standard)
 * @param {number} props.limitTags - Maximum number of tags to show
 * @param {string} props.noOptionsText - Text to show when no options available
 * @param {string} props.loadingText - Text to show while loading
 *
 * @returns {JSX.Element} MuiMultiSelect component
 *
 * @example
 * // Basic usage
 * <MuiMultiSelect
 *   control={control}
 *   name="assignees"
 *   label="Assignees"
 *   options={users}
 *   getOptionLabel={(option) => option.fullName}
 *   getOptionValue={(option) => option._id}
 *   rules={{ required: "At least one assignee is required" }}
 * />
 *
 * @example
 * // With max items validation
 * <MuiMultiSelect
 *   control={control}
 *   name="watchers"
 *   label="Watchers"
 *   options={hodUsers}
 *   maxItems={20}
 *   getOptionLabel={(option) => option.fullName}
 *   getOptionValue={(option) => option._id}
 *   rules={{
 *     validate: (value) => value.length <= 20 || "Maximum 20 watchers allowed"
 *   }}
 * />
 *
 * @example
 * // With "Select all" option
 * <MuiMultiSelect
 *   control={control}
 *   name="skills"
 *   label="Skills"
 *   options={skillOptions}
 *   selectAll
 *   maxItems={10}
 *   getOptionLabel={(option) => option.skill}
 * />
 */
const MuiMultiSelect = ({
  control,
  name,
  label,
  rules = {},
  defaultValue = [],
  options = [],
  maxItems,
  selectAll = false,
  showCount = true,
  isLoading = false,
  getOptionLabel = (option) => option?.label || option?.name || option || "",
  getOptionValue = (option) => option?.value || option?._id || option,
  isOptionEqualToValue = (option, value) => {
    if (!option || !value) return false;
    return getOptionValue(option) === getOptionValue(value);
  },
  filterOptions,
  groupBy,
  placeholder,
  disabled = false,
  required = false,
  fullWidth = true,
  size = "medium",
  variant = "outlined",
  limitTags = 2,
  noOptionsText = "No options",
  loadingText = "Loading...",
  ...otherProps
}) => {
  // Memoize options with "Select all" to prevent re-creation on every render
  const optionsWithSelectAll = useMemo(() => {
    return selectAll
      ? [{ label: "Select all", value: "SELECT_ALL" }, ...options]
      : options;
  }, [selectAll, options]);

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      defaultValue={defaultValue}
      render={({ field: { onChange, value }, fieldState: { error } }) => {
        const selectedCount = value?.length || 0;
        const isMaxReached = maxItems && selectedCount >= maxItems;

        // Handle "Select all" functionality
        const handleSelectAll = (event, newValue) => {
          if (selectAll && newValue.length > 0) {
            const selectAllOption = newValue.find(
              (option) => getOptionValue(option) === "SELECT_ALL"
            );

            if (selectAllOption) {
              // If "Select all" is clicked, select all options (excluding "Select all" itself)
              const allOptions = options.filter(
                (option) => getOptionValue(option) !== "SELECT_ALL"
              );
              onChange(allOptions);
              return;
            }
          }

          // Check max items limit
          if (maxItems && newValue.length > maxItems) {
            return; // Prevent selection beyond max
          }

          onChange(newValue);
        };

        // Generate label with count
        const labelWithCount =
          showCount && selectedCount > 0
            ? `${label} (${selectedCount}${maxItems ? `/${maxItems}` : ""})`
            : label;

        return (
          <Box sx={{ width: fullWidth ? "100%" : "auto" }}>
            <Autocomplete
              value={value || []}
              onChange={handleSelectAll}
              options={optionsWithSelectAll}
              multiple
              loading={isLoading}
              getOptionLabel={getOptionLabel}
              isOptionEqualToValue={isOptionEqualToValue}
              filterOptions={filterOptions}
              groupBy={groupBy}
              disabled={disabled}
              disableCloseOnSelect
              limitTags={limitTags}
              noOptionsText={noOptionsText}
              loadingText={loadingText}
              size={size}
              fullWidth={fullWidth}
              renderOption={(props, option, { selected }) => {
                const isSelectAll = getOptionValue(option) === "SELECT_ALL";

                return (
                  <li {...props} key={getOptionValue(option)}>
                    <Checkbox
                      icon={icon}
                      checkedIcon={checkedIcon}
                      style={{ marginRight: 8 }}
                      checked={
                        isSelectAll
                          ? selectedCount === options.length
                          : selected
                      }
                      indeterminate={
                        isSelectAll &&
                        selectedCount > 0 &&
                        selectedCount < options.length
                      }
                    />
                    {getOptionLabel(option)}
                  </li>
                );
              }}
              renderTags={(tagValue, getTagProps) =>
                tagValue.map((option, index) => (
                  <Chip
                    label={getOptionLabel(option)}
                    {...getTagProps({ index })}
                    size={size}
                    key={getOptionValue(option)}
                  />
                ))
              }
              slotProps={{
                textField: {
                  label: labelWithCount,
                  placeholder,
                  required,
                  error: !!error,
                  helperText: error?.message || " ", // Reserve space for error message
                  variant,
                },
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  slotProps={{
                    input: {
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {isLoading ? (
                            <CircularProgress color="inherit" size={20} />
                          ) : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    },
                  }}
                />
              )}
              {...otherProps}
            />

            {/* Max items warning */}
            {isMaxReached && (
              <FormHelperText
                sx={{
                  textAlign: "right",
                  mt: 0.5,
                  color: "warning.main",
                }}
              >
                Maximum {maxItems} items reached
              </FormHelperText>
            )}
          </Box>
        );
      }}
    />
  );
};

MuiMultiSelect.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  rules: PropTypes.object,
  defaultValue: PropTypes.array,
  options: PropTypes.array,
  maxItems: PropTypes.number,
  selectAll: PropTypes.bool,
  showCount: PropTypes.bool,
  isLoading: PropTypes.bool,
  getOptionLabel: PropTypes.func,
  getOptionValue: PropTypes.func,
  isOptionEqualToValue: PropTypes.func,
  filterOptions: PropTypes.func,
  groupBy: PropTypes.func,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  fullWidth: PropTypes.bool,
  size: PropTypes.oneOf(["small", "medium"]),
  variant: PropTypes.oneOf(["outlined", "filled", "standard"]),
  limitTags: PropTypes.number,
  noOptionsText: PropTypes.string,
  loadingText: PropTypes.string,
};

export default MuiMultiSelect;
