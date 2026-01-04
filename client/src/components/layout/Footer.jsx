/**
 * Footer Component - Application Footer
 *
 * Requirements: 17.5, 9.3
 */

import { Box, Typography, Link } from "@mui/material";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: "auto",
        textAlign: "center",
        backgroundColor: (theme) =>
          theme.palette.mode === "light"
            ? theme.palette.grey[100]
            : theme.palette.grey[800],
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {"Copyright © "}
        <Link color="inherit" href="#">
          SaaS Task Manager
        </Link>{" "}
        {currentYear}
        {"."}
      </Typography>

      <Box sx={{ mt: 1, display: "flex", justifyContent: "center", gap: 2 }}>
        <Link
          href="#"
          color="text.secondary"
          variant="caption"
          underline="hover"
        >
          Privacy Policy
        </Link>
        <Link
          href="#"
          color="text.secondary"
          variant="caption"
          underline="hover"
        >
          Terms of Service
        </Link>
        <Link
          href="#"
          color="text.secondary"
          variant="caption"
          underline="hover"
        >
          Help Center
        </Link>
      </Box>

      <Typography
        variant="caption"
        color="text.disabled"
        sx={{ display: "block", mt: 1 }}
      >
        v1.0.0
      </Typography>
    </Box>
  );
};

export default Footer;
