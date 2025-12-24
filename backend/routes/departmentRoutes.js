import express from "express";
import {
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  restoreDepartment,
} from "../controllers/departmentControllers.js";
import {
  createDepartmentValidator,
  updateDepartmentValidator,
  departmentIdValidator,
} from "../middlewares/validators/departmentValidators.js";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/authorization.js";

/**
 * Department Routes
 *
 * CRITICAL: All routes are protected and require authentication
 * CRITICAL: Authorization based on role and scope
 * CRITICAL: Organization scoping for Customer SuperAdmin/Admin
 */

const router = express.Router();

/**
 * @route   GET /api/departments
 * @desc    Get all departments (scoped to organization for Customer SuperAdmin/Admin)
 * @access  Protected (authorize Department read)
 */
router.get("/", verifyJWT, authorize("Department", "read"), getDepartments);

/**
 * @route   GET /api/departments/:resourceId
 * @desc    Get single department by ID
 * @access  Protected (authorize Department read)
 */
router.get(
  "/:resourceId",
  verifyJWT,
  departmentIdValidator,
  authorize("Department", "read"),
  getDepartment
);

/**
 * @route   POST /api/departments
 * @desc    Create new department
 * @access  Protected (authorize Department create)
 */
router.post(
  "/",
  verifyJWT,
  createDepartmentValidator,
  authorize("Department", "create"),
  createDepartment
);

/**
 * @route   PUT /api/departments/:resourceId
 * @desc    Update department
 * @access  Protected (authorize Department update)
 */
router.put(
  "/:resourceId",
  verifyJWT,
  departmentIdValidator,
  updateDepartmentValidator,
  authorize("Department", "update"),
  updateDepartment
);

/**
 * @route   DELETE /api/departments/:resourceId
 * @desc    Soft delete department with cascade
 * @access  Protected (authorize Department delete)
 */
router.delete(
  "/:resourceId",
  verifyJWT,
  departmentIdValidator,
  authorize("Department", "delete"),
  deleteDepartment
);

/**
 * @route   PATCH /api/departments/:resourceId/restore
 * @desc    Restore soft-deleted department
 * @access  Protected (authorize Department update for restore)
 */
router.patch(
  "/:resourceId/restore",
  verifyJWT,
  departmentIdValidator,
  authorize("Department", "update"),
  restoreDepartment
);

export default router;
