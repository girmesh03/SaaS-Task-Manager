import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import softDeletePlugin from "./plugins/softDelete.js";
import { dateTransform, convertDatesToUTC } from "../utils/helpers.js";
import { TTL, LIMITS, TASK_TYPES } from "../utils/constants.js";

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
      index: true,
    },
    parentModel: {
      type: String,
      required: [true, "Parent model is required"],
      enum: {
        values: [TASK_TYPES.PROJECT_TASK, TASK_TYPES.ASSIGNED_TASK],
        message:
          "TaskActivity is only supported for ProjectTask and AssignedTask (NOT RoutineTask)",
      },
    },
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
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Created by is required"],
      index: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Department is required"],
      index: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization is required"],
      index: true,
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
  }).session(session);
  for (const comment of comments) {
    if (!comment.isDeleted) {
      await comment.softDelete(deletedBy, { session });
      // Cascade delete comment children
      await TaskComment.cascadeDelete(comment._id, deletedBy, { session });
    }
  }

  // Soft delete all attachments for this activity
  const attachments = await Attachment.find({
    parent: activityId,
    parentModel: "TaskActivity",
  }).session(session);
  for (const attachment of attachments) {
    if (!attachment.isDeleted) {
      await attachment.softDelete(deletedBy, { session });
    }
  }
};

// Apply plugins
taskActivitySchema.plugin(mongoosePaginate);
taskActivitySchema.plugin(softDeletePlugin);

// Configure TTL index (90 days)
const TaskActivity = mongoose.model("TaskActivity", taskActivitySchema);
TaskActivity.ensureTTLIndex(TTL.TASK_ACTIVITY);

export default TaskActivity;
