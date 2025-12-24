import express from "express";
import {
  getOrganizations,
  getOrganization,
  updateOrganization,
  deleteOrganization,
  restoreOrganization,
} from "../controllers/organizationControllers.js";
import {
  updateOrganizationValidator,
  organizationIdValidator,
} from "../middlewares/validators/organizationValidators.js";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/authorization.js";

/**
 * Organization Routes
 *
 * CRITICAL: All routes are protected and require authentication
 * CRITICAL: Authorization based on role and scope (Platform SuperAdmin has crossOrg access)
 * CRITICAL: No POST route - organizations created via registration only
 */

const router = express.Router();

/**
 * @route   GET /api/organizations
 * @desc    Get all organizations (Platform SuperAdmin sees all, others see own)
 * @access  Protected (authorize Organization read)
 */
router.get("/", verifyJWT, authorize("Organization", "read"), getOrganizations);

/**
 * @route   GET /api/organizations/:resourceId
 * @desc    Get single organization by ID
 * @access  Protected (authorize Organization read)
 */
router.get(
  "/:resourceId",
  verifyJWT,
  organizationIdValidator,
  authorize("Organization", "read"),
  getOrganization
);

/**
 * @route   PUT /api/organizations/:resourceId
 * @desc    Update organization
 * @access  Protected (authorize Organization update)
 */
router.put(
  "/:resourceId",
  verifyJWT,
  organizationIdValidator,
  updateOrganizationValidator,
  authorize("Organization", "update"),
  updateOrganization
);

/**
 * @route   DELETE /api/organizations/:resourceId
 * @desc    Soft delete organization (prevent platform org deletion)
 * @access  Protected (authorize Organization delete)
 */
router.delete(
  "/:resourceId",
  verifyJWT,
  organizationIdValidator,
  authorize("Organization", "delete"),
  deleteOrganization
);

/**
 * @route   PATCH /api/organizations/:resourceId/restore
 * @desc    Restore soft-deleted organization
 * @access  Protected (authorize Organization update for restore)
 */
router.patch(
  "/:resourceId/restore",
  verifyJWT,
  organizationIdValidator,
  authorize("Organization", "update"),
  restoreOrganization
);

export default router;
