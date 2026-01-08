import { useEffect } from "react";
import { useNavigate } from "react-router";
import { Box, Typography, Button, Container, Grid, Paper, Stack } from "@mui/material";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import ShieldIcon from "@mui/icons-material/Shield";
import GroupIcon from "@mui/icons-material/Group";
import LaptopMacIcon from "@mui/icons-material/LaptopMac";

import { useAuth } from "../hooks/useAuth";

const FeatureCard = ({ icon, title, description }) => (
  <Paper
    elevation={0}
    sx={{
      p: 3,
      height: "100%",
      bgcolor: "background.paper",
      border: 1,
      borderColor: "divider",
      borderRadius: 4,
      transition: "transform 0.2s, box-shadow 0.2s",
      "&:hover": {
        transform: "translateY(-4px)",
        boxShadow: (theme) => theme.shadows[4],
      },
    }}
  >
    <Box sx={{ color: "primary.main", mb: 2 }}>{icon}</Box>
    <Typography variant="h6" fontWeight={700} gutterBottom>
      {title}
    </Typography>
    <Typography variant="body2" color="text.secondary">
      {description}
    </Typography>
  </Paper>
);

const HomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: { xs: 4, md: 8 } }}>
        <Grid container spacing={6} alignItems="center">
          {/* Hero Section */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ textAlign: { xs: "center", md: "left" } }}>
              <Typography
                variant="overline"
                color="primary.main"
                fontWeight={700}
                sx={{ letterSpacing: 1.5 }}
              >
                Modern Task Management
              </Typography>
              <Typography
                variant="h1"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: "2.5rem", sm: "3.5rem", md: "4rem" },
                  mb: 2,
                  lineHeight: 1.1,
                }}
              >
                Organize work <br />
                <Box
                  component="span"
                  sx={{
                    color: "primary.main",
                    background:
                      "linear-gradient(90deg, #1976d2 0%, #9c27b0 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  efficiently.
                </Box>
              </Typography>
              <Typography
                variant="h5"
                color="text.secondary"
                sx={{ mb: 4, fontWeight: 400, lineHeight: 1.6 }}
              >
                The ultimate multi-tenant task manager designed for high-performance teams.
                Manage projects, track time, and collaborate in real-time.
              </Typography>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                sx={{ justifyContent: { xs: "center", md: "flex-start" } }}
              >
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate("/register")}
                  startIcon={<RocketLaunchIcon />}
                  sx={{
                    py: 1.5,
                    px: 4,
                    borderRadius: 2,
                    fontSize: "1rem",
                    fontWeight: 700,
                    textTransform: "none",
                    boxShadow: (theme) => theme.shadows[8],
                  }}
                >
                  Get Started Free
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate("/login")}
                  sx={{
                    py: 1.5,
                    px: 4,
                    borderRadius: 2,
                    fontSize: "1rem",
                    fontWeight: 700,
                    textTransform: "none",
                  }}
                >
                  Sign In
                </Button>
              </Stack>
            </Box>
          </Grid>

          {/* Right Section / Illustration Placeholder */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box
              sx={{
                position: "relative",
                display: "flex",
                justifyContent: "center",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  width: "120%",
                  height: "120%",
                  background: "radial-gradient(circle, rgba(25,118,210,0.1) 0%, transparent 70%)",
                  zIndex: -1,
                },
              }}
            >
              <Paper
                elevation={12}
                sx={{
                  p: 2,
                  borderRadius: 4,
                  bgcolor: "background.paper",
                  border: 1,
                  borderColor: "divider",
                  width: "100%",
                  maxWidth: 500,
                  overflow: "hidden",
                }}
              >
                <Box
                  component="img"
                  src="https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&q=80&w=1000"
                  alt="Task Management"
                  sx={{
                    width: "100%",
                    borderRadius: 2,
                    display: "block",
                  }}
                />
              </Paper>
            </Box>
          </Grid>
        </Grid>

        {/* Features Section */}
        <Box sx={{ mt: { xs: 8, md: 12 } }}>
          <Typography
            variant="h3"
            textAlign="center"
            fontWeight={800}
            gutterBottom
            sx={{ mb: 6 }}
          >
            Why choose TaskManager?
          </Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <FeatureCard
                icon={<ShieldIcon fontSize="large" />}
                title="Secure by Design"
                description="Enterprise-grade security with role-based access control and encrypted data storage."
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <FeatureCard
                icon={<GroupIcon fontSize="large" />}
                title="Multi-Tenant"
                description="Seamlessly isolate organization data while maintaining a smooth user experience."
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <FeatureCard
                icon={<LaptopMacIcon fontSize="large" />}
                title="Responsive"
                description="Access your tasks from anywhere, on any device. Fully optimized for mobile and desktop."
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <FeatureCard
                icon={<RocketLaunchIcon fontSize="large" />}
                title="High Performance"
                description="Real-time updates and lightning-fast interface powered by modern technology."
              />
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Container>
  );
};

export default HomePage;

