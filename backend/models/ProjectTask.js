import mongoose from "mongoose";
import BaseTask from "./BaseTask.js";
import { LIMITS, TASK_TYPES } from "../utils/constants.js";
import CustomError from "../errorHandler/CustomError.js";

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
    return next(CustomError.validation("Due date must be after start date"));
  }

  // Validate vendor exists and is not deleted
  if (this.isModified("vendor") && this.vendor) {
    const Vendor = mongoose.model("Vendor");
    const vendor = await Vendor.findById(this.vendor)
      .withDeleted()
      .session(session);

    if (!vendor) {
      return next(CustomError.notFound("Vendor", this.vendor));
    }

    if (vendor.isDeleted) {
      return next(
        CustomError.validation("Cannot assign deleted vendor to task")
      );
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
        return next(
          CustomError.validation(
            `User ${
              watcher.fullName || watcher.email
            } is not a HOD and cannot be a watcher`
          )
        );
      }

      if (watcher.isDeleted) {
        return next(
          CustomError.validation(
            `User ${
              watcher.fullName || watcher.email
            } is deleted and cannot be a watcher`
          )
        );
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

// Strict Restore Mode: Check parent integrity
ProjectTask.strictParentCheck = async function (doc, { session } = {}) {
  // Check BaseTask parents (Organization, Department)
  await BaseTask.strictParentCheck(doc, { session });

  // Check Vendor
  const Vendor = mongoose.model("Vendor");
  const vendor = await Vendor.findById(doc.vendor)
    .withDeleted()
    .session(session);

  if (!vendor || vendor.isDeleted) {
    throw CustomError.validation(
      "Cannot restore project task because its vendor is deleted. Restore the vendor first.",
      "RESTORE_BLOCKED_PARENT_DELETED"
    );
  }
};

// Strict Restore Mode: Validate Critical Dependencies
ProjectTask.validateCriticalDependencies = async function (
  doc,
  { session } = {}
) {
  // No other critical dependencies for ProjectTask beyond parents
};

// Strict Restore Mode: Non-blocking Repairs
/**
 * CRITICAL: Per docs/validate-correct.md
 * Prune deleted users from watchers array
 */
ProjectTask.repairOnRestore = async function (doc, { session } = {}) {
  // Call BaseTask repairOnRestore for watchers
  await BaseTask.repairOnRestore(doc, { session });
};

export default ProjectTask;
