/**
 * Sidebar Component - Navigation Sidebar
 *
 * Requirements: 17.5, 17.6, 9.2
 */


import { useLocation, useNavigate } from "react-router";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
  Box,
  useTheme,
  useMediaQuery,
  Tooltip,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AssignmentIcon from "@mui/icons-material/Assignment";
import PeopleIcon from "@mui/icons-material/People";
import BusinessIcon from "@mui/icons-material/Business";
import CategoryIcon from "@mui/icons-material/Category";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import ApartmentIcon from "@mui/icons-material/Apartment";
import SettingsIcon from "@mui/icons-material/Settings";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../redux/features/authSlice";
import { USER_ROLES } from "../../utils/constants";

const drawerWidth = 240;
const collapsedWidth = 65;

const Sidebar = ({ open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector(selectCurrentUser);
  const isSuperAdmin = user?.role === USER_ROLES.SUPER_ADMIN;

  const menuItems = [
    {
      text: "Dashboard",
      icon: <DashboardIcon />,
      path: "/dashboard",
      allowed: true, // Everyone sees dashboard
    },
    {
      text: "Tasks",
      icon: <AssignmentIcon />,
      path: "/tasks",
      allowed: true,
    },
    {
      text: "Departments",
      icon: <BusinessIcon />,
      path: "/departments",
      allowed: true,
    },
    {
      text: "Users",
      icon: <PeopleIcon />,
      path: "/users",
      allowed: true,
    },
    {
      text: "Materials",
      icon: <CategoryIcon />,
      path: "/materials",
      allowed: true,
    },
    {
      text: "Vendors",
      icon: <LocalShippingIcon />,
      path: "/vendors",
      allowed: true,
    },
    {
      text: "Organizations",
      icon: <ApartmentIcon />,
      path: "/organizations",
      allowed: isSuperAdmin, // Only SuperAdmin
    },
  ];

  const handleNavigate = (path) => {
    navigate(path);
    if (isMobile) {
      onClose();
    }
  };

  const drawerContent = (
    <Box sx={{ overflow: "hidden" }}>
      <Toolbar /> {/* Spacer for Header */}
      <List>
        {menuItems.map((item) => {
           if (!item.allowed) return null;

           const isActive = location.pathname.startsWith(item.path);

           return (
             <ListItem key={item.text} disablePadding sx={{ display: "block" }}>
                <Tooltip title={!open && !isMobile ? item.text : ""} placement="right">
                 <ListItemButton
                   sx={{
                     minHeight: 48,
                     justifyContent: open ? "initial" : "center",
                     px: 2.5,
                     bgcolor: isActive ? "action.selected" : "transparent",
                     borderRight: isActive ? `3px solid ${theme.palette.primary.main}` : "3px solid transparent",
                     "&:hover": {
                       bgcolor: "action.hover",
                     },
                   }}
                   onClick={() => handleNavigate(item.path)}
                 >
                   <ListItemIcon
                     sx={{
                       minWidth: 0,
                       mr: open ? 3 : "auto",
                       justifyContent: "center",
                       color: isActive ? "primary.main" : "text.secondary",
                     }}
                   >
                     {item.icon}
                   </ListItemIcon>
                   <ListItemText
                     primary={item.text}
                     sx={{
                       opacity: open ? 1 : 0,
                       color: isActive ? "text.primary" : "text.secondary",
                       fontWeight: isActive ? 600 : 400
                     }}
                   />
                 </ListItemButton>
               </Tooltip>
             </ListItem>
           );
        })}
      </List>
      <Divider sx={{ my: 1 }} />
      <List>
        <ListItem disablePadding sx={{ display: "block" }}>
          <Tooltip title={!open && !isMobile ? "Settings" : ""} placement="right">
            <ListItemButton
              sx={{
                 minHeight: 48,
                 justifyContent: open ? "initial" : "center",
                 px: 2.5,
               }}
               onClick={() => handleNavigate("/settings")}
            >
              <ListItemIcon
                 sx={{
                   minWidth: 0,
                   mr: open ? 3 : "auto",
                   justifyContent: "center",
                 }}
              >
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Settings" sx={{ opacity: open ? 1 : 0 }} />
            </ListItemButton>
          </Tooltip>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { md: open ? drawerWidth : collapsedWidth }, flexShrink: { md: 0 } }}
      aria-label="mailbox folders"
    >
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={open && isMobile}
        onClose={onClose}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: open ? drawerWidth : collapsedWidth,
            transition: theme.transitions.create("width", {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflowX: "hidden",
          },
        }}
        open={open}
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
