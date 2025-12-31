import { body } from "express-validator";
import { handleValidationErrors } from "./validation.js";
import { USER_ROLES, LIMITS, PHONE_REGEX } from "../../utils/constants.js";
import { isValidDate, isFutureDate } from "../../utils/dateUtils.js";

/**
 * Authentication Validators
 *
 * CRITICAL: Use withDeleted() for uniqueness checks to include soft-deleted records
 * CRITICAL: Validate organization, department, and user fields
 */

/**
 * Register validator
 * Validates organization, department, and user fields
 * Checks uniqueness using withDeleted()
 */
export const registerValidator = [
  // Organization fields
  body("organization.name")
    .trim()
    .notEmpty()
    .withMessage("Organization name is required")
    .isLength({ max: LIMITS.ORGANIZATION_NAME_MAX })
    .withMessage(
      `Organization name cannot exceed ${LIMITS.ORGANIZATION_NAME_MAX} characters`
    )
    .toLowerCase()
    .escape()
    .custom(async (value) => {
      const { default: Organization } = await import(
        "../../models/Organization.js"
      );
      const existing = await Organization.findOne({ name: value })
        .withDeleted()
        .lean();
      if (existing) {
        throw new Error("Organization name already exists");
      }
      return true;
    }),

  body("organization.description")
    .optional()
    .trim()
    .isLength({ max: LIMITS.DESCRIPTION_MAX })
    .withMessage(
      `Organization description cannot exceed ${LIMITS.DESCRIPTION_MAX} characters`
    )
    .escape(),

  body("organization.email")
    .trim()
    .notEmpty()
    .withMessage("Organization email is required")
    .isEmail()
    .withMessage("Invalid organization email format")
    .normalizeEmail()
    .isLength({ max: LIMITS.EMAIL_MAX })
    .withMessage(
      `Organization email cannot exceed ${LIMITS.EMAIL_MAX} characters`
    )
    .custom(async (value) => {
      const { default: Organization } = await import(
        "../../models/Organization.js"
      );
      const existing = await Organization.findOne({ email: value })
        .withDeleted()
        .lean();
      if (existing) {
        throw new Error("Organization email already exists");
      }
      return true;
    }),

  body("organization.phone")
    .trim()
    .notEmpty()
    .withMessage("Organization phone is required")
    .matches(PHONE_REGEX)
    .withMessage("Invalid phone format. Use +251XXXXXXXXX or 0XXXXXXXXX")
    .custom(async (value) => {
      const { default: Organization } = await import(
        "../../models/Organization.js"
      );
      const existing = await Organization.findOne({ phone: value })
        .withDeleted()
        .lean();
      if (existing) {
        throw new Error("Organization phone already exists");
      }
      return true;
    }),

  body("organization.address")
    .optional()
    .trim()
    .isLength({ max: LIMITS.ADDRESS_MAX })
    .withMessage(
      `Organization address cannot exceed ${LIMITS.ADDRESS_MAX} characters`
    )
    .escape(),

  body("organization.industry")
    .optional()
    .trim()
    .isLength({ max: LIMITS.INDUSTRY_MAX })
    .withMessage(`Industry cannot exceed ${LIMITS.INDUSTRY_MAX} characters`)
    .escape(),

  body("organization.logo.url")
    .optional()
    .trim()
    .isURL()
    .withMessage("Invalid logo URL"),

  body("organization.logo.publicId")
    .optional()
    .trim(),

  // Department fields
  body("department.name")
    .trim()
    .notEmpty()
    .withMessage("Department name is required")
    .isLength({ max: LIMITS.DEPARTMENT_NAME_MAX })
    .withMessage(
      `Department name cannot exceed ${LIMITS.DEPARTMENT_NAME_MAX} characters`
    )
    .escape(),

  body("department.description")
    .optional()
    .trim()
    .isLength({ max: LIMITS.DESCRIPTION_MAX })
    .withMessage(
      `Department description cannot exceed ${LIMITS.DESCRIPTION_MAX} characters`
    )
    .escape(),

  // User fields
  body("user.firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .isLength({ max: LIMITS.FIRST_NAME_MAX })
    .withMessage(
      `First name cannot exceed ${LIMITS.FIRST_NAME_MAX} characters`
    )
    .escape(),

  body("user.lastName")
    .trim()
    .notEmpty()
    .withMessage("Last name is required")
    .isLength({ max: LIMITS.LAST_NAME_MAX })
    .withMessage(`Last name cannot exceed ${LIMITS.LAST_NAME_MAX} characters`)
    .escape(),

  body("user.position")
    .optional()
    .trim()
    .isLength({ max: LIMITS.POSITION_MAX })
    .withMessage(`Position cannot exceed ${LIMITS.POSITION_MAX} characters`)
    .escape(),

  body("user.email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail()
    .isLength({ max: LIMITS.EMAIL_MAX })
    .withMessage(`Email cannot exceed ${LIMITS.EMAIL_MAX} characters`),

  body("user.password")
    .trim()
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: LIMITS.PASSWORD_MIN })
    .withMessage(`Password must be at least ${LIMITS.PASSWORD_MIN} characters`)
    .isStrongPassword()
    .withMessage("Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"),

  body("user.employeeId")
    .optional()
    .trim()
    .matches(/^(?!0000)\d{4}$/)
    .withMessage("Employee ID must be a 4-digit number between 0001-9999"),

  body("user.dateOfBirth")
    .optional()
    .custom((value) => isValidDate(value)).withMessage("Invalid date of birth format")
    .custom((value) => !isFutureDate(value)).withMessage("Date of birth cannot be in the future"),

  body("user.joinedAt")
    .notEmpty().withMessage("Joined date is required")
    .custom((value) => isValidDate(value)).withMessage("Invalid joined date format")
    .custom((value) => !isFutureDate(value)).withMessage("Joined date cannot be in the future"),

  handleValidationErrors,
];

/**
 * Login validator
 * Validates email and password
 */
export const loginValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),

  body("password").trim().notEmpty().withMessage("Password is required"),

  handleValidationErrors,
];

/**
 * Forgot password validator
 * Validates email
 */
export const forgotPasswordValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),

  handleValidationErrors,
];

/**
 * Reset password validator
 * Validates token and new password
 */
export const resetPasswordValidator = [
  body("token").trim().notEmpty().withMessage("Reset token is required"),

  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: LIMITS.PASSWORD_MIN })
    .withMessage(`Password must be at least ${LIMITS.PASSWORD_MIN} characters`)
    .isStrongPassword()
    .withMessage("Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"),

  handleValidationErrors,
];
