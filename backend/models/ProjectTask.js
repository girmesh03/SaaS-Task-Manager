import mongoose from "mongoose";
import BaseTask from "./BaseTask.js";
import { LIMITS, TASK_TYPES } from "../utils/constants.js";

// ProjectTask discriminator schema
const projectTaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true,
    maxlength: [
      LIMITS.TITLE_MAX,
      `Title cannot exceed ${LIMITS.TITLE_MAX} characters`,
    ],
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vendor",
    required: [true, "Vendor is required for ProjectTask"],
  },
  estimatedCost: {
    type: Number,
    min: [0, "Estimated cost cannot be negative"],
    default: 0,
  },
  actualCost: {
    type: Number,
    min: [0, "Actual cost cannot be negative"],
    default: 0,
  },
  currency: {
    type: String,
    default: "ETB",
    trim: true,
  },
  costHistory: {
    type: [
      {
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
        type: {
          type: String,
          enum: ["estimated", "actual"],
          required: true,
        },
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    validate: {
      validator: function (v) {
        return v.length <= LIMITS.MAX_COST_HISTORY;
      },
      message: `Cannot have more than ${LIMITS.MAX_COST_HISTORY} cost history entries`,
    },
    default: [],
  },
  startDate: {
    type: Date,
  },
  dueDate: {
    type: Date,
  },
});

// Validation: dueDate must be after startDate if both provided
projectTaskSchema.pre("save", async function (next) {
  const session = this.$session();

  // Validate dueDate is after startDate
  if (this.startDate && this.dueDate && this.dueDate <= this.startDate) {
    const error = new Error("Due date must be after start date");
    error.name = "ValidationError";
    return next(error);
  }

  // Validate vendor exists and is not deleted
  if (this.isModified("vendor") && this.vendor) {
    const Vendor = mongoose.model("Vendor");
    const vendor = await Vendor.findById(this.vendor)
      .withDeleted()
      .session(session);

    if (!vendor) {
      const error = new Error("Vendor not found");
      error.name = "ValidationError";
      return next(error);
    }

    if (vendor.isDeleted) {
      const error = new Error("Cannot assign deleted vendor to task");
      error.name = "ValidationError";
      return next(error);
    }
  }

  // Validate watchers are HOD users
  if (
    this.isModified("watchers") &&
    this.watchers &&
    this.watchers.length > 0
  ) {
    const User = mongoose.model("User");
    const watchers = await User.find({ _id: { $in: this.watchers } })
      .withDeleted()
      .session(session);

    for (const watcher of watchers) {
      if (!watcher.isHod) {
        const error = new Error(
          `User ${
            watcher.fullName || watcher.email
          } is not a HOD and cannot be a watcher`
        );
        error.name = "ValidationError";
        return next(error);
      }

      if (watcher.isDeleted) {
        const error = new Error(
          `User ${
            watcher.fullName || watcher.email
          } is deleted and cannot be a watcher`
        );
        error.name = "ValidationError";
        return next(error);
      }
    }
  }

  next();
});

// Create ProjectTask discriminator
const ProjectTask = BaseTask.discriminator(
  TASK_TYPES.PROJECT_TASK,
  projectTaskSchema
);

export default ProjectTask;
