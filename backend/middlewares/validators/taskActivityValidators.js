import { body, param } from "express-validator";
import { handleValidationErrors } from "./validation.js";
import { LIMITS } from "../../utils/constants.js";
import mongoose from "mongoose";

export const createTaskActivityValidator = [
  body("activity").trim().notEmpty().withMessage("Activity is required")
    .isLength({ max: LIMITS.ACTIVITY_MAX }).withMessage(`Activity cannot exceed ${LIMITS.ACTIVITY_MAX} characters`),

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
      if ((projectTask && projectTask.isDeleted) ||(assignedTask && assignedTask.isDeleted)) {
        throw new Error("Parent task is deleted");
      }
      return true;
    }),

  body("materials").optional().isArray().withMessage("Materials must be an array")
    .custom((value) => value.length <= LIMITS.MAX_MATERIALS || (() => { throw new Error(`Cannot have more than ${LIMITS.MAX_MATERIALS} materials`); })())
    .custom((value) => value.every(id => mongoose.Types.ObjectId.isValid(id)) || (() => { throw new Error("Invalid material ID(s)"); })())
    .custom(async (value, { req }) => {
      if (!value || value.length === 0) return true;
      const { default: Material } = await import("../../models/Material.js");
      const materials = await Material.find({ _id: { $in: value } }).lean();
      if (materials.length !== value.length) throw new Error("One or more materials not found");
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
    .isLength({ max: LIMITS.ACTIVITY_MAX }).withMessage(`Activity cannot exceed ${LIMITS.ACTIVITY_MAX} characters`),

  body("materials").optional().isArray().withMessage("Materials must be an array"),

  handleValidationErrors,
];

export const taskActivityIdValidator = [
  param("resourceId").trim().notEmpty().withMessage("TaskActivity ID is required")
    .custom((value) => mongoose.Types.ObjectId.isValid(value) || (() => { throw new Error("Invalid task activity ID"); })()),
  handleValidationErrors,
];
