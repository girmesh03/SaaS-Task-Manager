/**
 * MuiSkeleton Component - Reusable Loading Skeleton
 *
 * Requirements: 15.10, 30.10
 */

import { Skeleton, Box } from "@mui/material";

const MuiSkeleton = ({
  variant = "rectangular",
  width,
  height,
  animation = "wave",
  count = 1,
  spacing = 1,
  sx,
  ...muiProps
}) => {
  if (count > 1) {
    return (
      <Box sx={{ width: width || "100%" }}>
        {Array.from({ length: count }).map((_, index) => (
          <Skeleton
            key={index}
            variant={variant}
            width={width}
            height={height}
            animation={animation}
            sx={{ mb: index < count - 1 ? spacing : 0, ...sx }}
            {...muiProps}
          />
        ))}
      </Box>
    );
  }

  return (
    <Skeleton
      variant={variant}
      width={width}
      height={height}
      animation={animation}
      sx={sx}
      {...muiProps}
    />
  );
};

export default MuiSkeleton;
