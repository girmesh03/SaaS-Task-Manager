import express from "express";
import {
  getVendors,
  getVendor,
  createVendor,
  updateVendor,
  deleteVendor,
  restoreVendor,
} from "../controllers/vendorControllers.js";
import {
  createVendorValidator,
  updateVendorValidator,
  vendorIdValidator,
} from "../middlewares/validators/vendorValidators.js";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/authorization.js";

/**
 * Vendor Routes
 *
 * CRITICAL: All routes are protected and require authentication
 * CRITICAL: Authorization based on role and scope
 * CRITICAL: Organization scoping (NOT department scoped)
 */

const router = express.Router();

/**
 * @route   GET /api/vendors
 * @desc    Get all vendors (scoped to organization)
 * @access  Protected (authorize Vendor read)
 */
router.get("/", verifyJWT, authorize("Vendor", "read"), getVendors);

/**
 * @route   GET /api/vendors/:vendorId
 * @desc    Get single vendor by ID
 * @access  Protected (authorize Vendor read)
 */
router.get(
  "/:vendorId",
  verifyJWT,
  vendorIdValidator,
  authorize("Vendor", "read"),
  getVendor
);

/**
 * @route   POST /api/vendors
 * @desc    Create new vendor
 * @access  Protected (authorize Vendor create)
 */
router.post(
  "/",
  verifyJWT,
  createVendorValidator,
  authorize("Vendor", "create"),
  createVendor
);

/**
 * @route   PUT /api/vendors/:vendorId
 * @desc    Update vendor
 * @access  Protected (authorize Vendor update)
 */
router.put(
  "/:vendorId",
  verifyJWT,
  vendorIdValidator,
  updateVendorValidator,
  authorize("Vendor", "update"),
  updateVendor
);

/**
 * @route   DELETE /api/vendors/:vendorId
 * @desc    Soft delete vendor
 * @access  Protected (authorize Vendor delete)
 */
router.delete(
  "/:vendorId",
  verifyJWT,
  vendorIdValidator,
  authorize("Vendor", "delete"),
  deleteVendor
);

/**
 * @route   PATCH /api/vendors/:vendorId/restore
 * @desc    Restore soft-deleted vendor
 * @access  Protected (authorize Vendor update for restore)
 */
router.patch(
  "/:vendorId/restore",
  verifyJWT,
  vendorIdValidator,
  authorize("Vendor", "update"),
  restoreVendor
);

export default router;
