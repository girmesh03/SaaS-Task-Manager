// src/components/forms/auth/ReviewStep.jsx
import { Box, Typography, Grid, Card, CardContent, Alert } from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PersonIcon from "@mui/icons-material/Person";
import WorkIcon from "@mui/icons-material/Work";
import DepartmentIcon from "@mui/icons-material/AccountTree";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import Check from "@mui/icons-material/Check";

const DetailItem = ({ icon, label, value }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "flex-start",
      gap: 1.5,
      mb: 2,
      p: 1.5,
      borderRadius: 1,
      bgcolor: "action.hover",
      transition: "all 0.2s",
      "&:hover": {
        bgcolor: "action.selected",
        transform: "translateX(4px)",
      },
    }}
  >
    <Box
      sx={{
        color: "primary.main",
        display: "flex",
        alignItems: "center",
        mt: 0.5,
      }}
    >
      {icon}
    </Box>
    <Box sx={{ flex: 1 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", mb: 0.5, fontWeight: 600 }}
      >
        {label}
      </Typography>
      <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
        {value || "—"}
      </Typography>
    </Box>
  </Box>
);

const ReviewStep = ({ getValues }) => {
  const values = getValues();

  return (
    <Grid container spacing={3}>
      {/* Organization Details Card */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Card
          variant="outlined"
          sx={{
            height: "100%",
            borderRadius: 2,
            boxShadow: 1,
            transition: "all 0.3s",
            "&:hover": {
              boxShadow: 3,
            },
          }}
        >
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
              <BusinessIcon color="primary" sx={{ fontSize: 28 }} />
              <Typography variant="h6" fontWeight={600} color="primary.main">
                Organization Details
              </Typography>
            </Box>

            <DetailItem
              icon={<BusinessIcon fontSize="small" />}
              label="Organization Name"
              value={values.organizationName}
            />
            <DetailItem
              icon={<EmailIcon fontSize="small" />}
              label="Email Address"
              value={values.organizationEmail}
            />
            <DetailItem
              icon={<PhoneIcon fontSize="small" />}
              label="Phone Number"
              value={values.organizationPhone}
            />
            <DetailItem
              icon={<LocationOnIcon fontSize="small" />}
              label="Address"
              value={values.organizationAddress}
            />
            <DetailItem
              icon={<HomeWorkIcon fontSize="small" />}
              label="Organization Size"
              value={values.organizationSize?.label || values.organizationSize}
            />
            <DetailItem
              icon={<WorkIcon fontSize="small" />}
              label="Industry"
              value={values.organizationIndustry?.label || values.organizationIndustry}
            />
            <DetailItem
              icon={<WorkIcon fontSize="small" />}
              label="Description"
              value={values.description}
            />
          </CardContent>
        </Card>
      </Grid>

      {/* Admin User Details Card */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Card
          variant="outlined"
          sx={{
            height: "100%",
            borderRadius: 2,
            boxShadow: 1,
            transition: "all 0.3s",
            "&:hover": {
              boxShadow: 3,
            },
          }}
        >
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
              <PersonIcon color="primary" sx={{ fontSize: 28 }} />
              <Typography variant="h6" fontWeight={600} color="primary.main">
                Admin User Details
              </Typography>
            </Box>

            <DetailItem
              icon={<PersonIcon fontSize="small" />}
              label="Full Name"
              value={`${values.firstName} ${values.lastName}`}
            />
            <DetailItem
              icon={<EmailIcon fontSize="small" />}
              label="Email Address"
              value={values.userEmail}
            />
            <DetailItem
              icon={<WorkIcon fontSize="small" />}
              label="Position"
              value={values.position}
            />
            <DetailItem
              icon={<DepartmentIcon fontSize="small" />}
              label="Department Name"
              value={values.departmentName}
            />
            <DetailItem
              icon={<DepartmentIcon fontSize="small" />}
              label="Department Description"
              value={values.departmentDesc}
            />
          </CardContent>
        </Card>
      </Grid>

      {/* Info Alert */}
      <Grid size={{ xs: 12 }}>
        <Alert
          severity="success"
          icon={<Check fontSize="inherit" />}
          sx={{
            borderRadius: 2,
            "& .MuiAlert-message": {
              width: "100%",
            },
          }}
        >
          <Typography variant="body2" fontWeight={600} gutterBottom>
            Ready to Create Your Organization
          </Typography>
          <Typography variant="body2">
            By registering, you will become the <strong>SuperAdmin</strong> of
            your organization with full administrative privileges. Please review
            all details carefully before proceeding.
          </Typography>
        </Alert>
      </Grid>
    </Grid>
  );
};

export default ReviewStep;
