import express from "express";
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  updateProfile,
  getAccount,
  getProfile,
  deleteUser,
  restoreUser,
} from "../controllers/userControllers.js";
import {
  createUserValidator,
  updateUserValidator,
  userIdValidator,
} from "../middlewares/validators/userValidators.js";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/authorization.js";

/**
 * User Routes
 *
 * CRITICAL: All routes are protected and require authentication
 * CRITICAL: Authorization based on role and scope
 * CRITICAL: Organization scoping for Customer SuperAdmin/Admin
 * CRITICAL: Some routes have "own" scope for users to manage their own profiles
 */

const router = express.Router();

/**
 * @route   GET /api/users
 * @desc    Get all users (scoped to organization for Customer SuperAdmin/Admin)
 * @access  Protected (authorize User read)
 */
router.get("/", verifyJWT, authorize("User", "read"), getUsers);

/**
 * @route   GET /api/users/:userId
 * @desc    Get single user by ID
 * @access  Protected (authorize User read)
 */
router.get(
  "/:userId",
  verifyJWT,
  userIdValidator,
  authorize("User", "read"),
  getUser
);

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Protected (authorize User create)
 */
router.post(
  "/",
  verifyJWT,
  createUserValidator,
  authorize("User", "create"),
  createUser
);

/**
 * @route   PUT /api/users/:userId
 * @desc    Update user
 * @access  Protected (authorize User update)
 */
router.put(
  "/:userId",
  verifyJWT,
  userIdValidator,
  updateUserValidator,
  authorize("User", "update"),
  updateUser
);

/**
 * @route   PUT /api/users/:userId/profile
 * @desc    Update own profile (users can update own profile with restrictions)
 * @access  Protected (authorize User update own)
 */
router.put(
  "/:userId/profile",
  verifyJWT,
  userIdValidator,
  updateUserValidator,
  authorize("User", "update"),
  updateProfile
);

/**
 * @route   GET /api/users/:userId/account
 * @desc    Get current user's account information
 * @access  Protected (authorize User read own)
 */
router.get(
  "/:userId/account",
  verifyJWT,
  userIdValidator,
  authorize("User", "read"),
  getAccount
);

/**
 * @route   GET /api/users/:userId/profile
 * @desc    Get current user's profile and dashboard data
 * @access  Protected (authorize User read own)
 */
router.get(
  "/:userId/profile",
  verifyJWT,
  userIdValidator,
  authorize("User", "read"),
  getProfile
);

/**
 * @route   DELETE /api/users/:userId
 * @desc    Soft delete user with cascade
 * @access  Protected (authorize User delete)
 */
router.delete(
  "/:userId",
  verifyJWT,
  userIdValidator,
  authorize("User", "delete"),
  deleteUser
);

/**
 * @route   PATCH /api/users/:userId/restore
 * @desc    Restore soft-deleted user
 * @access  Protected (authorize User update for restore)
 */
router.patch(
  "/:userId/restore",
  verifyJWT,
  userIdValidator,
  authorize("User", "update"),
  restoreUser
);

export default router;
