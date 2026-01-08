/**
 * MuiAvatar Component - Reusable Avatar with Initials Fallback
 *
 * Requirements: 30.2
 */

import { forwardRef } from "react";
import { Avatar } from "@mui/material";

/**
 * Generates a color from a string
 */
const stringToColor = (string) => {
  let hash = 0;
  let i;

  /* eslint-disable no-bitwise */
  for (i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = "#";

  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  /* eslint-enable no-bitwise */

  return color;
};

/**
 * Generates avatar props based on name
 */
const stringAvatar = (name) => {
  if (!name) return {};

  const nameParts = name.split(" ");
  const initials =
    nameParts.length > 1
      ? `${nameParts[0][0]}${nameParts[1][0]}`
      : `${nameParts[0][0]}`;

  return {
    sx: {
      bgcolor: stringToColor(name),
    },
    children: initials.toUpperCase(),
  };
};

const MuiAvatar = forwardRef(
  ({ src, alt, name, size = 40, icon, sx, ...muiProps }, ref) => {
    // If src is provided, use standard Avatar
    if (src) {
      return (
        <Avatar
          ref={ref}
          src={src}
          alt={alt || name}
          sx={{ width: size, height: size, ...sx }}
          {...muiProps}
        />
      );
    }

    // If icon is passed, display it
    if (icon) {
      return (
        <Avatar
          ref={ref}
          alt={alt || name}
          sx={{
            width: size,
            height: size,
            ...sx,
          }}
          {...muiProps}
        >
          {icon}
        </Avatar>
      );
    }

    // Otherwise generate from name
    const stringProps = name ? stringAvatar(name) : {};

    return (
      <Avatar
        ref={ref}
        alt={alt || name}
        sx={{
          width: size,
          height: size,
          ...stringProps.sx,
          ...sx,
        }}
        {...muiProps}
      >
        {stringProps.children}
      </Avatar>
    );
  }
);

MuiAvatar.displayName = "MuiAvatar";

export default MuiAvatar;
