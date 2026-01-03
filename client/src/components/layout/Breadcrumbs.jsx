/**
 * Breadcrumbs Component - Navigation Breadcrumbs
 *
 * Requirements: 17.5, 9.3
 */

import { useLocation, Link as RouterLink } from "react-router-dom";
import { Breadcrumbs as MuiBreadcrumbs, Link, Typography, Box } from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";

const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  // Map pathnames to readable labels if needed
  const getLabel = (name) => {
    // Capitalize first letter
    return name.charAt(0).toUpperCase() + name.slice(1);
    // Add more logic here for IDs -> Names resolution if desired
  };

  if (pathnames.length === 0) {
    return null; // Don't show on root if unnecessary or handle differently
  }

  return (
    <Box sx={{ mb: 2 }}>
      <MuiBreadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="breadcrumb"
      >
        <Link
          underline="hover"
          color="inherit"
          component={RouterLink}
          to="/dashboard"
        >
          Dashboard
        </Link>
        {pathnames.map((value, index) => {
          const last = index === pathnames.length - 1;
          const to = `/${pathnames.slice(0, index + 1).join("/")}`;

          // Skip "dashboard" if it's in the path (already added as home)
          if (value === "dashboard") return null;

          return last ? (
            <Typography color="text.primary" key={to} sx={{ fontWeight: 500 }}>
              {getLabel(value)}
            </Typography>
          ) : (
            <Link
              underline="hover"
              color="inherit"
              component={RouterLink}
              to={to}
              key={to}
            >
              {getLabel(value)}
            </Link>
          );
        })}
      </MuiBreadcrumbs>
    </Box>
  );
};

export default Breadcrumbs;
