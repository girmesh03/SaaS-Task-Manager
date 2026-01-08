import { body, param, query } from "express-validator";
import { handleValidationErrors } from "./validation.js";
import { FILE_SIZE_LIMITS, ATTACHMENT_TYPES } from "../../utils/constants.js";
import mongoose from "mongoose";

// Mime types validation is handled inside checks if needed, but currently verifying fileType enum.

export const createAttachmentValidator = [
  body("filename").trim().notEmpty().withMessage("Filename is required")
    .escape(),

  body("fileUrl").trim().notEmpty().withMessage("File URL is required")
    .isURL().withMessage("File URL must be a valid URL"),

  body("fileType")
    .trim()
    .notEmpty()
    .withMessage("File type is required")
    .isIn(Object.values(ATTACHMENT_TYPES))
    .withMessage(`Invalid file type. Must be one of: ${Object.values(ATTACHMENT_TYPES).join(", ")}`),

  body("fileSize").isNumeric().withMessage("File size must be a number")
    .custom((value, { req }) => {
      // Allow case-insensitive lookup for size limit map, assuming keys are UPPERCASE
      const type = req.body.fileType ? req.body.fileType.toUpperCase() : "OTHER";
      const limit = FILE_SIZE_LIMITS[type] || FILE_SIZE_LIMITS.OTHER;
      if (value > limit) {
        throw new Error(`File size exceeds limit for ${req.body.fileType} (${limit} bytes)`);
      }
      return true;
    }),

  body("parentId").trim().notEmpty().withMessage("Parent ID is required")
    .custom((value) => mongoose.Types.ObjectId.isValid(value) || (() => { throw new Error("Invalid parent ID"); })()),

  body("parentModel").trim().notEmpty().withMessage("Parent model is required")
    .isIn(["BaseTask", "TaskActivity", "TaskComment"]).withMessage("Parent model must be BaseTask, TaskActivity, or TaskComment")
    .custom(async (value, { req }) => {
      const parentId = req.body.parentId;
      if (!parentId || !mongoose.Types.ObjectId.isValid(parentId)) return true;

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

  handleValidationErrors,
];

export const attachmentIdValidator = [
  param("attachmentId").trim().notEmpty().withMessage("Attachment ID is required")
    .custom((value) => mongoose.Types.ObjectId.isValid(value) || (() => { throw new Error("Invalid attachment ID"); })())
    .custom(async (value, { req }) => {
      const { default: Attachment } = await import("../../models/Attachment.js");
      const organizationId = req.user.organization._id;

      const attachment = await Attachment.findById(value)
        .withDeleted()
        .lean();

      if (!attachment) {
        throw new Error("Attachment not found");
      }

      if (attachment.organization.toString() !== organizationId.toString()) {
        throw new Error("Attachment belongs to another organization");
      }

      return true;
    }),
  handleValidationErrors,
];

export const getAttachmentsValidator = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
  query("parentId").optional().isMongoId().withMessage("Parent must be a valid Mongo ID"),
  query("parentModel").optional().isIn(["BaseTask", "TaskActivity", "TaskComment"]),
  query("deleted").optional().isIn(["true", "false", "only"]),
  handleValidationErrors,
];
