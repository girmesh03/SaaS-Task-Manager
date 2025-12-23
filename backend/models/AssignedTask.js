import mongoose from "mongoose";
import BaseTask from "./BaseTask.js";
import { LIMITS, TASK_TYPES } from "../utils/constants.js";

const assignedTaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true,
    maxlength: [
      LIMITS.TITLE_MAX,
      `Title cannot exceed ${LIMITS.TITLE_MAX} characters`,
    ],
  },
  assignees: {
    type: mongoose.Schema.Types.Mixed, // Can be single ObjectId or array of ObjectIds
    required: [true, "At least one assignee is required for AssignedTask"],
    validate: {
      validator: function (v) {
        // Normalize to array
        const assigneesArray = Array.isArray(v) ? v : [v];

        // Check if at least one assignee
        if (assigneesArray.length === 0) {
          return false;
        }

        // Check max assignees
        if (assigneesArray.length > LIMITS.MAX_WATCHERS) {
          return false;
        }

        return true;
      },
      message: `Must have at least 1 and at most ${LIMITS.MAX_WATCHERS} assignees`,
    },
  },
  startDate: {
    type: Date,
  },
  dueDate: {
    type: Date,
  },
});

// Additional index for AssignedTask
assignedTaskSchema.index({
  organization: 1,
  department: 1,
  startDate: 1,
  dueDate: 1,
});
assignedTaskSchema.index({
  organization: 1,
  department: 1,
  status: 1,
  priority: 1,
  dueDate: 1,
});

// Validation: dueDate must be after startDate if both provided
assignedTaskSchema.pre("save", function (next) {
  if (this.startDate && this.dueDate && this.dueDate <= this.startDate) {
    return next(new Error("Due date must be after start date"));
  }
  next();
});

// Create discriminator
const AssignedTask = BaseTask.discriminator(
  TASK_TYPES.ASSIGNED_TASK,
  assignedTaskSchema
);

export default AssignedTask;
