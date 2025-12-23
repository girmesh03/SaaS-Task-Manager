import mongoose from "mongoose";
import BaseTask from "./BaseTask.js";
import { LIMITS, CURRENCY, TASK_TYPES } from "../utils/constants.js";

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
    index: true,
  },
  estimatedCost: {
    type: Number,
    min: [
      LIMITS.COST_MIN,
      `Estimated cost must be at least ${LIMITS.COST_MIN}`,
    ],
  },
  actualCost: {
    type: Number,
    min: [LIMITS.COST_MIN, `Actual cost must be at least ${LIMITS.COST_MIN}`],
  },
  currency: {
    type: String,
    default: CURRENCY.DEFAULT,
    enum: {
      values: Object.values(CURRENCY),
      message: "{VALUE} is not a valid currency",
    },
  },
  costHistory: {
    type: [
      {
        amount: {
          type: Number,
          required: true,
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

// Additional index for ProjectTask
projectTaskSchema.index({
  organization: 1,
  department: 1,
  startDate: 1,
  dueDate: 1,
});
projectTaskSchema.index({
  organization: 1,
  department: 1,
  status: 1,
  priority: 1,
  dueDate: 1,
});

// Validation: dueDate must be after startDate
projectTaskSchema.pre("save", function (next) {
  if (this.startDate && this.dueDate && this.dueDate <= this.startDate) {
    return next(new Error("Due date must be after start date"));
  }
  next();
});

// Create discriminator
const ProjectTask = BaseTask.discriminator(
  TASK_TYPES.PROJECT_TASK,
  projectTaskSchema
);

export default ProjectTask;
