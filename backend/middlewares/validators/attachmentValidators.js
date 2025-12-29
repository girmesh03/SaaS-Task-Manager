import { body, param } from "express-validator";
import { handleValidationErrors } from "./validation.js";
import { FILE_SIZE_LIMITS, FILE_TYPES } from "../../utils/constants.js";
import mongoose from "mongoose";

// Mime types validation is handled inside checks if needed, but currently verifying fileType enum.

export const createAttachmentValidator = [
  body("filename").trim().notEmpty().withMessage("Filename is required")
    .escape(),

  body("fileUrl").trim().notEmpty().withMessage("File URL is required")
    .isURL().withMessage("File URL must be a valid URL"),

  body("fileType").trim().notEmpty().withMessage("File type is required")
    .custom((value) => {
      // Check if value is a valid MIME type or type label?
      // Usually type label: "Image", "Video" etc.
      // Let's assume it expects the Enum value "Image", "Video", etc.
      const validTypes = Object.keys(FILE_TYPES);
      const normalized = value.toUpperCase();
      if (!validTypes.includes(normalized)) {
        throw new Error(`Invalid file type. Must be one of: ${validTypes.join(", ")}`);
      }
      return true;
    }),

  body("fileSize").isNumeric().withMessage("File size must be a number")
    .custom((value, { req }) => {
      const type = req.body.fileType ? req.body.fileType.toUpperCase() : "OTHER";
      const limit = FILE_SIZE_LIMITS[type] || FILE_SIZE_LIMITS.OTHER;
      if (value > limit) {
        throw new Error(`File size exceeds limit for ${type} (${limit} bytes)`);
      }
      return true;
    }),

  body("parent").trim().notEmpty().withMessage("Parent ID is required")
    .custom((value) => mongoose.Types.ObjectId.isValid(value) || (() => { throw new Error("Invalid parent ID"); })()),

  body("parentModel").trim().notEmpty().withMessage("Parent model is required")
    .isIn(["BaseTask", "TaskActivity", "TaskComment"]).withMessage("Parent model must be BaseTask, TaskActivity, or TaskComment")
    .custom(async (value, { req }) => {
      const parentId = req.body.parent;
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
