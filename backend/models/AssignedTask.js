import mongoose from "mongoose";
import BaseTask from "./BaseTask.js";
import { LIMITS, TASK_TYPES } from "../utils/constants.js";

// AssignedTask discriminator schema
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
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    required: [true, "At least one assignee is required"],
    validate: {
      validator: function (v) {
        return v && v.length > 0 && v.length <= LIMITS.MAX_ASSIGNEES;
      },
      message: `Must have at least 1 and at most ${LIMITS.MAX_ASSIGNEES} assignees`,
    },
  },
  startDate: {
    type: Date,
  },
  dueDate: {
    type: Date,
  },
});

// Validation: at least one assignee
// Validation: assignees exist and not deleted
// Validation: dueDate must be after startDate if both provided
assignedTaskSchema.pre("save", async function (next) {
  const session = this.$session();

  // Validate at least one assignee
  if (!this.assignees || this.assignees.length === 0) {
    const error = new Error("At least one assignee is required");
    error.name = "ValidationError";
    return next(error);
  }

  // Validate dueDate is after startDate if both provided
  if (this.startDate && this.dueDate && this.dueDate <= this.startDate) {
    const error = new Error("Due date must be after start date");
    error.name = "ValidationError";
    return next(error);
  }

  // Validate assignees exist and are not deleted
  if (
    this.isModified("assignees") &&
    this.assignees &&
    this.assignees.length > 0
  ) {
    const User = mongoose.model("User");
    const assignees = await User.find({ _id: { $in: this.assignees } })
      .withDeleted()
      .session(session);

    // Check all assignees exist
    if (assignees.length !== this.assignees.length) {
      const error = new Error("One or more assignees not found");
      error.name = "ValidationError";
      return next(error);
    }

    // Check no assignees are deleted
    for (const assignee of assignees) {
      if (assignee.isDeleted) {
        const error = new Error(
          `User ${
            assignee.fullName || assignee.email
          } is deleted and cannot be assigned to task`
        );
        error.name = "ValidationError";
        return next(error);
      }
    }
  }

  next();
});

// Create AssignedTask discriminator
const AssignedTask = BaseTask.discriminator(
  TASK_TYPES.ASSIGNED_TASK,
  assignedTaskSchema
);

export default AssignedTask;
