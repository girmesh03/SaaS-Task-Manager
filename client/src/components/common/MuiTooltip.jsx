/**
 * MuiTooltip Component - Reusable Tooltip
 *
 * Requirements: 30.7
 */

import { forwardRef } from "react";
import { Tooltip, Zoom } from "@mui/material";

const MuiTooltip = forwardRef(
  (
    {
      title,
      placement = "top",
      arrow = true,
      TransitionComponent = Zoom,
      enterDelay = 200,
      children,
      ...muiProps
    },
    ref
  ) => {
    return (
      <Tooltip
        ref={ref}
        title={title}
        placement={placement}
        arrow={arrow}
        TransitionComponent={TransitionComponent}
        enterDelay={enterDelay}
        {...muiProps}
      >
        {children}
      </Tooltip>
    );
  }
);

MuiTooltip.displayName = "MuiTooltip";

export default MuiTooltip;
