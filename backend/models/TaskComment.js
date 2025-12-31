import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import softDeletePlugin from "./plugins/softDelete.js";
import { dateTransform, convertDatesToUTC } from "../utils/helpers.js";
import { TTL, LIMITS } from "../utils/constants.js";
import CustomError from "../errorHandler/CustomError.js";

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
    },
    parentModel: {
      type: String,
      required: [true, "Parent model is required"],
      enum: {
        values: ["BaseTask", "TaskActivity", "TaskComment"],
        message: "Parent must be Task, TaskActivity, or TaskComment",
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
taskCommentSchema.index({ parent: 1, createdAt: -1 });
taskCommentSchema.index({ organization: 1, department: 1, createdAt: -1 });
taskCommentSchema.index({ isDeleted: 1 });
taskCommentSchema.index({ deletedAt: 1 });

// Pre-save hook for date conversion
taskCommentSchema.pre("save", function (next) {
  convertDatesToUTC(this, []);
  next();
});

// Pre-save hook to validate max depth 3 levels
taskCommentSchema.pre("save", async function (next) {
  if (this.isNew && this.parentModel === "TaskComment") {
    const session = this.$session();

    try {
      // Calculate depth by traversing parent chain
      let depth = 1;
      let currentParent = this.parent;
      let currentParentModel = this.parentModel;

      const TaskComment = mongoose.model("TaskComment");

      while (currentParentModel === "TaskComment" && depth < 4) {
        const parentComment = await TaskComment.findById(currentParent).session(
          session
        );

        if (!parentComment) {
          return next(CustomError.notFound("TaskComment", currentParent));
        }

        depth++;
        currentParent = parentComment.parent;
        currentParentModel = parentComment.parentModel;
      }

      // Check if depth exceeds 3
      if (depth > 3) {
        return next(
          CustomError.validation(
            "Comment depth cannot exceed 3 levels (comment → reply → reply to reply)"
          )
        );
      }
    } catch (error) {
      return next(error);
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
  const TaskComment = mongoose.model("TaskComment");
  const Attachment = mongoose.model("Attachment");

  // Soft delete all child comments recursively
  const childComments = await TaskComment.find({
    parent: commentId,
    parentModel: "TaskComment",
  })
    .withDeleted()
    .session(session);

  for (const childComment of childComments) {
    if (!childComment.isDeleted) {
      await childComment.softDelete(deletedBy, { session });
      // Recursively cascade delete child comment's children
      await TaskComment.cascadeDelete(childComment._id, deletedBy, { session });
    } else {
      // Idempotent traverse
      await TaskComment.cascadeDelete(childComment._id, deletedBy, { session });
    }
  }

  // Soft delete all attachments for this comment
  const attachments = await Attachment.find({
    parent: commentId,
    parentModel: "TaskComment",
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
taskCommentSchema.statics.strictParentCheck = async function (
  doc,
  { session } = {}
) {
  const ParentModel = mongoose.model(doc.parentModel);
  const parent = await ParentModel.findById(doc.parent)
    .withDeleted()
    .session(session);

  if (!parent || parent.isDeleted) {
    throw CustomError.validation(
      `Cannot restore comment because its parent ${doc.parentModel} is deleted. Restore the parent first.`,
      "RESTORE_BLOCKED_PARENT_DELETED"
    );
  }
};

// Apply plugins
taskCommentSchema.plugin(mongoosePaginate);
taskCommentSchema.plugin(softDeletePlugin);

// TTL Index Configuration
// NOTE: TTL indexes are now initialized centrally in app.js after MongoDB connection
// See app.js -> ensureTTLIndexes() function
const TaskComment = mongoose.model("TaskComment", taskCommentSchema);

export default TaskComment;
