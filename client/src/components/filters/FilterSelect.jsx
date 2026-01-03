/**
 * FilterSelect Component - Dropdown Filter
 *
 * Requirements: 16.2
 */

import MuiSelectAutocomplete from "../common/MuiSelectAutocomplete";

const FilterSelect = ({
  options = [],
  value,
  onChange,
  label,
  placeholder,
  multiple = false,
  ...others
}) => {
  return (
    <MuiSelectAutocomplete
      value={value}
      onChange={onChange}
      options={options}
      label={label}
      placeholder={
        placeholder || (multiple ? `Select ${label}` : `All ${label}`)
      }
      multiple={multiple}
      size="small"
      disableClearable={!multiple} // Allow clearing for single select (acts as "All")
      {...others}
    />
  );
};

export default FilterSelect;
