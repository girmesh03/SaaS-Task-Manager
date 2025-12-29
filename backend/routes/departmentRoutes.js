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
 * @route   GET /api/departments/:departmentId
 * @desc    Get single department by ID
 * @access  Protected (authorize Department read)
 */
router.get(
  "/:departmentId",
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
 * @route   PUT /api/departments/:departmentId
 * @desc    Update department
 * @access  Protected (authorize Department update)
 */
router.put(
  "/:departmentId",
  verifyJWT,
  departmentIdValidator,
  updateDepartmentValidator,
  authorize("Department", "update"),
  updateDepartment
);

/**
 * @route   DELETE /api/departments/:departmentId
 * @desc    Soft delete department with cascade
 * @access  Protected (authorize Department delete)
 */
router.delete(
  "/:departmentId",
  verifyJWT,
  departmentIdValidator,
  authorize("Department", "delete"),
  deleteDepartment
);

/**
 * @route   PATCH /api/departments/:departmentId/restore
 * @desc    Restore soft-deleted department
 * @access  Protected (authorize Department update for restore)
 */
router.patch(
  "/:departmentId/restore",
  verifyJWT,
  departmentIdValidator,
  authorize("Department", "update"),
  restoreDepartment
);

export default router;
