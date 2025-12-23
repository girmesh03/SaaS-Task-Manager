import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import softDeletePlugin from "./plugins/softDelete.js";
import { dateTransform, convertDatesToUTC } from "../utils/helpers.js";
import { TTL, LIMITS } from "../utils/constants.js";

const taskCommentSchema = new mongoose.Schema(
  {
    comment: {
      type: String,
      required: [true, "Comment is required"],
      trim: true,
      maxlength: [
        LIMITS.COMMENT_MAX,
        `Comment cannot exceed ${LIMITS.COMMENT_MAX} characters`,
      ],
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "parentModel",
      required: [true, "Parent is required"],
      index: true,
    },
    parentModel: {
      type: String,
      required: [true, "Parent model is required"],
      enum: {
        values: ["Task", "TaskActivity", "TaskComment"],
        message: "{VALUE} is not a valid parent model",
      },
    },
    mentions: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      validate: {
        validator: function (v) {
          return v.length <= LIMITS.MAX_MENTIONS;
        },
        message: `Cannot have more than ${LIMITS.MAX_MENTIONS} mentions`,
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
taskCommentSchema.index({ parent: 1, createdAt: -1 });
taskCommentSchema.index({ organization: 1, department: 1, createdAt: -1 });
taskCommentSchema.index({ isDeleted: 1 });
taskCommentSchema.index({ deletedAt: 1 });

// Pre-save hook for date conversion
taskCommentSchema.pre("save", function (next) {
  convertDatesToUTC(this, []);
  next();
});

// Helper function to calculate comment depth
taskCommentSchema.statics.calculateDepth = async function (
  parentId,
  parentModel,
  { session } = {}
) {
  let depth = 0;
  let currentParent = parentId;
  let currentModel = parentModel;

  // Traverse up the parent chain
  while (currentModel === "TaskComment" && depth < LIMITS.MAX_COMMENT_DEPTH) {
    const TaskComment = this;
    const comment = await TaskComment.findById(currentParent).session(session);

    if (!comment) break;

    depth++;
    currentParent = comment.parent;
    currentModel = comment.parentModel;
  }

  return depth;
};

// Validation: max depth 3 levels
taskCommentSchema.pre("save", async function (next) {
  if (this.isNew && this.parentModel === "TaskComment") {
    const TaskComment = this.constructor;
    const depth = await TaskComment.calculateDepth(
      this.parent,
      this.parentModel
    );

    if (depth >= LIMITS.MAX_COMMENT_DEPTH) {
      return next(
        new Error(
          `Comment depth cannot exceed ${LIMITS.MAX_COMMENT_DEPTH} levels`
        )
      );
    }
  }
  next();
});

// Cascade delete static method (recursive for child comments)
taskCommentSchema.statics.cascadeDelete = async function (
  commentId,
  deletedBy,
  { session } = {}
) {
  // Get all models directly from mongoose
  const Attachment = mongoose.model("Attachment");

  // Soft delete all child comments (recursive)
  const childComments = await TaskComment.find({
    parent: commentId,
    parentModel: "TaskComment",
  }).session(session);
  for (const childComment of childComments) {
    if (!childComment.isDeleted) {
      await childComment.softDelete(deletedBy, { session });
      // Recursively cascade delete child comment's children
      await TaskComment.cascadeDelete(childComment._id, deletedBy, { session });
    }
  }

  // Soft delete all attachments for this comment
  const attachments = await Attachment.find({
    parent: commentId,
    parentModel: "TaskComment",
  }).session(session);
  for (const attachment of attachments) {
    if (!attachment.isDeleted) {
      await attachment.softDelete(deletedBy, { session });
    }
  }
};

// Apply plugins
taskCommentSchema.plugin(mongoosePaginate);
taskCommentSchema.plugin(softDeletePlugin);

// Configure TTL index (90 days)
const TaskComment = mongoose.model("TaskComment", taskCommentSchema);
TaskComment.ensureTTLIndex(TTL.TASK_COMMENT);

export default TaskComment;
