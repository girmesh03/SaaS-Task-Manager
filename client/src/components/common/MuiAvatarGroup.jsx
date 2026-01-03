/**
 * MuiAvatarGroup Component - Reusable Avatar Group
 *
 * Requirements: 30.3
 */

import { forwardRef } from "react";
import { AvatarGroup } from "@mui/material";

const MuiAvatarGroup = forwardRef(
  ({ max = 4, spacing = "medium", sx, children, ...muiProps }, ref) => {
    return (
      <AvatarGroup
        ref={ref}
        max={max}
        spacing={spacing}
        sx={sx}
        {...muiProps}
      >
        {children}
      </AvatarGroup>
    );
  }
);

MuiAvatarGroup.displayName = "MuiAvatarGroup";

export default MuiAvatarGroup;
