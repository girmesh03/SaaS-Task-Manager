/**
 * MuiList Component - Reusable List
 *
 * Requirements from Task 7.6
 */

import { forwardRef } from "react";
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Divider,
} from "@mui/material";

const MuiList = forwardRef(
  (
    {
      items = [], // Array of { id, icon, primary, secondary, onClick, divider, subheader }
      subheader,
      dense = false,
      disablePadding = false,
      sx,
      ...muiProps
    },
    ref
  ) => {
    return (
      <List
        ref={ref}
        sx={sx}
        dense={dense}
        disablePadding={disablePadding}
        subheader={subheader && <ListSubheader>{subheader}</ListSubheader>}
        {...muiProps}
      >
        {items.map((item, index) => {
          if (item.divider) {
            return <Divider key={index} component="li" />;
          }

          if (item.subheader) {
            return (
              <ListSubheader key={index} {...item.subheaderProps}>
                {item.subheader}
              </ListSubheader>
            );
          }

          const Wrapper = item.onClick ? ListItemButton : ListItem;

          return (
            <ListItem
              key={item.id || index}
              disablePadding={!!item.onClick}
              secondaryAction={item.secondaryAction}
              {...item.listItemProps}
            >
              <Wrapper onClick={item.onClick} selected={item.selected}>
                {item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
                <ListItemText
                  primary={item.primary}
                  secondary={item.secondary}
                />
              </Wrapper>
            </ListItem>
          );
        })}
      </List>
    );
  }
);

MuiList.displayName = "MuiList";

export default MuiList;
