/**
 * MuiBackdrop Component - Reusable Backdrop
 *
 * Requirements: 30.8
 */

import { forwardRef } from "react";
import { Backdrop, CircularProgress } from "@mui/material";

const MuiBackdrop = forwardRef(
  (
    {
      open = false,
      onClick,
      loading = true,
      color = "inherit",
      zIndex,
      children,
      sx,
      ...muiProps
    },
    ref
  ) => {
    return (
      <Backdrop
        ref={ref}
        sx={{
          color: "#fff",
          zIndex: (theme) => zIndex || theme.zIndex.drawer + 1,
          ...sx,
        }}
        open={open}
        onClick={onClick}
        {...muiProps}
      >
        {loading && <CircularProgress color={color} />}
        {children}
      </Backdrop>
    );
  }
);

MuiBackdrop.displayName = "MuiBackdrop";

export default MuiBackdrop;
