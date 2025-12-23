import mongoose from "mongoose";
import BaseTask from "./BaseTask.js";
import {
  LIMITS,
  TASK_TYPES,
  TASK_STATUS,
  TASK_PRIORITY,
} from "../utils/constants.js";

// RoutineTask discriminator schema
const routineTaskSchema = new mongoose.Schema({
  materials: {
    type: [
      {
        material: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Material",
          required: [true, "Material reference is required"],
        },
        quantity: {
          type: Number,
          required: [true, "Quantity is required"],
          min: [0, "Quantity cannot be negative"],
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

// Validation: status NOT "To Do" (must be In Progress, Completed, or Pending)
// Validation: priority NOT "Low" (must be Medium, High, or Urgent)
// Validation: dueDate must be after startDate
// Validation: startDate and dueDate must not be in future
// Validation: materials exist and not deleted
routineTaskSchema.pre("save", async function (next) {
  const session = this.$session();

  // Validate status is NOT "To Do"
  if (this.status === TASK_STATUS.TO_DO) {
    const error = new Error(
      'RoutineTask status cannot be "To Do". Must be In Progress, Completed, or Pending'
    );
    error.name = "ValidationError";
    return next(error);
  }

  // Validate priority is NOT "Low"
  if (this.priority === TASK_PRIORITY.LOW) {
    const error = new Error(
      'RoutineTask priority cannot be "Low". Must be Medium, High, or Urgent'
    );
    error.name = "ValidationError";
    return next(error);
  }

  // Validate dueDate is after startDate
  if (this.startDate && this.dueDate && this.dueDate <= this.startDate) {
    const error = new Error("Due date must be after start date");
    error.name = "ValidationError";
    return next(error);
  }

  // Validate startDate is not in future
  if (this.isModified("startDate") && this.startDate) {
    const now = new Date();
    if (this.startDate > now) {
      const error = new Error("Start date cannot be in the future");
      error.name = "ValidationError";
      return next(error);
    }
  }

  // Validate dueDate is not in future
  if (this.isModified("dueDate") && this.dueDate) {
    const now = new Date();
    if (this.dueDate > now) {
      const error = new Error("Due date cannot be in the future");
      error.name = "ValidationError";
      return next(error);
    }
  }

  // Validate materials exist and are not deleted
  if (
    this.isModified("materials") &&
    this.materials &&
    this.materials.length > 0
  ) {
    const Material = mongoose.model("Material");
    const materialIds = this.materials.map((m) => m.material);
    const materials = await Material.find({ _id: { $in: materialIds } })
      .withDeleted()
      .session(session);

    // Check all materials exist
    if (materials.length !== materialIds.length) {
      const error = new Error("One or more materials not found");
      error.name = "ValidationError";
      return next(error);
    }

    // Check no materials are deleted
    for (const material of materials) {
      if (material.isDeleted) {
        const error = new Error(
          `Material ${material.name} is deleted and cannot be used`
        );
        error.name = "ValidationError";
        return next(error);
      }
    }
  }

  next();
});

// Create RoutineTask discriminator
const RoutineTask = BaseTask.discriminator(
  TASK_TYPES.ROUTINE_TASK,
  routineTaskSchema
);

export default RoutineTask;
