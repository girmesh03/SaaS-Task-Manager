import mongoose from "mongoose";
import BaseTask from "./BaseTask.js";
import {
  LIMITS,
  TASK_TYPES,
  TASK_STATUS,
  TASK_PRIORITY,
} from "../utils/constants.js";
import CustomError from "../errorHandler/CustomError.js";

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
    return next(
      CustomError.validation(
        'RoutineTask status cannot be "To Do". Must be In Progress, Completed, or Pending'
      )
    );
  }

  // Validate priority is NOT "Low"
  if (this.priority === TASK_PRIORITY.LOW) {
    return next(
      CustomError.validation(
        'RoutineTask priority cannot be "Low". Must be Medium, High, or Urgent'
      )
    );
  }

  // Validate dueDate is after startDate
  if (this.startDate && this.dueDate && this.dueDate <= this.startDate) {
    return next(CustomError.validation("Due date must be after start date"));
  }

  // NOTE: Removed future date checks as they are not explicitly required and may block scheduling.

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
      return next(CustomError.validation("One or more materials not found"));
    }

    // Check no materials are deleted
    for (const material of materials) {
      if (material.isDeleted) {
        return next(
          CustomError.validation(
            `Material ${material.name} is deleted and cannot be used`
          )
        );
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

// Strict Restore Mode: Validate Critical Dependencies
RoutineTask.validateCriticalDependencies = async function (
  doc,
  { session } = {}
) {
  if (doc.materials && doc.materials.length > 0) {
    const Material = mongoose.model("Material");
    const materialIds = doc.materials.map((m) => m.material);
    const materials = await Material.find({ _id: { $in: materialIds } })
      .withDeleted()
      .session(session);

    for (const material of materials) {
      if (material.isDeleted) {
        throw CustomError.validation(
          `Cannot restore routine task: Material "${material.name}" is deleted. Restore the material first.`,
          "RESTORE_BLOCKED_DEPENDENCY_DELETED"
        );
      }
    }
  }
};

// Strict Restore Mode: Non-blocking Repairs
RoutineTask.repairOnRestore = async function (doc, { session } = {}) {
  if (doc.materials && doc.materials.length > 0) {
    const Material = mongoose.model("Material");
    const materialIds = doc.materials.map((m) => m.material);
    const validMaterials = await Material.find({
      _id: { $in: materialIds },
      isDeleted: false,
    })
      .session(session)
      .select("_id")
      .lean();

    const validMaterialIds = validMaterials.map((m) => m._id.toString());
    doc.materials = doc.materials.filter((m) =>
      validMaterialIds.includes(m.material.toString())
    );
  }
};

export default RoutineTask;
