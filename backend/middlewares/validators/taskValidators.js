import { body, param } from "express-validator";
import { handleValidationErrors } from "./validation.js";
import { LIMITS, TASK_TYPES, TASK_STATUS, TASK_PRIORITY } from "../../utils/constants.js";
import mongoose from "mongoose";

export const createTaskValidator = [
  body("description").trim().notEmpty().withMessage("Description is required")
    .isLength({ max: LIMITS.DESCRIPTION_MAX }).withMessage(`Description cannot exceed ${LIMITS.DESCRIPTION_MAX} characters`),

  body("status").optional().isIn(Object.values(TASK_STATUS)).withMessage("Invalid status"),
  body("priority").optional().isIn(Object.values(TASK_PRIORITY)).withMessage("Invalid priority"),

  body("taskType").trim().notEmpty().withMessage("Task type is required")
    .isIn(Object.values(TASK_TYPES)).withMessage("Invalid task type"),

  body("department").trim().notEmpty().withMessage("Department is required")
    .custom((value) => mongoose.Types.ObjectId.isValid(value) || (() => { throw new Error("Invalid department ID"); })())
    .custom(async (value, { req }) => {
      const { default: Department } = await import("../../models/Department.js");
      const dept = await Department.findById(value).lean();
      if (!dept) throw new Error("Department not found");
      if (dept.isDeleted) throw new Error("Department is deleted");
      if (dept.organization.toString() !== req.user.organization._id.toString()) {
        throw new Error("Department must belong to the same organization");
      }
      return true;
    }),

  // ProjectTask specific
  body("startDate").if(body("taskType").equals(TASK_TYPES.PROJECT_TASK))
    .notEmpty().withMessage("Start date required for ProjectTask").isISO8601().withMessage("Invalid start date"),
  body("dueDate").if(body("taskType").equals(TASK_TYPES.PROJECT_TASK))
    .notEmpty().withMessage("Due date required for ProjectTask").isISO8601().withMessage("Invalid due date"),
  body("vendor").if(body("taskType").equals(TASK_TYPES.PROJECT_TASK))
    .notEmpty().withMessage("Vendor required for ProjectTask")
    .custom((value) => mongoose.Types.ObjectId.isValid(value) || (() => { throw new Error("Invalid vendor ID"); })())
    .custom(async (value, { req }) => {
      const { default: Vendor } = await import("../../models/Vendor.js");
      const vendor = await Vendor.findById(value).lean();
      if (!vendor) throw new Error("Vendor not found");
      if (vendor.isDeleted) throw new Error("Vendor is deleted");
      if (vendor.organization.toString() !== req.user.organization._id.toString()) {
        throw new Error("Vendor must belong to the same organization");
      }
      return true;
    }),

  // RoutineTask specific
  body("startDate").if(body("taskType").equals(TASK_TYPES.ROUTINE_TASK))
    .notEmpty().withMessage("Start date required for RoutineTask").isISO8601().withMessage("Invalid start date"),
  body("dueDate").if(body("taskType").equals(TASK_TYPES.ROUTINE_TASK))
    .notEmpty().withMessage("Due date required for RoutineTask").isISO8601().withMessage("Invalid due date"),
  body("status").if(body("taskType").equals(TASK_TYPES.ROUTINE_TASK))
    .custom((value) => {
      if (value && ![TASK_STATUS.TO_DO, TASK_STATUS.COMPLETED].includes(value)) {
        throw new Error("RoutineTask can only be 'To Do' or 'Completed'");
      }
      return true;
    }),
  body("priority").if(body("taskType").equals(TASK_TYPES.ROUTINE_TASK))
    .custom((value) => {
      if (value && value !== TASK_PRIORITY.MEDIUM) {
        throw new Error("RoutineTask priority must be 'Medium'");
      }
      return true;
    }),

  // AssignedTask specific
  body("assignees").if(body("taskType").equals(TASK_TYPES.ASSIGNED_TASK))
    .isArray({ min: 1 }).withMessage("At least one assignee required for AssignedTask")
    .custom((value) => {
      if (value.length > LIMITS.MAX_ASSIGNEES) {
        throw new Error(`Cannot have more than ${LIMITS.MAX_ASSIGNEES} assignees`);
      }
      return value.every(id => mongoose.Types.ObjectId.isValid(id));
    }).withMessage("Invalid assignee ID(s)")
    .custom(async (value, { req }) => {
      const { default: User } = await import("../../models/User.js");
      const users = await User.find({ _id: { $in: value } }).lean();
      if (users.length !== value.length) throw new Error("One or more assignees not found");
      if (users.some(u => u.isDeleted)) throw new Error("One or more assignees are deleted");
      if (users.some(u => u.organization.toString() !== req.user.organization._id.toString())) {
        throw new Error("All assignees must belong to the same organization");
      }
      return true;
    }),

  body("watchers").optional().isArray().withMessage("Watchers must be an array")
    .custom((value) => value.length <= LIMITS.MAX_WATCHERS || (() => { throw new Error(`Cannot have more than ${LIMITS.MAX_WATCHERS} watchers`); })()),

  body("tags").optional().isArray().withMessage("Tags must be an array")
    .custom((value) => value.length <= LIMITS.MAX_TAGS || (() => { throw new Error(`Cannot have more than ${LIMITS.MAX_TAGS} tags`); })()),

  handleValidationErrors,
];

export const updateTaskValidator = [
  body("description").optional().trim().notEmpty().withMessage("Description cannot be empty")
    .isLength({ max: LIMITS.DESCRIPTION_MAX }).withMessage(`Description cannot exceed ${LIMITS.DESCRIPTION_MAX} characters`),

  body("status").optional().isIn(Object.values(TASK_STATUS)).withMessage("Invalid status"),
  body("priority").optional().isIn(Object.values(TASK_PRIORITY)).withMessage("Invalid priority"),

  body("startDate").optional().isISO8601().withMessage("Invalid start date"),
  body("dueDate").optional().isISO8601().withMessage("Invalid due date"),

  body("vendor").optional().custom((value) => !value || mongoose.Types.ObjectId.isValid(value) || (() => { throw new Error("Invalid vendor ID"); })()),
  body("assignees").optional().isArray().withMessage("Assignees must be an array"),
  body("watchers").optional().isArray().withMessage("Watchers must be an array"),
  body("tags").optional().isArray().withMessage("Tags must be an array"),

  handleValidationErrors,
];

export const taskIdValidator = [
  param("resourceId").trim().notEmpty().withMessage("Task ID is required")
    .custom((value) => mongoose.Types.ObjectId.isValid(value) || (() => { throw new Error("Invalid task ID"); })()),
  handleValidationErrors,
];
