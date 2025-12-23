import mongoose from "mongoose";
import BaseTask from "./BaseTask.js";
import { LIMITS, CURRENCY, TASK_TYPES } from "../utils/constants.js";

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
    required: [true, "Vendor is required"],
  },
  estimatedCost: {
    type: Number,
    min: [
      LIMITS.COST_MIN,
      `Estimated cost cannot be less than ${LIMITS.COST_MIN}`,
    ],
    default: 0,
  },
  actualCost: {
    type: Number,
    min: [
      LIMITS.COST_MIN,
      `Actual cost cannot be less than ${LIMITS.COST_MIN}`,
    ],
    default: 0,
  },
  currency: {
    type: String,
    default: CURRENCY.DEFAULT,
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
          required: true,
          enum: ["estimated", "actual"],
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

// Pre-save validation for dueDate after startDate
projectTaskSchema.pre("save", function (next) {
  if (this.startDate && this.dueDate) {
    if (this.dueDate <= this.startDate) {
      return next(new Error("Due date must be after start date"));
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
