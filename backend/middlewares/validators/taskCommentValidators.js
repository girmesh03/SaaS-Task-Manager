import { body, param } from "express-validator";
import { handleValidationErrors } from "./validation.js";
import { LIMITS } from "../../utils/constants.js";
import mongoose from "mongoose";

export const createTaskCommentValidator = [
  body("comment").trim().notEmpty().withMessage("Comment is required")
    .isLength({ max: LIMITS.COMMENT_MAX }).withMessage(`Comment cannot exceed ${LIMITS.COMMENT_MAX} characters`),

  body("parent").trim().notEmpty().withMessage("Parent ID is required")
    .custom((value) => mongoose.Types.ObjectId.isValid(value) || (() => { throw new Error("Invalid parent ID"); })()),

  body("parentModel").trim().notEmpty().withMessage("Parent model is required")
    .isIn(["BaseTask", "TaskActivity", "TaskComment"]).withMessage("Parent model must be BaseTask, TaskActivity, or TaskComment")
    .custom(async (value, { req }) => {
      const parentId = req.body.parent;
      if (!parentId || !mongoose.Types.ObjectId.isValid(parentId)) return true; // Handled by parent check

      let ParentModel;
      if (value === "BaseTask") ParentModel = mongoose.model("BaseTask");
      else if (value === "TaskActivity") ParentModel = mongoose.model("TaskActivity");
      else if (value === "TaskComment") ParentModel = mongoose.model("TaskComment");

      if (!ParentModel) throw new Error("Invalid parent model configuration");

      const parent = await ParentModel.findById(parentId).lean();
      if (!parent) throw new Error(`${value} not found`);
      if (parent.isDeleted) throw new Error(`${value} is deleted`);
      if (parent.organization.toString() !== req.user.organization._id.toString()) {
        throw new Error(`${value} belongs to another organization`);
      }
      return true;
    }),

  body("mentions").optional().isArray().withMessage("Mentions must be an array")
    .custom((value) => value.length <= LIMITS.MAX_MENTIONS || (() => { throw new Error(`Cannot have more than ${LIMITS.MAX_MENTIONS} mentions`); })())
    .custom((value) => value.every(id => mongoose.Types.ObjectId.isValid(id)) || (() => { throw new Error("Invalid user ID in mentions"); })())
    .custom(async (value, { req }) => {
      if (!value || value.length === 0) return true;
      const { default: User } = await import("../../models/User.js");
      const users = await User.find({ _id: { $in: value } }).lean();

      if (users.length !== value.length) throw new Error("One or more mentioned users not found");
      if (users.some(u => u.isDeleted)) throw new Error("One or more mentioned users are deleted");
      if (users.some(u => u.organization.toString() !== req.user.organization._id.toString())) {
        throw new Error("All mentioned users must belong to the same organization");
      }
      return true;
    }),

  handleValidationErrors,
];

export const updateTaskCommentValidator = [
  body("comment").optional().trim().notEmpty().withMessage("Comment cannot be empty")
    .isLength({ max: LIMITS.COMMENT_MAX }).withMessage(`Comment cannot exceed ${LIMITS.COMMENT_MAX} characters`),

  body("mentions").optional().isArray().withMessage("Mentions must be an array"),

  handleValidationErrors,
];

export const taskCommentIdValidator = [
  param("resourceId").trim().notEmpty().withMessage("TaskComment ID is required")
    .custom((value) => mongoose.Types.ObjectId.isValid(value) || (() => { throw new Error("Invalid comment ID"); })()),
  handleValidationErrors,
];
