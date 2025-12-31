import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import softDeletePlugin from "./plugins/softDelete.js";
import { dateTransform, convertDatesToUTC } from "../utils/helpers.js";
import { TTL, LIMITS, TASK_TYPES } from "../utils/constants.js";
import CustomError from "../errorHandler/CustomError.js";

const taskActivitySchema = new mongoose.Schema(
  {
    activity: {
      type: String,
      required: [true, "Activity is required"],
      trim: true,
      maxlength: [
        LIMITS.ACTIVITY_MAX,
        `Activity cannot exceed ${LIMITS.ACTIVITY_MAX} characters`,
      ],
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "parentModel",
      required: [true, "Parent task is required"],
    },
    parentModel: {
      type: String,
      required: [true, "Parent model is required"],
      enum: {
        values: [TASK_TYPES.PROJECT_TASK, TASK_TYPES.ASSIGNED_TASK],
        message: "Parent must be ProjectTask or AssignedTask (NOT RoutineTask)",
      },
    },
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
            min: [LIMITS.QUANTITY_MIN, "Quantity cannot be negative"],
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
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Created by is required"],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Department is required"],
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization is required"],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: dateTransform,
    },
    toObject: {
      transform: dateTransform,
    },
  }
);

// Indexes
taskActivitySchema.index({ parent: 1, createdAt: -1 });
taskActivitySchema.index({ organization: 1, department: 1, createdAt: -1 });
taskActivitySchema.index({ isDeleted: 1 });
taskActivitySchema.index({ deletedAt: 1 });

// Pre-save hook for date conversion
taskActivitySchema.pre("save", function (next) {
  convertDatesToUTC(this, []);
  next();
});

// Pre-save hook to validate parent is ProjectTask or AssignedTask (NOT RoutineTask)
taskActivitySchema.pre("save", async function (next) {
  if (this.isNew || this.isModified("parent")) {
    const session = this.$session();

    try {
      // Get the parent task
      const BaseTask = mongoose.model("BaseTask");
      const parentTask = await BaseTask.findById(this.parent).session(session);

      if (!parentTask) {
        return next(CustomError.notFound("BaseTask", this.parent));
      }

      // Validate parent is NOT RoutineTask
      if (parentTask.taskType === TASK_TYPES.ROUTINE_TASK) {
        return next(
          CustomError.validation(
            "TaskActivity is not supported for RoutineTask. Use TaskComment for changes/updates/corrections."
          )
        );
      }

      // Validate parent is ProjectTask or AssignedTask
      if (
        parentTask.taskType !== TASK_TYPES.PROJECT_TASK &&
        parentTask.taskType !== TASK_TYPES.ASSIGNED_TASK
      ) {
        return next(
          CustomError.validation("Parent must be ProjectTask or AssignedTask")
        );
      }

      // Set parentModel based on parent's taskType
      this.parentModel = parentTask.taskType;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Cascade delete static method
taskActivitySchema.statics.cascadeDelete = async function (
  activityId,
  deletedBy,
  { session } = {}
) {
  // Get all models directly from mongoose
  const TaskComment = mongoose.model("TaskComment");
  const Attachment = mongoose.model("Attachment");

  // Soft delete all comments for this activity
  const comments = await TaskComment.find({
    parent: activityId,
    parentModel: "TaskActivity",
  })
    .withDeleted()
    .session(session);
  for (const comment of comments) {
    if (!comment.isDeleted) {
      await comment.softDelete(deletedBy, { session });
      // Cascade delete comment children
      await TaskComment.cascadeDelete(comment._id, deletedBy, { session });
    } else {
      // Idempotent traverse
      await TaskComment.cascadeDelete(comment._id, deletedBy, { session });
    }
  }

  // Soft delete all attachments for this activity
  const attachments = await Attachment.find({
    parent: activityId,
    parentModel: "TaskActivity",
  })
    .withDeleted()
    .session(session);
  for (const attachment of attachments) {
    if (!attachment.isDeleted) {
      await attachment.softDelete(deletedBy, { session });
    }
  }
};

// Strict Restore Mode: Check parent integrity
taskActivitySchema.statics.strictParentCheck = async function (
  doc,
  { session } = {}
) {
  const BaseTask = mongoose.model("BaseTask");
  const parent = await BaseTask.findById(doc.parent)
    .withDeleted()
    .session(session);

  if (!parent || parent.isDeleted) {
    throw CustomError.validation(
      "Cannot restore task activity because its parent task is deleted. Restore the task first.",
      "RESTORE_BLOCKED_PARENT_DELETED"
    );
  }
};

// Apply plugins
taskActivitySchema.plugin(mongoosePaginate);
taskActivitySchema.plugin(softDeletePlugin);

// TTL Index Configuration
// NOTE: TTL indexes are now initialized centrally in app.js after MongoDB connection
// See app.js -> ensureTTLIndexes() function
const TaskActivity = mongoose.model("TaskActivity", taskActivitySchema);

export default TaskActivity;
