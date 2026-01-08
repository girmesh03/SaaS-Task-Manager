/**
 * MuiChip Component - Reusable Chip
 *
 * Requirements: 30.5
 */

import { forwardRef } from "react";
import { Chip } from "@mui/material";

const MuiChip = forwardRef(
  (
    {
      label,
      avatar,
      icon,
      variant = "filled",
      size = "small",
      color = "default",
      clickable = false,
      onDelete,
      onClick,
      sx,
      ...muiProps
    },
    ref
  ) => {
    return (
      <Chip
        ref={ref}
        label={label}
        avatar={avatar}
        icon={icon}
        variant={variant}
        size={size}
        color={color}
        clickable={clickable || !!onClick}
        onDelete={onDelete}
        onClick={onClick}
        sx={sx}
        {...muiProps}
      />
    );
  }
);

MuiChip.displayName = "MuiChip";

export default MuiChip;
