import { body, param } from "express-validator";
import { handleValidationErrors } from "./validation.js";
import { LIMITS, TASK_TYPES, TASK_STATUS, TASK_PRIORITY } from "../../utils/constants.js";
import mongoose from "mongoose";
import { isValidDate, isBefore, isAfter } from "../../utils/dateUtils.js";

export const createTaskValidator = [
  body("description").trim().notEmpty().withMessage("Description is required")
    .isLength({ max: LIMITS.DESCRIPTION_MAX }).withMessage(`Description cannot exceed ${LIMITS.DESCRIPTION_MAX} characters`)
    .escape(),

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
  body("title").if(body("taskType").isIn([TASK_TYPES.PROJECT_TASK, TASK_TYPES.ASSIGNED_TASK]))
    .trim().notEmpty().withMessage("Title is required")
    .isLength({ max: LIMITS.TITLE_MAX }).withMessage(`Title cannot exceed ${LIMITS.TITLE_MAX} characters`)
    .escape(),

  body("startDate").if(body("taskType").equals(TASK_TYPES.PROJECT_TASK))
    .notEmpty().withMessage("Start date required for ProjectTask")
    .custom((value) => isValidDate(value)).withMessage("Invalid start date"),
  body("dueDate").if(body("taskType").equals(TASK_TYPES.PROJECT_TASK))
    .notEmpty().withMessage("Due date required for ProjectTask")
    .custom((value) => isValidDate(value)).withMessage("Invalid due date")
    .custom((value, { req }) => {
      if (req.body.startDate && isValidDate(req.body.startDate) && isValidDate(value)) {
        if (isBefore(value, req.body.startDate)) {
          throw new Error("Due date cannot be before start date");
        }
      }
      return true;
    }),
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
  body("estimatedCost").if(body("taskType").equals(TASK_TYPES.PROJECT_TASK))
    .optional().isFloat({ min: 0 }).withMessage("Estimated cost cannot be negative"),
  body("actualCost").if(body("taskType").equals(TASK_TYPES.PROJECT_TASK))
    .optional().isFloat({ min: 0 }).withMessage("Actual cost cannot be negative"),
  body("currency").if(body("taskType").equals(TASK_TYPES.PROJECT_TASK))
    .optional().trim().escape(),

  // RoutineTask specific
  body("startDate").if(body("taskType").equals(TASK_TYPES.ROUTINE_TASK))
    .notEmpty().withMessage("Start date required for RoutineTask")
    .custom((value) => isValidDate(value)).withMessage("Invalid start date"),
  body("dueDate").if(body("taskType").equals(TASK_TYPES.ROUTINE_TASK))
    .notEmpty().withMessage("Due date required for RoutineTask")
    .custom((value) => isValidDate(value)).withMessage("Invalid due date")
    .custom((value, { req }) => {
      if (req.body.startDate && isValidDate(req.body.startDate) && isValidDate(value)) {
        if (isBefore(value, req.body.startDate)) {
          throw new Error("Due date cannot be before start date");
        }
      }
      return true;
    }),
  body("status").if(body("taskType").equals(TASK_TYPES.ROUTINE_TASK))
    .custom((value) => {
      if (value && value === TASK_STATUS.TO_DO) {
        throw new Error("RoutineTask status cannot be 'To Do'. Must be 'In Progress', 'Completed', or 'Pending'");
      }
      return true;
    }),
  body("priority").if(body("taskType").equals(TASK_TYPES.ROUTINE_TASK))
    .custom((value) => {
      if (value && value === TASK_PRIORITY.LOW) {
        throw new Error("RoutineTask priority cannot be 'Low'. Must be 'Medium', 'High', or 'Urgent'");
      }
      return true;
    }),
  body("materials").if(body("taskType").equals(TASK_TYPES.ROUTINE_TASK))
    .optional().isArray().withMessage("Materials must be an array")
    .custom((value) => value.length <= LIMITS.MAX_MATERIALS || (() => { throw new Error(`Cannot have more than ${LIMITS.MAX_MATERIALS} materials`); })())
    .custom(async (value, { req }) => {
      if (!value || value.length === 0) return true;
      const { default: Material } = await import("../../models/Material.js");
      const organizationId = req.user.organization._id;
      const materialIds = value.map(m => m.material);
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

  // AssignedTask specific
  body("assignees").if(body("taskType").equals(TASK_TYPES.ASSIGNED_TASK))
    .isArray({ min: 1 }).withMessage("At least one assignee required for AssignedTask")
    .custom((value) => {
      if (value.length > LIMITS.MAX_ASSIGNEES) {
        throw new Error(`Cannot have more than ${LIMITS.MAX_ASSIGNEES} assignees`);
      }
      if (!value.every(id => mongoose.Types.ObjectId.isValid(id))) {
        throw new Error("Invalid assignee ID(s)");
      }
      return true;
    })
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

  body("assignees").optional().isArray().withMessage("Assignees must be an array")
    .custom((value) => value.length <= LIMITS.MAX_ASSIGNEES || (() => { throw new Error(`Cannot have more than ${LIMITS.MAX_ASSIGNEES} assignees`); })())
    .custom(async (value, { req }) => {
      if (!value || value.length === 0) return true;
      const { default: User } = await import("../../models/User.js");
      const organizationId = req.user.organization._id;

      const users = await User.find({
        _id: { $in: value },
        organization: organizationId
      }).withDeleted().lean();

      if (users.length !== new Set(value).size) {
        throw new Error("One or more assignees not found or belong to another organization");
      }
      if (users.some(u => u.isDeleted)) {
        throw new Error("One or more assignees are deleted");
      }
      return true;
    }),

  body("watchers").optional().isArray().withMessage("Watchers must be an array")
    .custom((value) => value.length <= LIMITS.MAX_WATCHERS || (() => { throw new Error(`Cannot have more than ${LIMITS.MAX_WATCHERS} watchers`); })())
    .custom(async (value, { req }) => {
      if (!value || value.length === 0) return true;
      const { default: User } = await import("../../models/User.js");
      const organizationId = req.user.organization._id;

      const users = await User.find({
        _id: { $in: value },
        organization: organizationId
      }).withDeleted().lean();

      if (users.length !== new Set(value).size) {
        throw new Error("One or more watchers not found or belong to another organization");
      }
      if (users.some(u => u.isDeleted)) {
        throw new Error("One or more watchers are deleted");
      }
      if (users.some(u => !u.isHod)) {
        throw new Error("All watchers must be HOD users (Admin or SuperAdmin)");
      }
      return true;
    }),

  body("tags").optional().isArray().withMessage("Tags must be an array")
    .custom((value) => value.length <= LIMITS.MAX_TAGS || (() => { throw new Error(`Cannot have more than ${LIMITS.MAX_TAGS} tags`); })())
    .custom((value) => {
      if (!value) return true;
      const uniqueTags = new Set(value.map(tag => tag.trim().toLowerCase()));
      if (uniqueTags.size !== value.length) {
        throw new Error("Tags must be unique");
      }
      return true;
    }),

  body("attachments").optional().isArray().withMessage("Attachments must be an array")
    .custom((value) => value.length <= LIMITS.MAX_ATTACHMENTS || (() => { throw new Error(`Cannot have more than ${LIMITS.MAX_ATTACHMENTS} attachments`); })())
    .custom(async (value, { req }) => {
      if (!value || value.length === 0) return true;
      const { default: Attachment } = await import("../../models/Attachment.js");
      const organizationId = req.user.organization._id;
      const attachments = await Attachment.find({
        _id: { $in: value },
        organization: organizationId
      }).withDeleted().lean();

      if (attachments.length !== new Set(value).size) {
        throw new Error("One or more attachments not found or belong to another organization");
      }
      if (attachments.some(a => a.isDeleted)) throw new Error("One or more attachments are deleted");
      return true;
    }),

  handleValidationErrors,
];

export const updateTaskValidator = [
  body("description").optional().trim().notEmpty().withMessage("Description cannot be empty")
    .isLength({ max: LIMITS.DESCRIPTION_MAX }).withMessage(`Description cannot exceed ${LIMITS.DESCRIPTION_MAX} characters`)
    .escape(),

  body("status").optional().isIn(Object.values(TASK_STATUS)).withMessage("Invalid status")
    .custom(async (value, { req }) => {
      if (value === TASK_STATUS.TO_DO) {
        const { default: BaseTask } = await import("../../models/BaseTask.js");
        const task = await BaseTask.findById(req.params.taskId).lean();
        if (task && task.taskType === TASK_TYPES.ROUTINE_TASK) {
          throw new Error("RoutineTask status cannot be 'To Do'. Must be 'In Progress', 'Completed', or 'Pending'");
        }
      }
      return true;
    }),
  body("priority").optional().isIn(Object.values(TASK_PRIORITY)).withMessage("Invalid priority")
    .custom(async (value, { req }) => {
      if (value === TASK_PRIORITY.LOW) {
        const { default: BaseTask } = await import("../../models/BaseTask.js");
        const task = await BaseTask.findById(req.params.taskId).lean();
        if (task && task.taskType === TASK_TYPES.ROUTINE_TASK) {
          throw new Error("RoutineTask priority cannot be 'Low'. Must be 'Medium', 'High', or 'Urgent'");
        }
      }
      return true;
    }),


  body("title").optional().trim()
    .notEmpty().withMessage("Title cannot be empty")
    .isLength({ max: LIMITS.TITLE_MAX }).withMessage(`Title cannot exceed ${LIMITS.TITLE_MAX} characters`)
    .escape(),

  body("startDate").optional().custom((value) => isValidDate(value)).withMessage("Invalid start date"),
  body("dueDate").optional()
    .custom((value) => isValidDate(value)).withMessage("Invalid due date")
    .custom((value, { req }) => {
      if (req.body.startDate && isValidDate(req.body.startDate) && isValidDate(value)) {
        if (isBefore(value, req.body.startDate)) {
          throw new Error("Due date cannot be before start date");
        }
      }
      return true;
    }),

  body("vendor").optional().custom((value) => !value || mongoose.Types.ObjectId.isValid(value) || (() => { throw new Error("Invalid vendor ID"); })()),
  body("estimatedCost").optional().isFloat({ min: 0 }).withMessage("Estimated cost cannot be negative"),
  body("actualCost").optional().isFloat({ min: 0 }).withMessage("Actual cost cannot be negative"),
  body("currency").optional().trim().escape(),

  body("materials").optional().isArray().withMessage("Materials must be an array")
    .custom((value) => value.length <= LIMITS.MAX_MATERIALS || (() => { throw new Error(`Cannot have more than ${LIMITS.MAX_MATERIALS} materials`); })())
    .custom(async (value, { req }) => {
      if (!value || value.length === 0) return true;
      const { default: Material } = await import("../../models/Material.js");
      const organizationId = req.user.organization._id;
      const materialIds = value.map(m => m.material);
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

  body("assignees").optional().isArray().withMessage("Assignees must be an array")
    .custom(async (value, { req }) => {
      if (!value || value.length === 0) return true;
      if (value.length > LIMITS.MAX_ASSIGNEES) {
         throw new Error(`Cannot have more than ${LIMITS.MAX_ASSIGNEES} assignees`);
      }
      const { default: User } = await import("../../models/User.js");
      const organizationId = req.user.organization._id;

      const users = await User.find({
        _id: { $in: value },
        organization: organizationId
      }).withDeleted().lean();

      if (users.length !== new Set(value).size) {
        throw new Error("One or more assignees not found or belong to another organization");
      }
      if (users.some(u => u.isDeleted)) {
        throw new Error("One or more assignees are deleted");
      }
      return true;
    }),
  body("watchers").optional().isArray().withMessage("Watchers must be an array")
    .custom(async (value, { req }) => {
      if (!value || value.length === 0) return true;
      if (value.length > LIMITS.MAX_WATCHERS) {
         throw new Error(`Cannot have more than ${LIMITS.MAX_WATCHERS} watchers`);
      }
      const { default: User } = await import("../../models/User.js");
      const organizationId = req.user.organization._id;

      const users = await User.find({
        _id: { $in: value },
        organization: organizationId
      }).withDeleted().lean();

      if (users.length !== new Set(value).size) {
        throw new Error("One or more watchers not found or belong to another organization");
      }
      if (users.some(u => u.isDeleted)) {
        throw new Error("One or more watchers are deleted");
      }
      if (users.some(u => !u.isHod)) {
        throw new Error("All watchers must be HOD users (Admin or SuperAdmin)");
      }
      return true;
    }),
  body("tags").optional().isArray().withMessage("Tags must be an array")
    .custom((value) => {
      if (!value) return true;
      if (value.length > LIMITS.MAX_TAGS) {
        throw new Error(`Cannot have more than ${LIMITS.MAX_TAGS} tags`);
      }
      const uniqueTags = new Set(value.map(tag => tag.trim().toLowerCase()));
      if (uniqueTags.size !== value.length) {
        throw new Error("Tags must be unique");
      }
      return true;
    }),

  body("attachments").optional().isArray().withMessage("Attachments must be an array")
    .custom((value) => value.length <= LIMITS.MAX_ATTACHMENTS || (() => { throw new Error(`Cannot have more than ${LIMITS.MAX_ATTACHMENTS} attachments`); })())
    .custom(async (value, { req }) => {
      if (!value || value.length === 0) return true;
      const { default: Attachment } = await import("../../models/Attachment.js");
      const organizationId = req.user.organization._id;
      const attachments = await Attachment.find({
        _id: { $in: value },
        organization: organizationId
      }).withDeleted().lean();

      if (attachments.length !== new Set(value).size) {
        throw new Error("One or more attachments not found or belong to another organization");
      }
      if (attachments.some(a => a.isDeleted)) throw new Error("One or more attachments are deleted");
      return true;
    }),

  handleValidationErrors,
];

export const taskIdValidator = [
  param("taskId").trim().notEmpty().withMessage("Task ID is required")
    .custom((value) => mongoose.Types.ObjectId.isValid(value) || (() => { throw new Error("Invalid task ID"); })())
    .custom(async (value, { req }) => {
      const { default: BaseTask } = await import("../../models/BaseTask.js");
      const organizationId = req.user.organization._id;

      const task = await BaseTask.findById(value)
        .withDeleted()
        .lean();

      if (!task) {
        throw new Error("Task not found");
      }

      if (task.organization.toString() !== organizationId.toString()) {
        throw new Error("Task belongs to another organization");
      }

      return true;
    }),
  handleValidationErrors,
];
