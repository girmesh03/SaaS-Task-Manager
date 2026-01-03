/**
 * MuiMenu Component - Reusable Menu
 *
 * Requirements from Task 7.6
 */

import { forwardRef } from "react";
import { Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";

const MuiMenu = forwardRef(
  (
    {
      anchorEl,
      open,
      onClose,
      items = [], // Array of { id, label, icon, onClick, divider, disabled }
      dense = false,
      slotProps,
      ...muiProps
    },
    ref
  ) => {
    return (
      <Menu
        ref={ref}
        anchorEl={anchorEl}
        open={open}
        onClose={onClose}
        slotProps={slotProps}
        {...muiProps}
      >
        {items.map((item, index) => {
          if (item.divider) {
            return (
              <MenuItem key={`divider-${index}`} divider disabled>
                <div style={{ width: "100%", height: 1 }} />
              </MenuItem>
            );
          }

          return (
            <MenuItem
              key={item.id || index}
              onClick={() => {
                if (item.onClick) item.onClick();
                if (onClose) onClose();
              }}
              disabled={item.disabled}
              dense={dense}
            >
              {item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
              <ListItemText>{item.label}</ListItemText>
            </MenuItem>
          );
        })}
      </Menu>
    );
  }
);

MuiMenu.displayName = "MuiMenu";

export default MuiMenu;
