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
  ListSubheader,
  Toolbar,
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
import { toast } from "react-toastify";
import useAuth from "../../hooks/useAuth";
import { USER_ROLES } from "../../utils/constants";
import { canAccessRoute } from "../../router/routeUtils";

const drawerWidth = 240;
const collapsedWidth = 65;

const Sidebar = ({ open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Grouped menu items
  const menuGroups = [
    {
      title: "Workspace",
      items: [
        {
          text: "Dashboard",
          icon: <DashboardIcon />,
          path: "/dashboard",
          allowed: true, // Everyone
        },
        {
          text: "Users",
          icon: <PeopleIcon />,
          path: "/users",
          allowed: true, // Everyone
        },
        {
          text: "Tasks",
          icon: <AssignmentIcon />,
          path: "/tasks",
          allowed: true, // Everyone
        },
      ],
    },
    {
      title: "Manage",
      items: [
        {
          text: "Departments",
          icon: <BusinessIcon />,
          path: "/departments",
          allowed: canAccessRoute(
            user,
            [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN],
            false,
            true // Require HOD or higher roles
          ),
        },
        {
          text: "Materials",
          icon: <CategoryIcon />,
          path: "/materials",
          allowed: canAccessRoute(
            user,
            [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN],
            false
          ),
        },
        {
          text: "Vendors",
          icon: <LocalShippingIcon />,
          path: "/vendors",
          allowed: canAccessRoute(
            user,
            [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN],
            false
          ),
        },
      ],
    },
    {
      title: "Platform",
      items: [
        {
          text: "Organizations",
          icon: <ApartmentIcon />,
          path: "/organizations",
          allowed: canAccessRoute(user, [USER_ROLES.SUPER_ADMIN], true),
        },
      ],
    },
  ];

  const handleNavigate = (item) => {
    // Double check permission before navigating (though UI should hide it)
    if (!item.allowed) {
      toast.error("You do not have permission to access this page.");
      return;
    }

    navigate(item.path);
    if (isMobile) {
      onClose();
    }
  };

  const drawerContent = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Toolbar /> {/* Spacer for Header */}
      <Box sx={{ flex: 1, overflowY: "auto", overflowX: 'hidden', py: 2 }}>
        {menuGroups.map((section) => {
          // Filter allowed items for this section
          const allowedItems = section.items.filter((item) => item.allowed);

          // Don't render section if no items are allowed
          if (allowedItems.length === 0) return null;

          return (
            <List
              key={section.title}
              subheader={
                <ListSubheader
                  component="div"
                  disableSticky
                  sx={{
                    bgcolor: "transparent",
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    color: "text.secondary",
                    lineHeight: "32px",
                    px: 2.5,
                    display: open || isMobile ? "block" : "none", // Hide when collapsed
                  }}
                >
                  {section.title}
                </ListSubheader>
              }
              sx={{ py: 0 }}
            >
              {allowedItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path);

                return (
                  <ListItem
                    key={item.text}
                    disablePadding
                    sx={{ display: "block", mb: 0.5 }}
                  >
                    <Tooltip
                      title={!open && !isMobile ? item.text : ""}
                      placement="right"
                      disableInteractive
                      enterDelay={300}
                    >
                      <ListItemButton
                        sx={{
                          minHeight: "auto",
                          justifyContent: open || isMobile ? "initial" : "center",
                          px: 2.5,
                          bgcolor: isActive ? "action.selected" : "transparent",
                          borderRight: isActive && (!isMobile || open)
                            ? `3px solid ${theme.palette.primary.main}`
                            : "3px solid transparent",
                          "&:hover": {
                            bgcolor: "action.hover",
                          },
                        }}
                        onClick={() => handleNavigate(item)}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 0,
                            mr: open || isMobile ? 3 : "auto",
                            justifyContent: "center",
                            color: isActive ? "primary.main" : "text.secondary",
                          }}
                        >
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.text}
                          sx={{
                            opacity: open || isMobile ? 1 : 0,
                            color: isActive ? "text.primary" : "text.secondary",
                            fontWeight: isActive ? 600 : 400,
                          }}
                        />
                      </ListItemButton>
                    </Tooltip>
                  </ListItem>
                );
              })}
            </List>
          );
        })}
      </Box>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{
        width: { md: open ? drawerWidth : collapsedWidth },
        flexShrink: { md: 0 },
        transition: theme.transitions.create("width", {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
      }}
      aria-label="mailbox folders"
    >
      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        open={open}
        onClose={onClose}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          "& .MuiDrawer-paper": {
            backgroundImage: 'none',
            boxSizing: "border-box",
            width: isMobile ? drawerWidth : (open ? drawerWidth : collapsedWidth),
            transition: theme.transitions.create("width", {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflowX: "hidden"
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
