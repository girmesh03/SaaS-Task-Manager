import mongoose from "mongoose";
import BaseTask from "./BaseTask.js";
import { LIMITS, TASK_TYPES } from "../utils/constants.js";
import CustomError from "../errorHandler/CustomError.js";

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
    return next(CustomError.validation("At least one assignee is required"));
  }

  // Validate dueDate is after startDate if both provided
  if (this.startDate && this.dueDate && this.dueDate <= this.startDate) {
    return next(CustomError.validation("Due date must be after start date"));
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
      return next(CustomError.validation("One or more assignees not found"));
    }

    // Check no assignees are deleted
    for (const assignee of assignees) {
      if (assignee.isDeleted) {
        return next(
          CustomError.validation(
            `User ${
              assignee.fullName || assignee.email
            } is deleted and cannot be assigned to task`
          )
        );
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

// Strict Restore Mode: Check parent integrity
/**
 * CRITICAL: Per docs/validate-correct.md
 * AssignedTask must call BaseTask.strictParentCheck
 */
AssignedTask.strictParentCheck = async function (doc, { session } = {}) {
  // Check BaseTask parents (Organization, Department)
  await BaseTask.strictParentCheck(doc, { session });
};

// Strict Restore Mode: Validate Critical Dependencies
AssignedTask.validateCriticalDependencies = async function (
  doc,
  { session } = {}
) {
  const User = mongoose.model("User");
  const assignees = await User.find({ _id: { $in: doc.assignees } })
    .withDeleted()
    .session(session);

  // Requirement: "Restore if at least one original assignee is still active"
  const activeAssignees = assignees.filter((a) => !a.isDeleted);

  if (activeAssignees.length === 0) {
    throw CustomError.validation(
      "Cannot restore assigned task: All original assignees are deleted. Restore at least one assignee first.",
      "ASSIGNED_TASK_NO_ACTIVE_ASSIGNEES"
    );
  }
};

// Strict Restore Mode: Non-blocking Repairs
AssignedTask.repairOnRestore = async function (doc, { session } = {}) {
  const User = mongoose.model("User");
  const validAssignees = await User.find({
    _id: { $in: doc.assignees },
    isDeleted: false,
  })
    .session(session)
    .select("_id")
    .lean();

  doc.assignees = validAssignees.map((u) => u._id);
};

export default AssignedTask;
