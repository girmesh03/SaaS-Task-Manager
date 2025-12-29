import { body, param } from "express-validator";
import { handleValidationErrors } from "./validation.js";
import { INDUSTRIES, LIMITS } from "../../utils/constants.js";
import mongoose from "mongoose";

/**
 * Organization Validators
 *
 * CRITICAL: Use withDeleted() for uniqueness checks to include soft-deleted records
 * CRITICAL: Exclude current organization from uniqueness checks on update
 */

/**
 * Update organization validator
 * Validates partial fields with uniqueness checks excluding current organization
 */
export const updateOrganizationValidator = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Organization name cannot be empty")
    .isLength({ max: LIMITS.ORGANIZATION_NAME_MAX })
    .withMessage(
      `Organization name cannot exceed ${LIMITS.ORGANIZATION_NAME_MAX} characters`
    )
    .toLowerCase()
    .escape()
    .custom(async (value, { req }) => {
      const { default: Organization } = await import(
        "../../models/Organization.js"
      );
      const organizationIdParam = req.params.organizationId;
      const existing = await Organization.findOne({
        name: value,
        _id: { $ne: organizationIdParam },
      })
        .withDeleted()
        .lean();
      if (existing) {
        throw new Error("Organization name already exists");
      }
      return true;
    }),

  body("description")
    .optional()
    .trim()
    .isLength({ max: LIMITS.DESCRIPTION_MAX })
    .withMessage(
      `Organization description cannot exceed ${LIMITS.DESCRIPTION_MAX} characters`
    )
    .escape(),

  body("email")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Organization email cannot be empty")
    .isEmail()
    .withMessage("Invalid organization email format")
    .normalizeEmail()
    .isLength({ max: LIMITS.EMAIL_MAX })
    .withMessage(
      `Organization email cannot exceed ${LIMITS.EMAIL_MAX} characters`
    )
    .custom(async (value, { req }) => {
      const { default: Organization } = await import(
        "../../models/Organization.js"
      );
      const organizationIdParam = req.params.organizationId;
      const existing = await Organization.findOne({
        email: value,
        _id: { $ne: organizationIdParam },
      })
        .withDeleted()
        .lean();
      if (existing) {
        throw new Error("Organization email already exists");
      }
      return true;
    }),

  body("phone")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Organization phone cannot be empty")
    .matches(/^(\+251\d{9}|0\d{9})$/)
    .withMessage("Invalid phone format. Use +251XXXXXXXXX or 0XXXXXXXXX")
    .custom(async (value, { req }) => {
      const { default: Organization } = await import(
        "../../models/Organization.js"
      );
      const organizationIdParam = req.params.organizationId;
      const existing = await Organization.findOne({
        phone: value,
        _id: { $ne: organizationIdParam },
      })
        .withDeleted()
        .lean();
      if (existing) {
        throw new Error("Organization phone already exists");
      }
      return true;
    }),

  body("address")
    .optional()
    .trim()
    .isLength({ max: LIMITS.ADDRESS_MAX })
    .withMessage(
      `Organization address cannot exceed ${LIMITS.ADDRESS_MAX} characters`
    )
    .escape(),

  body("industry")
    .optional()
    .trim()
    .isIn(Object.values(INDUSTRIES))
    .withMessage("Invalid industry")
    .isLength({ max: LIMITS.INDUSTRY_MAX })
    .withMessage(`Industry cannot exceed ${LIMITS.INDUSTRY_MAX} characters`)
    .escape(),

  body("logo.url").optional().trim().isURL().withMessage("Invalid logo URL"),

  body("logo.publicId").optional().trim(),

  handleValidationErrors,
];

/**
 * Organization ID validator
 * Validates MongoDB ObjectId
 */
export const organizationIdValidator = [
  param("organizationId")
    .trim()
    .notEmpty()
    .withMessage("Organization ID is required")
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid organization ID");
      }
      return true;
    })
    .custom(async (value, { req }) => {
      const { default: Organization } = await import("../../models/Organization.js");

      const organization = await Organization.findById(value)
        .withDeleted()
        .lean();

      if (!organization) {
        throw new Error("Organization not found");
      }

      // Multi-tenancy check: User can only access their own organization
      if (req.user.organization._id.toString() !== value.toString()) {
        throw new Error("You do not have permission to access this organization");
      }

      return true;
    }),

  handleValidationErrors,
];
