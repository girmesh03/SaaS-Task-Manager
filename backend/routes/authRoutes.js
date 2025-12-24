import express from "express";
import {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
} from "../controllers/authControllers.js";
import {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} from "../middlewares/validators/authValidators.js";
import {
  verifyJWT,
  verifyRefreshTokenMiddleware,
} from "../middlewares/authMiddleware.js";
import { authRateLimiter } from "../middlewares/rateLimiter.js";

/**
 * Authentication Routes
 *
 * CRITICAL: All routes are rate limited (5/15min in production)
 * CRITICAL: Public routes: register, login, forgot-password, reset-password
 * CRITICAL: Protected routes: logout, refresh-token
 */

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register new organization, department, and user
 * @access  Public (rate limited 5/15min)
 */
router.post("/register", authRateLimiter, registerValidator, register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public (rate limited 5/15min)
 */
router.post("/login", authRateLimiter, loginValidator, login);

/**
 * @route   DELETE /api/auth/logout
 * @desc    Logout user
 * @access  Protected (rate limited 5/15min)
 */
router.delete("/logout", authRateLimiter, verifyJWT, logout);

/**
 * @route   GET /api/auth/refresh-token
 * @desc    Refresh access token
 * @access  Protected (rate limited 5/15min)
 */
router.get(
  "/refresh-token",
  authRateLimiter,
  verifyRefreshTokenMiddleware,
  refreshToken
);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public (rate limited 5/15min)
 */
router.post(
  "/forgot-password",
  authRateLimiter,
  forgotPasswordValidator,
  forgotPassword
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public (rate limited 5/15min)
 */
router.post(
  "/reset-password",
  authRateLimiter,
  resetPasswordValidator,
  resetPassword
);

export default router;
