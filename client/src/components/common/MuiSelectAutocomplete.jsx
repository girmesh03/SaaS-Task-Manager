/**
 * MuiSelectAutocomplete Component - Reusable Autocomplete with React Hook Form Integration
 *
 * Wraps MUI Autocomplete with Controller from react-hook-form.
 * Provides search/filter, async loading, grouping, and consistent styling.
 *
 * Features:
 * - Single/multiple selection
 * - Async options loading with loading state
 * - Search/filter with custom filterOptions
 * - Grouping support
 * - Proper ref forwarding
 * - Theme styling applied
 *
 * Requirements: 15.4, 28.5
 */

import { Controller } from "react-hook-form";
import { Autocomplete, TextField, CircularProgress, Box } from "@mui/material";
import PropTypes from "prop-types";

/**
 * MuiSelectAutocomplete Component
 *
 * @param {Object} props - Component props
 * @param {Object} props.control - React Hook Form control object
 * @param {string} props.name - Field name for form registration
 * @param {string} props.label - Field label
 * @param {Object} props.rules - Validation rules (react-hook-form format)
 * @param {any} props.defaultValue - Default value for the field
 * @param {Array} props.options - Array of options
 * @param {boolean} props.multiple - Whether to allow multiple selection (default: false)
 * @param {boolean} props.isLoading - Whether options are loading
 * @param {Function} props.getOptionLabel - Function to get option label (default: option => option.label || option)
 * @param {Function} props.getOptionValue - Function to get option value (default: option => option.value || option)
 * @param {Function} props.isOptionEqualToValue - Function to compare options (default: (option, value) => option === value)
 * @param {Function} props.filterOptions - Custom filter function
 * @param {Function} props.groupBy - Function to group options
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.disabled - Whether field is disabled
 * @param {boolean} props.required - Whether field is required (visual indicator)
 * @param {boolean} props.fullWidth - Whether field takes full width (default: true)
 * @param {string} props.size - Field size (small, medium)
 * @param {string} props.variant - Field variant (outlined, filled, standard)
 * @param {boolean} props.freeSolo - Whether to allow free text input
 * @param {boolean} props.disableClearable - Whether to disable clear button
 * @param {number} props.limitTags - Maximum number of tags to show (for multiple)
 * @param {string} props.noOptionsText - Text to show when no options available
 * @param {string} props.loadingText - Text to show while loading
 *
 * @returns {JSX.Element} MuiSelectAutocomplete component
 *
 * @example
 * // Basic single selection
 * <MuiSelectAutocomplete
 *   control={control}
 *   name="department"
 *   label="Department"
 *   options={departments}
 *   getOptionLabel={(option) => option.name}
 *   getOptionValue={(option) => option._id}
 *   rules={{ required: "Department is required" }}
 * />
 *
 * @example
 * // Multiple selection
 * <MuiSelectAutocomplete
 *   control={control}
 *   name="assignees"
 *   label="Assignees"
 *   options={users}
 *   multiple
 *   getOptionLabel={(option) => option.fullName}
 *   getOptionValue={(option) => option._id}
 *   rules={{ required: "At least one assignee is required" }}
 * />
 *
 * @example
 * // With async loading
 * <MuiSelectAutocomplete
 *   control={control}
 *   name="vendor"
 *   label="Vendor"
 *   options={vendors}
 *   isLoading={isLoadingVendors}
 *   getOptionLabel={(option) => option.name}
 *   getOptionValue={(option) => option._id}
 * />
 *
 * @example
 * // With grouping
 * <MuiSelectAutocomplete
 *   control={control}
 *   name="material"
 *   label="Material"
 *   options={materials}
 *   groupBy={(option) => option.category}
 *   getOptionLabel={(option) => option.name}
 *   getOptionValue={(option) => option._id}
 * />
 */
const MuiSelectAutocomplete = ({
  control,
  name,
  label,
  rules = {},
  defaultValue = null,
  options = [],
  multiple = false,
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
  freeSolo = false,
  disableClearable = false,
  limitTags = 2,
  noOptionsText = "No options",
  loadingText = "Loading...",
  ...otherProps
}) => {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      defaultValue={multiple ? [] : defaultValue}
      render={({ field: { onChange, value, ref }, fieldState: { error } }) => {
        return (
          <Box sx={{ width: fullWidth ? "100%" : "auto" }}>
            <Autocomplete
              value={value || (multiple ? [] : null)}
              onChange={(event, newValue) => {
                onChange(newValue);
              }}
              options={options}
              multiple={multiple}
              loading={isLoading}
              getOptionLabel={getOptionLabel}
              isOptionEqualToValue={isOptionEqualToValue}
              filterOptions={filterOptions}
              groupBy={groupBy}
              disabled={disabled}
              freeSolo={freeSolo}
              disableClearable={disableClearable}
              limitTags={limitTags}
              noOptionsText={noOptionsText}
              loadingText={loadingText}
              size={size}
              fullWidth={fullWidth}
              slotProps={{
                textField: {
                  inputRef: ref, // Forward ref correctly
                  label,
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
          </Box>
        );
      }}
    />
  );
};

MuiSelectAutocomplete.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  rules: PropTypes.object,
  defaultValue: PropTypes.any,
  options: PropTypes.array,
  multiple: PropTypes.bool,
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
  freeSolo: PropTypes.bool,
  disableClearable: PropTypes.bool,
  limitTags: PropTypes.number,
  noOptionsText: PropTypes.string,
  loadingText: PropTypes.string,
};

export default MuiSelectAutocomplete;
