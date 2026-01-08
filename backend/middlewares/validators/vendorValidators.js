import { body, param, query } from "express-validator";
import { handleValidationErrors } from "./validation.js";
import { LIMITS, PHONE_REGEX } from "../../utils/constants.js";
import mongoose from "mongoose";

/**
 * Vendor Validators
 *
 * CRITICAL: Validate organization reference exists and is not deleted
 * CRITICAL: Email and phone validation are optional but must be valid if provided
 */

/**
 * Create vendor validator
 * Validates all required fields
 */
export const createVendorValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Vendor name is required")
    .isLength({ max: LIMITS.NAME_MAX })
    .withMessage(`Vendor name cannot exceed ${LIMITS.NAME_MAX} characters`)
    .escape(),

  body("description")
    .optional()
    .trim()
    .isLength({ max: LIMITS.DESCRIPTION_MAX })
    .withMessage(
      `Description cannot exceed ${LIMITS.DESCRIPTION_MAX} characters`
    )
    .escape(),

  body("contactPerson")
    .optional()
    .trim()
    .isLength({ max: LIMITS.CONTACT_PERSON_MAX })
    .withMessage(
      `Contact person cannot exceed ${LIMITS.CONTACT_PERSON_MAX} characters`
    )
    .escape(),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Invalid email format")
    .isLength({ max: LIMITS.EMAIL_MAX })
    .withMessage(`Email cannot exceed ${LIMITS.EMAIL_MAX} characters`)
    .normalizeEmail({ gmail_remove_dots: false }),

  body("phone")
    .optional()
    .trim()
    .matches(PHONE_REGEX)
    .withMessage("Invalid phone number format"),

  body("address")
    .optional()
    .trim()
    .isLength({ max: LIMITS.ADDRESS_MAX })
    .withMessage(`Address cannot exceed ${LIMITS.ADDRESS_MAX} characters`)
    .escape(),

  handleValidationErrors,
];

/**
 * Update vendor validator
 * Validates partial fields
 */
export const updateVendorValidator = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Vendor name cannot be empty")
    .isLength({ max: LIMITS.NAME_MAX })
    .withMessage(`Vendor name cannot exceed ${LIMITS.NAME_MAX} characters`)
    .escape(),

  body("description")
    .optional()
    .trim()
    .isLength({ max: LIMITS.DESCRIPTION_MAX })
    .withMessage(
      `Description cannot exceed ${LIMITS.DESCRIPTION_MAX} characters`
    )
    .escape(),

  body("contactPerson")
    .optional()
    .trim()
    .isLength({ max: LIMITS.CONTACT_PERSON_MAX })
    .withMessage(
      `Contact person cannot exceed ${LIMITS.CONTACT_PERSON_MAX} characters`
    )
    .escape(),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Invalid email format")
    .isLength({ max: LIMITS.EMAIL_MAX })
    .withMessage(`Email cannot exceed ${LIMITS.EMAIL_MAX} characters`)
    .normalizeEmail({ gmail_remove_dots: false }),

  body("phone")
    .optional()
    .trim()
    .matches(PHONE_REGEX)
    .withMessage("Invalid phone number format"),

  body("address")
    .optional()
    .trim()
    .isLength({ max: LIMITS.ADDRESS_MAX })
    .withMessage(`Address cannot exceed ${LIMITS.ADDRESS_MAX} characters`)
    .escape(),

  handleValidationErrors,
];

/**
 * Vendor ID validator
 * Validates MongoDB ObjectId
 */
export const vendorIdValidator = [
  param("vendorId")
    .trim()
    .notEmpty()
    .withMessage("Vendor ID is required")
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid vendor ID");
      }
      return true;
    })
    .custom(async (value, { req }) => {
      const { default: Vendor } = await import("../../models/Vendor.js");
      const organizationId = req.user.organization._id;

      const vendor = await Vendor.findById(value)
        .withDeleted()
        .lean();

      if (!vendor) {
        throw new Error("Vendor not found");
      }

      if (vendor.organization.toString() !== organizationId.toString()) {
        throw new Error("Vendor belongs to another organization");
      }

      return true;
    }),

  handleValidationErrors,
];

export const getVendorsValidator = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
  query("search").optional().isString().trim(),
  query("deleted").optional().isIn(["true", "false", "only"]),
  handleValidationErrors,
];
