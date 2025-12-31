import { body, param, query } from "express-validator";
import { handleValidationErrors } from "./validation.js";
import { LIMITS, MATERIAL_CATEGORIES, UNIT_TYPES } from "../../utils/constants.js";
import mongoose from "mongoose";

export const createMaterialValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Material name is required")
    .isLength({ max: LIMITS.NAME_MAX })
    .withMessage(`Material name cannot exceed ${LIMITS.NAME_MAX} characters`)
    .escape(),

  body("description")
    .optional()
    .trim()
    .isLength({ max: LIMITS.DESCRIPTION_MAX })
    .withMessage(`Description cannot exceed ${LIMITS.DESCRIPTION_MAX} characters`)
    .escape(),

  body("category")
    .trim()
    .notEmpty()
    .withMessage("Category is required")
    .isIn(Object.values(MATERIAL_CATEGORIES))
    .withMessage("Invalid category"),

  body("unitType")
    .trim()
    .notEmpty()
    .withMessage("Unit type is required")
    .isIn(Object.values(UNIT_TYPES))
    .withMessage("Invalid unit type"),

  body("price")
    .isFloat({ min: LIMITS.PRICE_MIN })
    .withMessage(`Price must be at least ${LIMITS.PRICE_MIN}`),

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
      const { default: Department } = await import("../../models/Department.js");
      const organizationId = req.user.organization._id;
      const department = await Department.findById(value).lean();
      if (!department) throw new Error("Department not found");
      if (department.isDeleted) throw new Error("Department is deleted");
      if (department.organization.toString() !== organizationId.toString()) {
        throw new Error("Department must belong to the same organization");
      }
      return true;
    }),

  handleValidationErrors,
];

export const updateMaterialValidator = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Material name cannot be empty")
    .isLength({ max: LIMITS.NAME_MAX })
    .withMessage(`Material name cannot exceed ${LIMITS.NAME_MAX} characters`)
    .escape(),

  body("description")
    .optional()
    .trim()
    .isLength({ max: LIMITS.DESCRIPTION_MAX })
    .withMessage(`Description cannot exceed ${LIMITS.DESCRIPTION_MAX} characters`)
    .escape(),

  body("category")
    .optional()
    .trim()
    .isIn(Object.values(MATERIAL_CATEGORIES))
    .withMessage("Invalid category"),

  body("unitType")
    .optional()
    .trim()
    .isIn(Object.values(UNIT_TYPES))
    .withMessage("Invalid unit type"),

  body("price")
    .optional()
    .isFloat({ min: LIMITS.PRICE_MIN })
    .withMessage(`Price must be at least ${LIMITS.PRICE_MIN}`),

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
      const { default: Department } = await import("../../models/Department.js");
      const organizationId = req.user.organization._id;
      const department = await Department.findById(value).lean();
      if (!department) throw new Error("Department not found");
      if (department.isDeleted) throw new Error("Department is deleted");
      if (department.organization.toString() !== organizationId.toString()) {
        throw new Error("Department must belong to the same organization");
      }
      return true;
    }),

  handleValidationErrors,
];

export const materialIdValidator = [
  param("materialId")
    .trim()
    .notEmpty()
    .withMessage("Material ID is required")
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid material ID");
      }
      return true;
    })
    .custom(async (value, { req }) => {
      const { default: Material } = await import("../../models/Material.js");
      const organizationId = req.user.organization._id;

      const material = await Material.findById(value)
        .withDeleted()
        .lean();

      if (!material) {
        throw new Error("Material not found");
      }

      if (material.organization.toString() !== organizationId.toString()) {
        throw new Error("Material belongs to another organization");
      }

      return true;
    }),

  handleValidationErrors,
];

export const getMaterialsValidator = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
  query("search").optional().isString().trim(),
  query("category").optional().isIn(Object.values(MATERIAL_CATEGORIES)),
  query("department").optional().isMongoId(),
  query("deleted").optional().isIn(["true", "false", "only"]),
  handleValidationErrors,
];
