/**
 * MuiSpeedDial Component - Reusable Speed Dial
 *
 * Requirements from Task 7.6
 */

import { forwardRef } from "react";
import { SpeedDial, SpeedDialIcon, SpeedDialAction } from "@mui/material";

const MuiSpeedDial = forwardRef(
  (
    {
      actions = [], // Array of { icon, name, onClick }
      icon, // Default is <SpeedDialIcon />
      direction = "up",
      ariaLabel = "SpeedDial",
      sx,
      position = { bottom: 16, right: 16 },
      ...muiProps
    },
    ref
  ) => {
    return (
      <SpeedDial
        ref={ref}
        ariaLabel={ariaLabel}
        sx={{
          position: "absolute",
          ...position,
          ...sx,
        }}
        icon={icon || <SpeedDialIcon />}
        direction={direction}
        {...muiProps}
      >
        {actions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            slotProps={{ tooltip: { title: action.name } }}
            onClick={action.onClick}
          />
        ))}
      </SpeedDial>
    );
  }
);

MuiSpeedDial.displayName = "MuiSpeedDial";

export default MuiSpeedDial;
