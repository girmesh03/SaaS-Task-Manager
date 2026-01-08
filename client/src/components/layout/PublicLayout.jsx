import { Outlet, useNavigate } from "react-router";
import { Box, AppBar, Toolbar, Typography, Container } from "@mui/material";
import { PlatformIconLogo } from "../common/CustomIcons";
import MuiThemeDropDown from "../common/MuiThemeDropDown";

/**
 * PublicLayout Component - Layout for Auth Pages
 *
 * Requirements: 17.3, 9.4
 */
const PublicLayout = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        overflow: "hidden",
      }}
    >
      {/* Public Header */}
      <AppBar
        position="static"
        elevation={0}
        sx={{
          bgcolor: "background.paper",
          color: "text.primary",
          borderBottom: 1,
          borderColor: "divider",
          zIndex: (theme) => theme.zIndex.drawer + 2,
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between" }}>
          {/* Logo and Brand Name */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              cursor: "pointer",
            }}
            onClick={() => navigate("/")}
          >
            <PlatformIconLogo />
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "text.primary",
                display: { xs: "none", sm: "block" },
              }}
            >
              TaskManager
            </Typography>
          </Box>

          {/* Theme Toggle */}
          <MuiThemeDropDown />
        </Toolbar>
      </AppBar>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: "100%",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Container
          maxWidth="lg"
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            py: { xs: 4, md: 8 },
            px: 1,
          }}
        >
          <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
            <Outlet />
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default PublicLayout;

