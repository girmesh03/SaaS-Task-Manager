import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import softDeletePlugin from "./plugins/softDelete.js";
import { dateTransform, convertDatesToUTC } from "../utils/helpers.js";
import {
  TTL,
  LIMITS,
  TASK_STATUS,
  TASK_PRIORITY,
  TASK_TYPES,
} from "../utils/constants.js";
import CustomError from "../errorHandler/CustomError.js";

const baseTaskSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [
        LIMITS.DESCRIPTION_MAX,
        `Description cannot exceed ${LIMITS.DESCRIPTION_MAX} characters`,
      ],
    },
    status: {
      type: String,
      enum: {
        values: Object.values(TASK_STATUS),
        message: "{VALUE} is not a valid status",
      },
      default: TASK_STATUS.TO_DO,
    },
    priority: {
      type: String,
      enum: {
        values: Object.values(TASK_PRIORITY),
        message: "{VALUE} is not a valid priority",
      },
      default: TASK_PRIORITY.MEDIUM,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization is required"],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Department is required"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Created by is required"],
    },
    attachments: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Attachment",
        },
      ],
      validate: {
        validator: function (v) {
          return v.length <= LIMITS.MAX_ATTACHMENTS;
        },
        message: `Cannot have more than ${LIMITS.MAX_ATTACHMENTS} attachments`,
      },
      default: [],
    },
    watchers: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      validate: {
        validator: function (v) {
          return v.length <= LIMITS.MAX_WATCHERS;
        },
        message: `Cannot have more than ${LIMITS.MAX_WATCHERS} watchers`,
      },
      default: [],
    },
    tags: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: [
            LIMITS.TAG_MAX,
            `Tag cannot exceed ${LIMITS.TAG_MAX} characters`,
          ],
        },
      ],
      validate: {
        validator: function (v) {
          return v.length <= LIMITS.MAX_TAGS;
        },
        message: `Cannot have more than ${LIMITS.MAX_TAGS} tags`,
      },
      default: [],
    },
    taskType: {
      type: String,
      required: true,
      enum: {
        values: Object.values(TASK_TYPES),
        message: "{VALUE} is not a valid task type",
      },
    },
  },
  {
    discriminatorKey: "taskType",
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
baseTaskSchema.index({ organization: 1, department: 1, createdAt: -1 });
baseTaskSchema.index({ organization: 1, createdBy: 1, createdAt: -1 });
baseTaskSchema.index({
  organization: 1,
  department: 1,
  status: 1,
  priority: 1,
  dueDate: 1,
});
baseTaskSchema.index({ tags: "text" });
baseTaskSchema.index({ isDeleted: 1 });
baseTaskSchema.index({ deletedAt: 1 });

// Pre-save hook for date conversion
baseTaskSchema.pre("save", function (next) {
  // Convert dates to UTC (startDate and dueDate will be added by discriminators)
  const dateFields = [];
  if (this.startDate) dateFields.push("startDate");
  if (this.dueDate) dateFields.push("dueDate");

  convertDatesToUTC(this, dateFields);
  next();
});

// Cascade delete static method
// Cascade delete static method
baseTaskSchema.statics.cascadeDelete = async function (
  taskId,
  deletedBy,
  { session } = {}
) {
  // Get all models directly from mongoose
  const TaskActivity = mongoose.model("TaskActivity");
  const TaskComment = mongoose.model("TaskComment");
  const Attachment = mongoose.model("Attachment");
  const Notification = mongoose.model("Notification");

  // Soft delete all activities for this task
  const activities = await TaskActivity.find({ parent: taskId })
    .withDeleted()
    .session(session);
  for (const activity of activities) {
    if (!activity.isDeleted) {
      await activity.softDelete(deletedBy, { session });
      // Cascade delete activity children
      await TaskActivity.cascadeDelete(activity._id, deletedBy, { session });
    } else {
      // Idempotent traverse
      await TaskActivity.cascadeDelete(activity._id, deletedBy, { session });
    }
  }

  // Soft delete all comments for this task
  const comments = await TaskComment.find({
    parent: taskId,
    parentModel: "BaseTask",
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

  // Soft delete all attachments for this task
  const attachments = await Attachment.find({
    parent: taskId,
    parentModel: "BaseTask",
  })
    .withDeleted()
    .session(session);
  for (const attachment of attachments) {
    if (!attachment.isDeleted) {
      await attachment.softDelete(deletedBy, { session });
    }
  }

  // Soft delete all notifications for this task
  const notifications = await Notification.find({
    entity: taskId,
    entityModel: "BaseTask",
  })
    .withDeleted()
    .session(session);
  for (const notification of notifications) {
    if (!notification.isDeleted) {
      await notification.softDelete(deletedBy, { session });
    }
  }
};

// Strict Restore Mode: Check parent integrity
baseTaskSchema.statics.strictParentCheck = async function (
  doc,
  { session } = {}
) {
  const Organization = mongoose.model("Organization");
  const Department = mongoose.model("Department");

  // Check Organization
  const org = await Organization.findById(doc.organization)
    .withDeleted()
    .session(session);
  if (!org || org.isDeleted) {
    throw CustomError.validation(
      "Cannot restore task because its organization is deleted. Restore the organization first.",
      "RESTORE_BLOCKED_PARENT_DELETED"
    );
  }

  // Check Department
  const dept = await Department.findById(doc.department)
    .withDeleted()
    .session(session);
  if (!dept || dept.isDeleted) {
    throw CustomError.validation(
      "Cannot restore task because its department is deleted. Restore the department first.",
      "RESTORE_BLOCKED_PARENT_DELETED"
    );
  }
};

// Strict Restore Mode: Non-blocking Repairs
baseTaskSchema.statics.repairOnRestore = async function (
  doc,
  { session } = {}
) {
  // Prune deleted watchers
  if (doc.watchers && doc.watchers.length > 0) {
    const User = mongoose.model("User");
    const validWatchers = await User.find({
      _id: { $in: doc.watchers },
      isDeleted: false,
    })
      .session(session)
      .select("_id")
      .lean();

    doc.watchers = validWatchers.map((u) => u._id);
  }
};


// Apply plugins
baseTaskSchema.plugin(mongoosePaginate);
baseTaskSchema.plugin(softDeletePlugin);

// Configure TTL index (180 days)
const BaseTask = mongoose.model("BaseTask", baseTaskSchema);
BaseTask.ensureTTLIndex(TTL.TASK);

export default BaseTask;
