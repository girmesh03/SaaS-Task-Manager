/**
 * Header Component - Main Application Header
 *
 * Requirements: 17.4, 17.10, 9.1
 */

import { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  Avatar,
  Chip,
  useTheme,
  Button,
  Divider,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import { useSelector, useDispatch } from "react-redux";
import { selectCurrentUser, logout } from "../../redux/features/authSlice";
import NotificationMenu from "./NotificationMenu";
import GlobalSearch from "./GlobalSearch";
import MuiAvatar from "../common/MuiAvatar";

const Header = ({ onMenuClick }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const [anchorElUser, setAnchorElUser] = useState(null);

  // Trigger search modal via event or state
  // For simplicity, let's pretend clicking the search icon triggers the GlobalSearch component's own state
  // Ideally GlobalSearch would expose a control or context, but here we render it and let it handle keypress.
  // To trigger by click, we might need a shared state or ref.
  // Let's modify GlobalSearch to be controlled or handle click via a custom event for now.
  // Actually, standard Ctrl+K is global. Click needs to dispatch event `keydown` simulation or utilize state lift.
  // For this MVP, let's assume GlobalSearch is listening to a custom event or we dispatch the key press.
  const handleSearchClick = () => {
    // Dispatch Ctrl+K event to trigger GlobalSearch
    const event = new KeyboardEvent("keydown", {
      key: "k",
      ctrlKey: true,
      bubbles: true,
    });
    window.dispatchEvent(event);
  };

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    handleCloseUserMenu();
  };

  // Safe checks for user data
  const orgName = user?.organization?.name || "Task Manager";
  const isPlatformOrg = user?.organization?.isPlatformOrg;

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        bgcolor: "background.paper",
        color: "text.primary",
        boxShadow: 1,
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
      elevation={0}
    >
      <Toolbar>
        {/* Sidebar Toggle */}
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onMenuClick}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>

        {/* Logo / Org Name */}
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{ display: { xs: "none", sm: "block" }, fontWeight: "bold", mr: 2 }}
        >
          {orgName}
        </Typography>

        {isPlatformOrg && (
          <Chip
            label="Platform"
            size="small"
            color="primary"
            variant="outlined"
            sx={{ mr: 2, height: 20, fontSize: "0.625rem" }}
          />
        )}

        {/* Spacer */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Search Trigger */}
        <Button
          color="inherit"
          startIcon={<SearchIcon />}
          onClick={handleSearchClick}
          sx={{
            mr: 2,
            bgcolor: (theme) => theme.palette.action.hover,
            px: 2,
            borderRadius: 2,
            textTransform: "none",
            display: { xs: "none", md: "flex" },
            minWidth: 200,
            justifyContent: "space-between",
            border: 1,
            borderColor: "divider",
          }}
        >
           <Typography variant="body2" color="text.secondary">
             Search...
           </Typography>
           <Typography variant="caption" sx={{ border: 1, borderColor: "divider", px: 0.5, borderRadius: 0.5 }}>
             Ctrl K
           </Typography>
        </Button>
        <IconButton
          color="inherit"
          onClick={handleSearchClick}
          sx={{ display: { xs: "flex", md: "none" }, mr: 1 }}
        >
          <SearchIcon />
        </IconButton>

        {/* Notifications */}
        <NotificationMenu />

        {/* User Menu */}
        <Box sx={{ ml: 1 }}>
          <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
             <MuiAvatar
               src={user?.profilePicture}
               name={user?.fullName || "User"}
               sx={{ width: 40, height: 40 }}
             />
          </IconButton>
          <Menu
            sx={{ mt: "45px" }}
            id="menu-appbar"
            anchorEl={anchorElUser}
            anchorOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            keepMounted
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            open={Boolean(anchorElUser)}
            onClose={handleCloseUserMenu}
            slotProps={{
                paper: { sx: { width: 200 } }
            }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="subtitle2" noWrap>
                  {user?.fullName}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {user?.email}
                </Typography>
            </Box>
            <Divider />
            <MenuItem onClick={handleCloseUserMenu}>
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={handleCloseUserMenu}>
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              Settings
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" color="error" />
              </ListItemIcon>
              <Typography color="error">Logout</Typography>
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>

      {/* Global Search Modal (mounted but hidden) */}
      <GlobalSearch />
    </AppBar>
  );
};

export default Header;
