import { param } from "express-validator";
import { handleValidationErrors } from "./validation.js";
import mongoose from "mongoose";

export const notificationIdValidator = [
  param("resourceId").trim().notEmpty().withMessage("Notification ID is required")
    .custom((value) => mongoose.Types.ObjectId.isValid(value) || (() => { throw new Error("Invalid notification ID"); })()),
  handleValidationErrors,
];
