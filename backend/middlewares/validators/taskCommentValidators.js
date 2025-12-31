import { body, param, query } from "express-validator";
import { handleValidationErrors } from "./validation.js";
import { LIMITS } from "../../utils/constants.js";
import mongoose from "mongoose";

export const createTaskCommentValidator = [
  body("comment").trim().notEmpty().withMessage("Comment is required")
    .isLength({ max: LIMITS.COMMENT_MAX }).withMessage(`Comment cannot exceed ${LIMITS.COMMENT_MAX} characters`)
    .escape(),

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
    .isLength({ max: LIMITS.COMMENT_MAX }).withMessage(`Comment cannot exceed ${LIMITS.COMMENT_MAX} characters`)
    .escape(),

  body("mentions").optional().isArray().withMessage("Mentions must be an array")
    .custom((value) => value.length <= LIMITS.MAX_MENTIONS || (() => { throw new Error(`Cannot have more than ${LIMITS.MAX_MENTIONS} mentions`); })())
    .custom((value) => value.every(id => mongoose.Types.ObjectId.isValid(id)) || (() => { throw new Error("Invalid user ID in mentions"); })())
    .custom(async (value, { req }) => {
      if (!value || value.length === 0) return true;
      const { default: User } = await import("../../models/User.js");
      const organizationId = req.user.organization._id;
      const users = await User.find({
        _id: { $in: value },
        organization: organizationId
      }).withDeleted().lean();

      if (users.length !== new Set(value).size) {
        throw new Error("One or more mentioned users not found or belong to another organization");
      }
      if (users.some(u => u.isDeleted)) throw new Error("One or more mentioned users are deleted");
      return true;
    }),

  handleValidationErrors,
];

export const taskCommentIdValidator = [
  param("taskCommentId")
    .trim()
    .notEmpty()
    .withMessage("TaskComment ID is required")
    .custom((value) => mongoose.Types.ObjectId.isValid(value) || (() => { throw new Error("Invalid comment ID"); })())
    .custom(async (value, { req }) => {
      const { default: TaskComment } = await import("../../models/TaskComment.js");
      const organizationId = req.user.organization._id;

      const comment = await TaskComment.findById(value)
        .withDeleted()
        .lean();

      if (!comment) {
        throw new Error("Task comment not found");
      }

      if (comment.organization.toString() !== organizationId.toString()) {
        throw new Error("Task comment belongs to another organization");
      }

      return true;
    }),
  handleValidationErrors,
];

export const getTaskCommentsValidator = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
  query("parent").optional().isMongoId().withMessage("Parent must be a valid Mongo ID"),
  query("deleted").optional().isIn(["true", "false", "only"]),
  handleValidationErrors,
];
