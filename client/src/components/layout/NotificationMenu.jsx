/**
 * NotificationMenu Component - Notification Bell with Dropdown
 *
 * Requirements: 17.10
 */

import { useState } from "react";
import {
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Badge,
  Box,
  Divider,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import MuiAvatar from "../common/MuiAvatar";
import { formatRelativeTime } from "../../utils/dateUtils";

const NotificationMenu = () => {
  const [anchorEl, setAnchorEl] = useState(null);

  // Mock notifications for now - integrate with RTK Query later
  const [notifications] = useState(() => [
    {
      _id: "1",
      title: "New Task Assigned",
      message: "You have been assigned to 'Update Homepage'",
      createdAt: new Date().toISOString(),
      read: false,
    },
    {
      _id: "2",
      title: "Comment Mention",
      message: "Alice mentioned you in 'Bug #123'",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      read: true,
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton color="inherit" onClick={handleClick} size="large">
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          paper: { sx: { width: 320, maxHeight: 400 } },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">Notifications</Typography>
        </Box>
        <Divider />
        {notifications.length === 0 ? (
          <Box sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              No new notifications
            </Typography>
          </Box>
        ) : (
          notifications.map((notification) => (
            <MenuItem
              key={notification._id}
              onClick={handleClose}
              sx={{
                py: 2,
                px: 2,
                whiteSpace: "normal",
                bgcolor: notification.read ? "transparent" : "action.hover",
              }}
            >
              <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
                <MuiAvatar
                  name={notification.title} // Or sender name if available
                  sx={{ width: 40, height: 40, fontSize: "1rem" }}
                />
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: notification.read ? 400 : 600 }}
                  >
                    {notification.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {notification.message}
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    {formatRelativeTime(notification.createdAt)}
                  </Typography>
                </Box>
              </Box>
            </MenuItem>
          ))
        )}
        <Divider />
        <Box sx={{ p: 1, textAlign: "center" }}>
          <Typography
            variant="button"
            color="primary"
            sx={{ cursor: "pointer", fontSize: "0.875rem" }}
            onClick={handleClose}
          >
            View All
          </Typography>
        </Box>
      </Menu>
    </>
  );
};

export default NotificationMenu;
