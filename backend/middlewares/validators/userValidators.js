import { body, param } from "express-validator";
import { handleValidationErrors } from "./validation.js";
import { LIMITS, USER_ROLES } from "../../utils/constants.js";
import mongoose from "mongoose";

/**
 * User Validators
 *
 * CRITICAL: Use withDeleted() for uniqueness checks to include soft-deleted records
 * CRITICAL: Validate organization and department references exist and are not deleted
 * CRITICAL: Enforce unique email per organization and unique employeeId per organization
 * CRITICAL: HOD constraints: Only one HOD per department
 */

/**
 * Create user validator
 * Validates all required fields with uniqueness checks using withDeleted()
 */
export const createUserValidator = [
  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .isLength({ max: LIMITS.FIRST_NAME_MAX })
    .withMessage(
      `First name cannot exceed ${LIMITS.FIRST_NAME_MAX} characters`
    ),

  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("Last name is required")
    .isLength({ max: LIMITS.LAST_NAME_MAX })
    .withMessage(`Last name cannot exceed ${LIMITS.LAST_NAME_MAX} characters`),

  body("position")
    .optional()
    .trim()
    .isLength({ max: LIMITS.POSITION_MAX })
    .withMessage(`Position cannot exceed ${LIMITS.POSITION_MAX} characters`),

  body("role")
    .optional()
    .trim()
    .isIn(Object.values(USER_ROLES))
    .withMessage("Invalid user role"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .isLength({ max: LIMITS.EMAIL_MAX })
    .withMessage(`Email cannot exceed ${LIMITS.EMAIL_MAX} characters`)
    .normalizeEmail()
    .custom(async (value, { req }) => {
      const { default: User } = await import("../../models/User.js");
      const organizationId = req.user.organization._id;

      const existing = await User.findOne({
        email: value,
        organization: organizationId,
      })
        .withDeleted()
        .lean();

      if (existing) {
        throw new Error("Email already exists in this organization");
      }
      return true;
    }),

  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: LIMITS.PASSWORD_MIN })
    .withMessage(
      `Password must be at least ${LIMITS.PASSWORD_MIN} characters`
    ),

  body("department")
    .trim()
    .notEmpty()
    .withMessage("Department is required")
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid department ID");
      }
      return true;
    })
    .custom(async (value, { req }) => {
      const { default: Department } = await import(
        "../../models/Department.js"
      );
      const organizationId = req.user.organization._id;

      const department = await Department.findById(value).lean();

      if (!department) {
        throw new Error("Department not found");
      }

      if (department.isDeleted) {
        throw new Error("Department is deleted");
      }

      if (department.organization.toString() !== organizationId.toString()) {
        throw new Error("Department must belong to the same organization");
      }

      return true;
    }),

  body("employeeId")
    .trim()
    .notEmpty()
    .withMessage("Employee ID is required")
    .custom(async (value, { req }) => {
      const { default: User } = await import("../../models/User.js");
      const organizationId = req.user.organization._id;

      const existing = await User.findOne({
        employeeId: value,
        organization: organizationId,
      })
        .withDeleted()
        .lean();

      if (existing) {
        throw new Error("Employee ID already exists in this organization");
      }
      return true;
    }),

  body("dateOfBirth")
    .optional()
    .isISO8601()
    .withMessage("Invalid date of birth format (use ISO 8601)"),

  body("joinedAt")
    .trim()
    .notEmpty()
    .withMessage("Joined date is required")
    .isISO8601()
    .withMessage("Invalid joined date format (use ISO 8601)"),

  body("skills")
    .optional()
    .isArray()
    .withMessage("Skills must be an array")
    .custom((value) => {
      if (value.length > LIMITS.MAX_SKILLS) {
        throw new Error(`Cannot have more than ${LIMITS.MAX_SKILLS} skills`);
      }
      return true;
    }),

  body("skills.*.skill")
    .if(body("skills").exists())
    .trim()
    .notEmpty()
    .withMessage("Skill name is required")
    .isLength({ max: LIMITS.SKILL_MAX })
    .withMessage(`Skill cannot exceed ${LIMITS.SKILL_MAX} characters`),

  body("skills.*.percentage")
    .if(body("skills").exists())
    .isInt({ min: LIMITS.SKILL_PERCENTAGE_MIN, max: LIMITS.SKILL_PERCENTAGE_MAX })
    .withMessage(
      `Percentage must be between ${LIMITS.SKILL_PERCENTAGE_MIN} and ${LIMITS.SKILL_PERCENTAGE_MAX}`
    ),

  body("profilePicture.url")
    .optional()
    .trim()
    .isURL()
    .withMessage("Invalid profile picture URL"),

  body("profilePicture.publicId")
    .optional()
    .trim()
    .withMessage("Invalid profile picture public ID"),

  handleValidationErrors,
];

/**
 * Update user validator
 * Validates partial fields with uniqueness checks excluding current user
 */
export const updateUserValidator = [
  body("firstName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("First name cannot be empty")
    .isLength({ max: LIMITS.FIRST_NAME_MAX })
    .withMessage(
      `First name cannot exceed ${LIMITS.FIRST_NAME_MAX} characters`
    ),

  body("lastName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Last name cannot be empty")
    .isLength({ max: LIMITS.LAST_NAME_MAX })
    .withMessage(`Last name cannot exceed ${LIMITS.LAST_NAME_MAX} characters`),

  body("position")
    .optional()
    .trim()
    .isLength({ max: LIMITS.POSITION_MAX })
    .withMessage(`Position cannot exceed ${LIMITS.POSITION_MAX} characters`),

  body("role")
    .optional()
    .trim()
    .isIn(Object.values(USER_ROLES))
    .withMessage("Invalid user role")
    .custom(async (value, { req }) => {
      // HOD constraint: If changing role to non-HOD role, ensure user is not the only HOD in department
      const userId = req.params.userId;
      const { default: User } = await import("../../models/User.js");
      const { default: Department } = await import(
        "../../models/Department.js"
      );

      const user = await User.findById(userId).lean();
      if (!user) {
        throw new Error("User not found");
      }

      // Check if changing from HOD role to non-HOD role
      const wasHod =
        user.role === USER_ROLES.SUPER_ADMIN || user.role === USER_ROLES.ADMIN;
      const willBeHod =
        value === USER_ROLES.SUPER_ADMIN || value === USER_ROLES.ADMIN;

      if (wasHod && !willBeHod) {
        // Check if user is the department HOD
        const department = await Department.findById(user.department).lean();
        if (
          department &&
          department.hod &&
          department.hod.toString() === userId.toString()
        ) {
          throw new Error(
            "Cannot change role. User is the HOD of their department. Please assign a new HOD first."
          );
        }
      }

      return true;
    }),

  body("email")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Email cannot be empty")
    .isEmail()
    .withMessage("Invalid email format")
    .isLength({ max: LIMITS.EMAIL_MAX })
    .withMessage(`Email cannot exceed ${LIMITS.EMAIL_MAX} characters`)
    .normalizeEmail()
    .custom(async (value, { req }) => {
      const { default: User } = await import("../../models/User.js");
      const userId = req.params.userId;
      const organizationId = req.user.organization._id;

      const existing = await User.findOne({
        email: value,
        organization: organizationId,
        _id: { $ne: userId },
      })
        .withDeleted()
        .lean();

      if (existing) {
        throw new Error("Email already exists in this organization");
      }
      return true;
    }),

  body("password")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Password cannot be empty")
    .isLength({ min: LIMITS.PASSWORD_MIN })
    .withMessage(
      `Password must be at least ${LIMITS.PASSWORD_MIN} characters`
    ),

  body("department")
    .optional()
    .trim()
    .custom((value) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid department ID");
      }
      return true;
    })
    .custom(async (value, { req }) => {
      if (!value) return true;

      const { default: Department } = await import(
        "../../models/Department.js"
      );
      const { default: User } = await import("../../models/User.js");
      const organizationId = req.user.organization._id;
      const userId = req.params.userId;

      const department = await Department.findById(value).lean();

      if (!department) {
        throw new Error("Department not found");
      }

      if (department.isDeleted) {
        throw new Error("Department is deleted");
      }

      if (department.organization.toString() !== organizationId.toString()) {
        throw new Error("Department must belong to the same organization");
      }

      // Check if user is HOD of their current department
      const user = await User.findById(userId).lean();
      if (user) {
        const currentDept = await Department.findById(user.department).lean();
        if (
          currentDept &&
          currentDept.hod &&
          currentDept.hod.toString() === userId.toString()
        ) {
          throw new Error(
            "Cannot change department. User is the HOD of their current department. Please assign a new HOD first."
          );
        }
      }

      return true;
    }),

  body("employeeId")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Employee ID cannot be empty")
    .custom(async (value, { req }) => {
      const { default: User } = await import("../../models/User.js");
      const userId = req.params.userId;
      const organizationId = req.user.organization._id;

      const existing = await User.findOne({
        employeeId: value,
        organization: organizationId,
        _id: { $ne: userId },
      })
        .withDeleted()
        .lean();

      if (existing) {
        throw new Error("Employee ID already exists in this organization");
      }
      return true;
    }),

  body("dateOfBirth")
    .optional()
    .isISO8601()
    .withMessage("Invalid date of birth format (use ISO 8601)"),

  body("joinedAt")
    .optional()
    .isISO8601()
    .withMessage("Invalid joined date format (use ISO 8601)"),

  body("skills")
    .optional()
    .isArray()
    .withMessage("Skills must be an array")
    .custom((value) => {
      if (value.length > LIMITS.MAX_SKILLS) {
        throw new Error(`Cannot have more than ${LIMITS.MAX_SKILLS} skills`);
      }
      return true;
    }),

  body("skills.*.skill")
    .if(body("skills").exists())
    .trim()
    .notEmpty()
    .withMessage("Skill name is required")
    .isLength({ max: LIMITS.SKILL_MAX })
    .withMessage(`Skill cannot exceed ${LIMITS.SKILL_MAX} characters`),

  body("skills.*.percentage")
    .if(body("skills").exists())
    .isInt({ min: LIMITS.SKILL_PERCENTAGE_MIN, max: LIMITS.SKILL_PERCENTAGE_MAX })
    .withMessage(
      `Percentage must be between ${LIMITS.SKILL_PERCENTAGE_MIN} and ${LIMITS.SKILL_PERCENTAGE_MAX}`
    ),

  body("profilePicture.url")
    .optional()
    .trim()
    .isURL()
    .withMessage("Invalid profile picture URL"),

  body("profilePicture.publicId")
    .optional()
    .trim()
    .withMessage("Invalid profile picture public ID"),

  body("emailPreferences")
    .optional()
    .isObject()
    .withMessage("Email preferences must be an object"),

  body("emailPreferences.enabled")
    .optional()
    .isBoolean()
    .withMessage("Email preferences enabled must be a boolean"),

  body("emailPreferences.taskNotifications")
    .optional()
    .isBoolean()
    .withMessage("Task notifications must be a boolean"),

  body("emailPreferences.taskReminders")
    .optional()
    .isBoolean()
    .withMessage("Task reminders must be a boolean"),

  body("emailPreferences.mentions")
    .optional()
    .isBoolean()
    .withMessage("Mentions must be a boolean"),

  body("emailPreferences.announcements")
    .optional()
    .isBoolean()
    .withMessage("Announcements must be a boolean"),

  body("emailPreferences.welcomeEmails")
    .optional()
    .isBoolean()
    .withMessage("Welcome emails must be a boolean"),

  body("emailPreferences.passwordReset")
    .optional()
    .isBoolean()
    .withMessage("Password reset must be a boolean"),

  handleValidationErrors,
];

/**
 * User ID validator
 * Validates MongoDB ObjectId
 */
export const userIdValidator = [
  param("userId")
    .trim()
    .notEmpty()
    .withMessage("User ID is required")
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid user ID");
      }
      return true;
    }),

  handleValidationErrors,
];
