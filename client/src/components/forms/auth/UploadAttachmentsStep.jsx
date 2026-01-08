// src/components/forms/auth/UploadAttachmentsStep.jsx
import { Box, Typography, Grid } from "@mui/material";

const UploadAttachmentsStep = () => {
  return (
    <Grid container spacing={3} justifyContent="center">
      <Grid size={{ xs: 12 }}>
        <Box textAlign="center" py={4}>
          <Typography variant="h5" gutterBottom color="primary.main">
            Upload Attachments
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            This step is for uploading profile picture, organization logo, and
            additional attachments.
          </Typography>
          <div>
            <Typography variant="body2" color="text.secondary">
              UploadAttachments component will be implemented here
            </Typography>
          </div>
        </Box>
      </Grid>
    </Grid>
  );
};

export default UploadAttachmentsStep;
