import { useState, useEffect } from "react";
import { useNavigate, Link, useParams } from "react-router";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import {
    Button,
    Box,
    Typography,
    Alert,
    Card,
    CardContent,
    IconButton,
    Divider,
    CircularProgress,
    LinearProgress,
} from "@mui/material";
import MuiTextField from "../components/common/MuiTextField";
import LockIcon from "@mui/icons-material/Lock";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import LockResetIcon from "@mui/icons-material/LockReset";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import { useAuth } from "../hooks/useAuth";
import { LIMITS } from "../utils/constants";
import { handleApiError } from "../utils/errorHandler";

const ResetPasswordPage = () => {
    const navigate = useNavigate();
    const { token } = useParams();
    const {
        isAuthenticated,
        isLoading,
        error,
        resetPassword: resetPasswordAction,
    } = useAuth();

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);

    // Redirect if user is already authenticated
    useEffect(() => {
        if (isAuthenticated && !isLoading) {
            navigate("/dashboard", { replace: true });
        }
    }, [isAuthenticated, isLoading, navigate]);

    // Redirect if token is missing
    useEffect(() => {
        if (!token && !isLoading) {
            const resetInitiated = sessionStorage.getItem("passwordResetInitiated");
            if (!resetInitiated) {
                toast.error("Invalid or missing reset token. Please request a new link.");
                navigate("/forgot-password", { replace: true });
            }
        }
    }, [token, navigate, isLoading]);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isDirty, isValid, isSubmitting },
        setFocus,
        getValues,
    } = useForm({
        mode: "onChange",
        defaultValues: { password: "", confirmPassword: "" },
    });

    const passwordValue = watch("password", "");

    // Update password strength
    useEffect(() => {
        let score = 0;
        if (!passwordValue) {
            setPasswordStrength(0);
            return;
        }
        if (passwordValue.length >= 8) score += 25;
        if (/[A-Z]/.test(passwordValue)) score += 25;
        if (/[0-9]/.test(passwordValue)) score += 25;
        if (/[@$!%*?&]/.test(passwordValue)) score += 25;
        setPasswordStrength(score);
    }, [passwordValue]);

    useEffect(() => {
        if (token) {
            setFocus("password");
        }
    }, [token, setFocus]);

    const handleClickShowPassword = () => setShowPassword((show) => !show);
    const handleClickShowConfirmPassword = () => setShowConfirmPassword((show) => !show);
    const handleMouseDownPassword = (event) => event.preventDefault();

    const onSubmit = async ({ password }) => {
        try {
            const result = await resetPasswordAction({
                token,
                password,
            });

            toast.success(result.message || "Password has been reset successfully!");
            setResetSuccess(true);
            sessionStorage.removeItem("passwordResetInitiated");

            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate("/login", {
                    replace: true,
                    state: {
                        message: "Password reset successful. Please login with your new password.",
                    },
                });
            }, 3000);
        } catch (err) {
            const parsedError = handleApiError(err);
            toast.error(parsedError.message);
        }
    };

    const getStrengthColor = (score) => {
        if (score <= 25) return "error";
        if (score <= 50) return "warning";
        if (score <= 75) return "info";
        return "success";
    };

    const getStrengthLabel = (score) => {
        if (score <= 25) return "Weak";
        if (score <= 50) return "Fair";
        if (score <= 75) return "Good";
        return "Strong";
    };

    if (resetSuccess) {
        return (
            <Card variant="outlined" sx={{ maxWidth: 420, width: "100%", boxShadow: 2, mx: "auto" }}>
                <CardContent sx={{ p: { xs: 3, sm: 4 }, textAlign: "center" }}>
                    <CheckCircleIcon sx={{ fontSize: 64, color: "success.main", mb: 2 }} />
                    <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
                        Reset Successful!
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        Your password has been successfully updated. Redirecting to login...
                    </Typography>
                    <Button variant="contained" color="primary" onClick={() => navigate("/login")} sx={{ mt: 2 }}>
                        Go to Login Now
                    </Button>
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
                        {token ? "New Password" : "Reset Password"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {token
                            ? "Please enter and confirm your new strong password."
                            : "Invalid or missing reset token. Please follow the link sent to your email."}
                    </Typography>
                </Box>

                {token ? (
                    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
                        <MuiTextField
                            {...register("password", {
                                required: "Password is required",
                                minLength: {
                                    value: LIMITS.PASSWORD_MIN,
                                    message: `Password must be at least ${LIMITS.PASSWORD_MIN} characters`,
                                },
                                ...(import.meta.env.PROD && {
                                    pattern: {
                                        value:
                                            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                                        message:
                                            "Password must contain uppercase, lowercase, number and special character",
                                    },
                                }),
                            })}
                            label="New Password"
                            placeholder="••••••••"
                            type={showPassword ? "text" : "password"}
                            fullWidth
                            size="small"
                            margin="normal"
                            error={errors.password}
                            startAdornment={<LockIcon fontSize="small" color="primary" />}
                            endAdornment={
                                <IconButton onClick={handleClickShowPassword} onMouseDown={handleMouseDownPassword} edge="end" size="small">
                                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                </IconButton>
                            }
                        />

                        {passwordValue && (
                            <Box sx={{ mt: 1, mb: 1 }}>
                                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Strength: <strong>{getStrengthLabel(passwordStrength)}</strong>
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {passwordStrength}%
                                    </Typography>
                                </Box>
                                <LinearProgress
                                    variant="determinate"
                                    value={passwordStrength}
                                    color={getStrengthColor(passwordStrength)}
                                    sx={{ height: 6, borderRadius: 3 }}
                                />
                            </Box>
                        )}

                        <MuiTextField
                            {...register("confirmPassword", {
                                required: "Confirm password is required",
                                validate: (value) => value === getValues("password") || "Passwords do not match",
                            })}
                            label="Confirm New Password"
                            placeholder="••••••••"
                            type={showConfirmPassword ? "text" : "password"}
                            fullWidth
                            size="small"
                            margin="normal"
                            error={errors.confirmPassword}
                            startAdornment={<LockIcon fontSize="small" color="primary" />}
                            endAdornment={
                                <IconButton onClick={handleClickShowConfirmPassword} onMouseDown={handleMouseDownPassword} edge="end" size="small">
                                    {showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                </IconButton>
                            }
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
                            {isSubmitting ? "Updating..." : "Update Password"}
                        </Button>
                    </Box>
                ) : (
                    <Box sx={{ mt: 2 }}>
                        <Alert severity="warning" variant="outlined">
                            We couldn't find a valid reset token in your request. If you've already received a reset email, please use the link provided.
                        </Alert>
                        <Button
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3 }}
                            onClick={() => navigate("/forgot-password")}
                        >
                            Request New Link
                        </Button>
                    </Box>
                )}

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

export default ResetPasswordPage;
