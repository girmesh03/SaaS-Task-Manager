/**
 * ProfilePage Component - User Profile
 *
 * Displays and allows editing of user's own profile.
 * Placeholder component - will be fully implemented in a later task.
 *
 * Requirements: 4.7, 4.8
 */

import { Box, Typography, Paper } from "@mui/material";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../redux/features/authSlice";

const ProfilePage = () => {
  const user = useSelector(selectCurrentUser);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        My Profile
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        View and edit your profile
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          {user?.firstName} {user?.lastName}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {user?.email}
        </Typography>
        <Typography variant="body2" color="text.disabled" sx={{ mt: 2 }}>
          Profile details - To be implemented
        </Typography>
      </Paper>
    </Box>
  );
};

export default ProfilePage;
