import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { useForm } from "react-hook-form";
import {
  Button,
  Box,
  Typography,
  Alert,
  IconButton,
  Divider,
  CircularProgress,
  Card,
  CardContent,
  Grid,
} from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import EmailIcon from "@mui/icons-material/Email";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { toast } from "react-toastify";
import { useAuth } from "../../../hooks/useAuth";
import { MuiTextField, MuiCheckbox, PlatformIconLogo } from "../../common";
import { LIMITS } from "../../../utils/constants";
import { handleApiError } from "../../../utils/errorHandler";

const LoginForm = () => {
  const { isLoading, error, login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isValid },
  } = useForm({
    mode: "onTouched",
    reValidateMode: "onBlur",
    defaultValues: { email: "", password: "" },
  });

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const onSubmit = async (data) => {
    try {
      await login(data);
      const from = location.state?.from || "/dashboard";
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(handleApiError(err).message);
    }
  };

  return (
    <Card
      variant="outlined"
      sx={{
        maxWidth: 440,
        width: "100%",
        boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
        borderRadius: 3,
        mx: "auto",
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 5 } }}>
        <Grid container spacing={3}>
          {/* Header Section */}
          <Grid size={{ xs: 12 }}>
            <Grid container direction="column" alignItems="center" spacing={1} sx={{ textAlign: "center", mb: 1 }}>
              <Grid>
                <PlatformIconLogo
                  sx={{
                    fontSize: 56,
                    color: "primary.main",
                    filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.1))",
                    mb: 1
                  }}
                />
              </Grid>
              <Grid>
                <Typography
                  variant="h4"
                  component="h1"
                  color="text.primary"
                  fontWeight={700}
                  sx={{ letterSpacing: "-0.02em" }}
                >
                  Welcome Back
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.8, mt: 0.5 }}>
                  Sign in to your account with your credentials
                </Typography>
              </Grid>
            </Grid>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
              <Grid container spacing={2}>
                {/* Login Error Alert */}
                {error && (
                  <Grid size={{ xs: 12 }} sx={{ mb: 1 }}>
                    <Alert severity="error">
                      {typeof error === "string"
                        ? error
                        : handleApiError(error).message}
                    </Alert>
                  </Grid>
                )}

                {/* Email Field */}
                <Grid size={{ xs: 12 }}>
                  <MuiTextField
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Please enter a valid email address",
                      },
                    })}
                    error={errors.email}
                    label="Email Address"
                    placeholder="e.g. john@example.com"
                    type="email"
                    fullWidth
                    size="small"
                    autoComplete="email"
                    autoFocus
                    startAdornment={<EmailIcon fontSize="small" color="primary" />}
                  />
                </Grid>

                {/* Forgot Password Link (Top Right of Password Field) */}
                <Grid size={{ xs: 12 }} sx={{ mb: -1.5, mt: 0.5 }}>
                  <Grid container justifyContent="flex-end">
                    <Grid>
                      <Link
                        to="/forgot-password"
                        style={{ textDecoration: "none" }}
                      >
                        <Typography
                          variant="body2"
                          color="primary.main"
                          sx={{
                            fontWeight: 600,
                            fontSize: "0.8125rem",
                            "&:hover": { textDecoration: "underline" },
                          }}
                        >
                          Forgot password?
                        </Typography>
                      </Link>
                    </Grid>
                  </Grid>
                </Grid>

                {/* Password Field */}
                <Grid size={{ xs: 12 }}>
                  <MuiTextField
                    {...register("password", {
                      required: "Password is required",
                      minLength: {
                        value: LIMITS.PASSWORD_MIN,
                        message: `Password must be at least ${LIMITS.PASSWORD_MIN} characters`,
                      },
                    })}
                    error={errors.password}
                    label="Password"
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                    fullWidth
                    size="small"
                    autoComplete="current-password"
                    startAdornment={<LockIcon fontSize="small" color="primary" />}
                    endAdornment={
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        onMouseDown={handleMouseDownPassword}
                        edge="end"
                        size="small"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <VisibilityOff fontSize="small" />
                        ) : (
                          <Visibility fontSize="small" />
                        )}
                      </IconButton>
                    }
                  />
                </Grid>

                {/* Stay signed in (Below Password Field Left Side) */}
                <Grid size={{ xs: 12 }} sx={{ mt: -1 }}>
                  <MuiCheckbox
                    label="Stay signed in"
                    size="small"
                    sx={{
                      p: 0,
                      "& .MuiFormControlLabel-label": {
                        fontSize: "0.875rem"
                      }
                    }}
                  />
                </Grid>

                {/* Submit Button */}
                <Grid size={{ xs: 12 }} sx={{ mt: 1 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="secondary"
                    type="submit"
                    disabled={isLoading || !isDirty || !isValid}
                    sx={{
                      py: 1.5,
                      fontSize: "1rem",
                      fontWeight: 600,
                      borderRadius: 2,
                      textTransform: "none",
                      transition: "all 0.2s",
                      "&:not(:disabled):hover": {
                        transform: "translateY(-1px)",
                        boxShadow: (theme) => `0 4px 12px ${theme.palette.secondary.main}40`,
                      },
                    }}
                    startIcon={
                      isLoading ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : null
                    }
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Grid container direction="column" spacing={2.5}>
              <Grid size={{ xs: 12 }}>
                <Divider />
              </Grid>

              {/* Register Link */}
              <Grid size={{ xs: 12 }} sx={{ textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary" sx={{ display: 'inline-block' }}>
                  Don't have an account?{" "}
                </Typography>
                <Link
                  to="/register"
                  style={{ textDecoration: "none", display: 'inline-block', marginLeft: '4px' }}
                >
                  <Typography
                    component="span"
                    variant="body2"
                    color="primary.main"
                    sx={{
                      fontWeight: 600,
                      "&:hover": { textDecoration: "underline" },
                    }}
                  >
                    Create an organization
                  </Typography>
                </Link>
              </Grid>

              <Grid size={{ xs: 12 }} sx={{ textAlign: "center", px: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Having trouble signing in? Contact your organization administrator.
                </Typography>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default LoginForm;

