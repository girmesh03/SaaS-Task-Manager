import { body, param, query } from "express-validator";
import { handleValidationErrors } from "./validation.js";
import { LIMITS } from "../../utils/constants.js";
import mongoose from "mongoose";

export const createTaskActivityValidator = [
  body("activity").trim().notEmpty().withMessage("Activity is required")
    .isLength({ max: LIMITS.ACTIVITY_MAX }).withMessage(`Activity cannot exceed ${LIMITS.ACTIVITY_MAX} characters`)
    .escape(),

  body("parent").trim().notEmpty().withMessage("Parent task is required")
    .custom((value) => mongoose.Types.ObjectId.isValid(value) || (() => { throw new Error("Invalid parent ID"); })())
    .custom(async (value) => {
      const ProjectTask = mongoose.model("ProjectTask");
      const AssignedTask = mongoose.model("AssignedTask");
      const [projectTask, assignedTask] = await Promise.all([
        ProjectTask.findById(value).lean(),
        AssignedTask.findById(value).lean(),
      ]);
      if (!projectTask && !assignedTask) {
        throw new Error("Parent must be ProjectTask or AssignedTask");
      }
      const parent = projectTask || assignedTask;
      if (parent.isDeleted) {
        throw new Error("Parent task is deleted");
      }
      if (parent.organization.toString() !== req.user.organization._id.toString()) {
        throw new Error("Parent task belongs to another organization");
      }
      return true;
    }),

  body("materials").optional().isArray().withMessage("Materials must be an array")
    .custom((value) => value.length <= LIMITS.MAX_MATERIALS || (() => { throw new Error(`Cannot have more than ${LIMITS.MAX_MATERIALS} materials`); })())
    .custom((value) => {
      // Validate structure: [{ material: ID, quantity: Number }]
      const isValidStructure = value.every(item =>
        item.material && mongoose.Types.ObjectId.isValid(item.material) &&
        item.quantity !== undefined && typeof item.quantity === 'number' && item.quantity >= 0
      );
      if (!isValidStructure) {
        throw new Error("Invalid materials format. Must be array of { material: ID, quantity: Number }");
      }
      return true;
    })
    .custom(async (value, { req }) => {
      if (!value || value.length === 0) return true;
      const { default: Material } = await import("../../models/Material.js");
      const materialIds = value.map(item => item.material);

      const materials = await Material.find({ _id: { $in: materialIds } }).lean();

      if (materials.length !== materialIds.length) {
         // Check for duplicates in input?
         // If input has duplicates, materials.length will be less than input if we search by $in.
         // Actually unique materials check might be needed?
         // Assuming unique materials in list.
         const uniqueIds = new Set(materialIds);
         if (materials.length !== uniqueIds.size) throw new Error("One or more materials not found");
      }

      if (materials.some(m => m.isDeleted)) throw new Error("One or more materials are deleted");
      if (materials.some(m => m.organization.toString() !== req.user.organization._id.toString())) {
        throw new Error("All materials must belong to the same organization");
      }
      return true;
    }),

  handleValidationErrors,
];

export const updateTaskActivityValidator = [
  body("activity").optional().trim().notEmpty().withMessage("Activity cannot be empty")
    .isLength({ max: LIMITS.ACTIVITY_MAX }).withMessage(`Activity cannot exceed ${LIMITS.ACTIVITY_MAX} characters`)
    .escape(),

  body("materials").optional().isArray().withMessage("Materials must be an array")
    .custom((value) => value.length <= LIMITS.MAX_MATERIALS || (() => { throw new Error(`Cannot have more than ${LIMITS.MAX_MATERIALS} materials`); })())
    .custom((value) => {
      // Validate structure: [{ material: ID, quantity: Number }]
      const isValidStructure = value.every(item =>
        item.material && mongoose.Types.ObjectId.isValid(item.material) &&
        item.quantity !== undefined && typeof item.quantity === 'number' && item.quantity >= 0
      );
      if (!isValidStructure) {
        throw new Error("Invalid materials format. Must be array of { material: ID, quantity: Number }");
      }
      return true;
    })
    .custom(async (value, { req }) => {
      if (!value || value.length === 0) return true;
      const { default: Material } = await import("../../models/Material.js");
      const organizationId = req.user.organization._id;
      const materialIds = value.map(item => item.material);
      const materials = await Material.find({
        _id: { $in: materialIds },
        organization: organizationId
      }).withDeleted().lean();

      if (materials.length !== new Set(materialIds).size) {
        throw new Error("One or more materials not found or belong to another organization");
      }
      if (materials.some(m => m.isDeleted)) throw new Error("One or more materials are deleted");
      return true;
    }),

  handleValidationErrors,
];

export const taskActivityIdValidator = [
  param("taskActivityId").trim().notEmpty().withMessage("TaskActivity ID is required")
    .custom((value) => mongoose.Types.ObjectId.isValid(value) || (() => { throw new Error("Invalid task activity ID"); })())
    .custom(async (value, { req }) => {
      const { default: TaskActivity } = await import("../../models/TaskActivity.js");
      const organizationId = req.user.organization._id;

      const activity = await TaskActivity.findById(value)
        .withDeleted()
        .lean();

      if (!activity) {
        throw new Error("Task activity not found");
      }

      if (activity.organization.toString() !== organizationId.toString()) {
        throw new Error("Task activity belongs to another organization");
      }

      return true;
    }),
  handleValidationErrors,
];

export const getTaskActivitiesValidator = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
  query("parent").optional().isMongoId().withMessage("Parent must be a valid Mongo ID"),
  query("deleted").optional().isIn(["true", "false", "only"]),
  handleValidationErrors,
];
