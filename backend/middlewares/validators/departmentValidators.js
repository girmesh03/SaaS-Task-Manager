import { body, param } from "express-validator";
import { handleValidationErrors } from "./validation.js";
import { LIMITS } from "../../utils/constants.js";
import mongoose from "mongoose";

/**
 * Department Validators
 *
 * CRITICAL: Use withDeleted() for uniqueness checks to include soft-deleted records
 * CRITICAL: Validate organization reference exists and is not deleted
 * CRITICAL: Enforce unique name per organization
 */

/**
 * Create department validator
 * Validates all required fields with uniqueness checks using withDeleted()
 */
export const createDepartmentValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Department name is required")
    .isLength({ max: LIMITS.DEPARTMENT_NAME_MAX })
    .withMessage(
      `Department name cannot exceed ${LIMITS.DEPARTMENT_NAME_MAX} characters`
    )
    .custom(async (value, { req }) => {
      const { default: Department } = await import(
        "../../models/Department.js"
      );
      const organizationId = req.user.organization._id;

      const existing = await Department.findOne({
        name: value,
        organization: organizationId,
      })
        .withDeleted()
        .lean();

      if (existing) {
        throw new Error("Department name already exists in this organization");
      }
      return true;
    }),

  body("description")
    .optional()
    .trim()
    .isLength({ max: LIMITS.DESCRIPTION_MAX })
    .withMessage(
      `Department description cannot exceed ${LIMITS.DESCRIPTION_MAX} characters`
    ),

  body("hod")
    .optional()
    .trim()
    .custom((value) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid HOD user ID");
      }
      return true;
    })
    .custom(async (value, { req }) => {
      if (!value) return true;

      const { default: User } = await import("../../models/User.js");
      const organizationId = req.user.organization._id;

      const user = await User.findById(value).lean();

      if (!user) {
        throw new Error("HOD user not found");
      }

      if (user.isDeleted) {
        throw new Error("HOD user is deleted");
      }

      if (user.organization.toString() !== organizationId.toString()) {
        throw new Error("HOD user must belong to the same organization");
      }

      if (!user.isHod) {
        throw new Error("User must be HOD (SuperAdmin or Admin role)");
      }

      return true;
    }),

  handleValidationErrors,
];

/**
 * Update department validator
 * Validates partial fields with uniqueness checks excluding current department
 */
export const updateDepartmentValidator = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Department name cannot be empty")
    .isLength({ max: LIMITS.DEPARTMENT_NAME_MAX })
    .withMessage(
      `Department name cannot exceed ${LIMITS.DEPARTMENT_NAME_MAX} characters`
    )
    .custom(async (value, { req }) => {
      const { default: Department } = await import(
        "../../models/Department.js"
      );
      const resourceId = req.params.resourceId;
      const organizationId = req.user.organization._id;

      const existing = await Department.findOne({
        name: value,
        organization: organizationId,
        _id: { $ne: resourceId },
      })
        .withDeleted()
        .lean();

      if (existing) {
        throw new Error("Department name already exists in this organization");
      }
      return true;
    }),

  body("description")
    .optional()
    .trim()
    .isLength({ max: LIMITS.DESCRIPTION_MAX })
    .withMessage(
      `Department description cannot exceed ${LIMITS.DESCRIPTION_MAX} characters`
    ),

  body("hod")
    .optional()
    .trim()
    .custom((value) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid HOD user ID");
      }
      return true;
    })
    .custom(async (value, { req }) => {
      if (!value) return true;

      const { default: User } = await import("../../models/User.js");
      const organizationId = req.user.organization._id;

      const user = await User.findById(value).lean();

      if (!user) {
        throw new Error("HOD user not found");
      }

      if (user.isDeleted) {
        throw new Error("HOD user is deleted");
      }

      if (user.organization.toString() !== organizationId.toString()) {
        throw new Error("HOD user must belong to the same organization");
      }

      if (!user.isHod) {
        throw new Error("User must be HOD (SuperAdmin or Admin role)");
      }

      return true;
    }),

  handleValidationErrors,
];

/**
 * Department ID validator
 * Validates MongoDB ObjectId
 */
export const departmentIdValidator = [
  param("resourceId")
    .trim()
    .notEmpty()
    .withMessage("Department ID is required")
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid department ID");
      }
      return true;
    }),

  handleValidationErrors,
];
