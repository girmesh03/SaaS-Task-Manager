/**
 * MuiToggleButton Component - Reusable Toggle Button Group
 *
 * Requirements from Task 7.6
 */

import { forwardRef } from "react";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";

const MuiToggleButton = forwardRef(
  (
    {
      value,
      onChange,
      options = [], // Array of { value, label, icon, ariaLabel }
      exclusive = true,
      size = "medium",
      color = "standard",
      orientation = "horizontal",
      fullWidth = false,
      sx,
      ...muiProps
    },
    ref
  ) => {
    return (
      <ToggleButtonGroup
        ref={ref}
        value={value}
        exclusive={exclusive}
        onChange={onChange}
        size={size}
        color={color}
        orientation={orientation}
        fullWidth={fullWidth}
        sx={sx}
        {...muiProps}
      >
        {options.map((option) => (
          <ToggleButton
            key={option.value}
            value={option.value}
            aria-label={option.ariaLabel || option.label}
            disabled={option.disabled}
          >
            {option.icon}
            {option.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    );
  }
);

MuiToggleButton.displayName = "MuiToggleButton";

export default MuiToggleButton;
