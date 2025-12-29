import { param } from "express-validator";
import { handleValidationErrors } from "./validation.js";
import mongoose from "mongoose";

export const notificationIdValidator = [
  param("notificationId").trim().notEmpty().withMessage("Notification ID is required")
    .custom((value) => mongoose.Types.ObjectId.isValid(value) || (() => { throw new Error("Invalid notification ID"); })())
    .custom(async (value, { req }) => {
      const { default: Notification } = await import("../../models/Notification.js");
      const organizationId = req.user.organization._id;

      const notification = await Notification.findById(value)
        .withDeleted()
        .lean();

      if (!notification) {
        throw new Error("Notification not found");
      }

      if (notification.organization.toString() !== organizationId.toString()) {
        throw new Error("Notification belongs to another organization");
      }

      // Check if it's for the current user
      if (notification.recipient.toString() !== req.user._id.toString()) {
        throw new Error("Notification belongs to another user");
      }

      return true;
    }),
  handleValidationErrors,
];
