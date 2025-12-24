import { body, param } from "express-validator";
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
    .withMessage(`Vendor name cannot exceed ${LIMITS.NAME_MAX} characters`),

  body("description")
    .optional()
    .trim()
    .isLength({ max: LIMITS.DESCRIPTION_MAX })
    .withMessage(
      `Description cannot exceed ${LIMITS.DESCRIPTION_MAX} characters`
    ),

  body("contactPerson")
    .optional()
    .trim()
    .isLength({ max: LIMITS.CONTACT_PERSON_MAX })
    .withMessage(
      `Contact person cannot exceed ${LIMITS.CONTACT_PERSON_MAX} characters`
    ),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Invalid email format")
    .isLength({ max: LIMITS.EMAIL_MAX })
    .withMessage(`Email cannot exceed ${LIMITS.EMAIL_MAX} characters`)
    .normalizeEmail(),

  body("phone")
    .optional()
    .trim()
    .matches(PHONE_REGEX)
    .withMessage("Invalid phone number format"),

  body("address")
    .optional()
    .trim()
    .isLength({ max: LIMITS.ADDRESS_MAX })
    .withMessage(`Address cannot exceed ${LIMITS.ADDRESS_MAX} characters`),

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
    .withMessage(`Vendor name cannot exceed ${LIMITS.NAME_MAX} characters`),

  body("description")
    .optional()
    .trim()
    .isLength({ max: LIMITS.DESCRIPTION_MAX })
    .withMessage(
      `Description cannot exceed ${LIMITS.DESCRIPTION_MAX} characters`
    ),

  body("contactPerson")
    .optional()
    .trim()
    .isLength({ max: LIMITS.CONTACT_PERSON_MAX })
    .withMessage(
      `Contact person cannot exceed ${LIMITS.CONTACT_PERSON_MAX} characters`
    ),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Invalid email format")
    .isLength({ max: LIMITS.EMAIL_MAX })
    .withMessage(`Email cannot exceed ${LIMITS.EMAIL_MAX} characters`)
    .normalizeEmail(),

  body("phone")
    .optional()
    .trim()
    .matches(PHONE_REGEX)
    .withMessage("Invalid phone number format"),

  body("address")
    .optional()
    .trim()
    .isLength({ max: LIMITS.ADDRESS_MAX })
    .withMessage(`Address cannot exceed ${LIMITS.ADDRESS_MAX} characters`),

  handleValidationErrors,
];

/**
 * Vendor ID validator
 * Validates MongoDB ObjectId
 */
export const vendorIdValidator = [
  param("resourceId")
    .trim()
    .notEmpty()
    .withMessage("Vendor ID is required")
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid vendor ID");
      }
      return true;
    }),

  handleValidationErrors,
];
