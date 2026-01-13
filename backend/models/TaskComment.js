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
    likes: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
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
      virtuals: true,
      transform: dateTransform,
    },
    toObject: {
      virtuals: true,
      transform: dateTransform,
    },
  }
);

// Virtual for like count
taskCommentSchema.virtual("likeCount").get(function () {
  return this.likes?.length || 0;
});

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
/**
 * Cascade soft delete to all comment children
 *
 * CRITICAL: Follows deletion order from docs/softDelete-doc.md
 * CRITICAL: Idempotent - traverses already-deleted children's subtrees
 * CRITICAL: softDelete() method already calls cascadeDelete() internally,
 *           so we only call cascadeDelete() for already-deleted nodes to traverse subtrees
 *
 * Cascade Order:
 * 1. Child comments (recursive)
 * 2. Attachments (leaf nodes)
 *
 * @param {ObjectId} commentId - Comment ID to cascade delete
 * @param {ObjectId} deletedBy - User ID performing the deletion
 * @param {Object} options - Options object
 * @param {ClientSession} options.session - MongoDB transaction session
 */
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
      // softDelete() will call TaskComment.cascadeDelete() internally
      await childComment.softDelete(deletedBy, { session });
    } else {
      // Idempotent traverse: still cascade to subtree for already-deleted nodes
      await TaskComment.cascadeDelete(childComment._id, deletedBy, { session });
    }
  }

  // Soft delete all attachments for this comment (leaf nodes - no cascade needed)
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
/**
 * CRITICAL: Per docs/validate-correct.md
 * TaskComment must check entire parent chain up to root task/activity:
 * - Organization
 * - Department
 * - Entire parent chain (comment → parent comment → ... → task/activity)
 * - createdBy user
 * - No cycles in parent chain
 */
taskCommentSchema.statics.strictParentCheck = async function (
  doc,
  { session } = {}
) {
  const Organization = mongoose.model("Organization");
  const Department = mongoose.model("Department");
  const User = mongoose.model("User");
  const TaskComment = mongoose.model("TaskComment");

  // Check Organization
  const org = await Organization.findById(doc.organization)
    .withDeleted()
    .session(session);
  if (!org || org.isDeleted) {
    throw CustomError.validation(
      "Cannot restore comment because its organization is deleted. Restore the organization first.",
      "RESTORE_BLOCKED_PARENT_DELETED"
    );
  }

  // Check Department
  const dept = await Department.findById(doc.department)
    .withDeleted()
    .session(session);
  if (!dept || dept.isDeleted) {
    throw CustomError.validation(
      "Cannot restore comment because its department is deleted. Restore the department first.",
      "RESTORE_BLOCKED_PARENT_DELETED"
    );
  }

  // Check createdBy user
  const creator = await User.findById(doc.createdBy)
    .withDeleted()
    .session(session);
  if (!creator || creator.isDeleted) {
    throw CustomError.validation(
      "Cannot restore comment because its creator is deleted. Restore the user first.",
      "RESTORE_BLOCKED_PARENT_DELETED"
    );
  }

  // Traverse entire parent chain to root (task or activity)
  // Also check for cycles
  const visitedIds = new Set();
  let currentParentId = doc.parent;
  let currentParentModel = doc.parentModel;
  let depth = 0;
  const MAX_DEPTH = 10; // Safety limit to prevent infinite loops

  while (depth < MAX_DEPTH) {
    // Check for cycles
    const parentKey = `${currentParentModel}:${currentParentId}`;
    if (visitedIds.has(parentKey)) {
      throw CustomError.validation(
        "Cannot restore comment: Cycle detected in parent chain.",
        "COMMENT_PARENT_CHAIN_INVALID"
      );
    }
    visitedIds.add(parentKey);

    const ParentModel = mongoose.model(currentParentModel);
    const parent = await ParentModel.findById(currentParentId)
      .withDeleted()
      .session(session);

    if (!parent) {
      throw CustomError.validation(
        `Cannot restore comment because its parent ${currentParentModel} no longer exists.`,
        "RESTORE_BLOCKED_PARENT_DELETED"
      );
    }

    if (parent.isDeleted) {
      throw CustomError.validation(
        `Cannot restore comment because its parent ${currentParentModel} is deleted. Restore the parent first.`,
        "RESTORE_BLOCKED_PARENT_DELETED"
      );
    }

    // If parent is a comment, continue traversing up
    if (currentParentModel === "TaskComment") {
      currentParentId = parent.parent;
      currentParentModel = parent.parentModel;
      depth++;
    } else {
      // Reached root (BaseTask or TaskActivity)
      break;
    }
  }

  if (depth >= MAX_DEPTH) {
    throw CustomError.validation(
      "Cannot restore comment: Parent chain exceeds maximum depth.",
      "COMMENT_PARENT_CHAIN_INVALID"
    );
  }
};

// Strict Restore Mode: Non-blocking Repairs
/**
 * CRITICAL: Per docs/validate-correct.md
 * Prune deleted users from mentions array
 */
taskCommentSchema.statics.repairOnRestore = async function (
  doc,
  { session } = {}
) {
  if (doc.mentions && doc.mentions.length > 0) {
    const User = mongoose.model("User");
    const validUsers = await User.find({
      _id: { $in: doc.mentions },
      isDeleted: false,
    })
      .session(session)
      .select("_id")
      .lean();

    doc.mentions = validUsers.map((u) => u._id);
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
