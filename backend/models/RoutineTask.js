import mongoose from "mongoose";
import BaseTask from "./BaseTask.js";
import {
  LIMITS,
  TASK_STATUS,
  TASK_PRIORITY,
  TASK_TYPES,
} from "../utils/constants.js";

const routineTaskSchema = new mongoose.Schema({
  materials: {
    type: [
      {
        material: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Material",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: [
            LIMITS.QUANTITY_MIN,
            `Quantity must be at least ${LIMITS.QUANTITY_MIN}`,
          ],
        },
      },
    ],
    validate: {
      validator: function (v) {
        return v.length <= LIMITS.MAX_MATERIALS;
      },
      message: `Cannot have more than ${LIMITS.MAX_MATERIALS} materials`,
    },
    default: [],
  },
  startDate: {
    type: Date,
    required: [true, "Start date is required for RoutineTask"],
  },
  dueDate: {
    type: Date,
    required: [true, "Due date is required for RoutineTask"],
  },
});

// Additional index for RoutineTask
routineTaskSchema.index({
  organization: 1,
  department: 1,
  startDate: 1,
  dueDate: 1,
});
routineTaskSchema.index({
  organization: 1,
  department: 1,
  status: 1,
  priority: 1,
  dueDate: 1,
});

// Validation: status cannot be "To Do"
routineTaskSchema.pre("save", function (next) {
  if (this.status === TASK_STATUS.TO_DO) {
    return next(
      new Error(
        'RoutineTask status cannot be "To Do". Must be In Progress, Completed, or Pending'
      )
    );
  }
  next();
});

// Validation: priority cannot be "Low"
routineTaskSchema.pre("save", function (next) {
  if (this.priority === TASK_PRIORITY.LOW) {
    return next(
      new Error(
        'RoutineTask priority cannot be "Low". Must be Medium, High, or Urgent'
      )
    );
  }
  next();
});

// Validation: dueDate must be after startDate
routineTaskSchema.pre("save", function (next) {
  if (this.startDate && this.dueDate && this.dueDate <= this.startDate) {
    return next(new Error("Due date must be after start date"));
  }
  next();
});

// Validation: startDate and dueDate cannot be in the future
routineTaskSchema.pre("save", function (next) {
  const now = new Date();

  if (this.startDate && this.startDate > now) {
    return next(new Error("Start date cannot be in the future"));
  }

  if (this.dueDate && this.dueDate > now) {
    return next(new Error("Due date cannot be in the future"));
  }

  next();
});

// Create discriminator
const RoutineTask = BaseTask.discriminator(
  TASK_TYPES.ROUTINE_TASK,
  routineTaskSchema
);

export default RoutineTask;
