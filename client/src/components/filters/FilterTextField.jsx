/**
 * FilterTextField Component - Debounced Search Input for Filters
 *
 * Requirements: 16.1
 */

import { useState, useEffect } from "react";
import { InputAdornment, IconButton } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import MuiTextField from "../common/MuiTextField";
import useDebounce from "../../hooks/useDebounce";

const FilterTextField = ({
  value = "",
  onChange,
  placeholder = "Search...",
  debounceTime = 300,
  ...muiProps
}) => {
  const [localValue, setLocalValue] = useState(value);
  const debouncedValue = useDebounce(localValue, debounceTime);

  // Sync local state when prop changes (e.g. clear filters externally)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Notify parent when debounced value changes
  useEffect(() => {
    // Only call onChange if the value is different from what might be passed in prop
    // to avoid cycles, although usually parent updates prop to match.
    // Actually, simply calling onChange when debounced changes is the standard pattern.
    // The parent will receive the new value and update state.
    if (debouncedValue !== value) {
      onChange(debouncedValue);
    }
  }, [debouncedValue, onChange, value]);

  const handleClear = () => {
    setLocalValue("");
    // Trigger immediate clear or let debounce handle it?
    // User expects immediate clear usually.
    // But consistency implies debounce. However, for "Clear", immediate is better UX.
    // Let's set local value to empty. The effect will run.
    // If we want immediate update, we can call onChange("") directly too,
    // but that might cause double update if effect runs.
    // Let's just set local value and let debounce handle it,
    // OR we can force it. For search, 300ms delay on clear is acceptable.
  };

  return (
    <MuiTextField
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      placeholder={placeholder}
      size="small"
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" fontSize="small" />
            </InputAdornment>
          ),
          endAdornment: localValue ? (
            <InputAdornment position="end">
              <IconButton
                aria-label="clear search"
                onClick={handleClear}
                edge="end"
                size="small"
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : null,
        },
      }}
      {...muiProps}
    />
  );
};

export default FilterTextField;
