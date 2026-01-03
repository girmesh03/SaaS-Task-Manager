/**
 * MuiFAB Component - Reusable Floating Action Button
 *
 * Requirements from Task 7.6
 */

import { forwardRef } from "react";
import { Fab, Zoom } from "@mui/material";

const MuiFAB = forwardRef(
  (
    {
      color = "primary",
      size = "large",
      variant = "circular",
      onClick,
      disabled = false,
      children, // Icon
      sx,
      position, // { top, right, bottom, left } for absolute positioning
      animated = true,
      ...muiProps
    },
    ref
  ) => {
    const fab = (
      <Fab
        ref={ref}
        color={color}
        size={size}
        variant={variant}
        onClick={onClick}
        disabled={disabled}
        sx={{
          ...(position && {
            position: "absolute",
            ...position,
          }),
          ...sx,
        }}
        {...muiProps}
      >
        {children}
      </Fab>
    );

    if (animated) {
      return (
        <Zoom in={true} timeout={{ enter: 500, exit: 500 }} unmountOnExit>
          {fab}
        </Zoom>
      );
    }

    return fab;
  }
);

MuiFAB.displayName = "MuiFAB";

export default MuiFAB;
