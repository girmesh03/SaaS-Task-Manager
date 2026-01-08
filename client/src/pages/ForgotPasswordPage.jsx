import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import {
  Button,
  Box,
  Typography,
  Alert,
  Card,
  CardContent,
  Divider,
  CircularProgress,
} from "@mui/material";
import MuiTextField from "../components/common/MuiTextField";
import EmailIcon from "@mui/icons-material/Email";
import LockResetIcon from "@mui/icons-material/LockReset";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import InfoIcon from "@mui/icons-material/Info";

import { useAuth } from "../hooks/useAuth";
import { handleApiError } from "../utils/errorHandler";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const {
    isAuthenticated,
    isLoading,
    error,
    forgotPassword: forgotPasswordAction,
  } = useAuth();

  const [emailSent, setEmailSent] = useState(false);

  // Redirect if user is already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors: emailErrors, isDirty, isValid, isSubmitting },
    setFocus,
  } = useForm({
    mode: "onChange",
    defaultValues: { email: "" },
  });

  useEffect(() => {
    setFocus("email");
  }, [setFocus]);

  const onSubmitEmail = async ({ email }) => {
    try {
      const result = await forgotPasswordAction({ email });

      toast.success(
        result.message || "Password reset link has been sent to your email address."
      );
      setEmailSent(true);
      // Set session storage to allow access to reset-password even if they guess URL (though they need token)
      sessionStorage.setItem("passwordResetInitiated", "true");
    } catch (err) {
      const parsedError = handleApiError(err);
      toast.error(parsedError.message);
    }
  };

  if (emailSent) {
    return (
      <Card variant="outlined" sx={{ maxWidth: 480, width: "100%", boxShadow: 2, mx: "auto" }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 }, textAlign: "center" }}>
          <InfoIcon sx={{ fontSize: 64, color: "info.main", mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
            Check Your Email
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            We've sent a password reset link to your email address. Please check your inbox (and spam folder) to continue.
          </Typography>
          <Alert severity="info" sx={{ mb: 3, textAlign: "left" }}>
            The link will expire in 1 hour for your security.
          </Alert>
          <Button variant="outlined" color="primary" onClick={() => setEmailSent(false)}>
            Didn't receive it? Try again
          </Button>
          <Box sx={{ mt: 3 }}>
            <Link to="/login" style={{ textDecoration: "none" }}>
              <Button variant="text" startIcon={<ArrowBackIcon />}>
                Back to Login
              </Button>
            </Link>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined" sx={{ maxWidth: 480, width: "100%", boxShadow: 2, mx: "auto" }}>
      <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <LockResetIcon sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
            Forgot Password?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Enter your email address and we'll send you a link to reset your password.
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit(onSubmitEmail)} noValidate>
          <MuiTextField
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Please enter a valid email address",
              },
            })}
            label="Email Address"
            placeholder="e.g. john@example.com"
            type="email"
            fullWidth
            size="small"
            margin="normal"
            autoComplete="email"
            error={emailErrors.email}
            startAdornment={<EmailIcon fontSize="small" color="primary" />}
          />

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {typeof error === "string" ? error : handleApiError(error).message}
            </Alert>
          )}

          <Button
            fullWidth
            variant="contained"
            color="secondary"
            type="submit"
            disabled={isSubmitting || !isDirty || !isValid}
            sx={{ mt: 3, py: 1.5, fontWeight: 600 }}
            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isSubmitting ? "Sending..." : "Send Reset Link"}
          </Button>
        </Box>

        <Divider sx={{ my: 3 }}>
          <Typography variant="body2" color="text.secondary">OR</Typography>
        </Divider>

        <Box sx={{ textAlign: "center" }}>
          <Link to="/login" style={{ textDecoration: "none" }}>
            <Button variant="text" startIcon={<ArrowBackIcon />}>
              Back to Login
            </Button>
          </Link>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ForgotPasswordPage;
