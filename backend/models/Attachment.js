import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import softDeletePlugin from "./plugins/softDelete.js";
import { dateTransform, convertDatesToUTC } from "../utils/helpers.js";
import { TTL, ATTACHMENT_TYPES, FILE_SIZE_LIMITS } from "../utils/constants.js";
import CustomError from "../errorHandler/CustomError.js";

const attachmentSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: [true, "Filename is required"],
      trim: true,
    },
    fileUrl: {
      type: String,
      required: [true, "File URL is required"],
      trim: true,
    },
    publicId: {
      type: String,
      trim: true,
    },
    fileType: {
      type: String,
      required: [true, "File type is required"],
      enum: {
        values: Object.values(ATTACHMENT_TYPES),
        message: "{VALUE} is not a valid file type",
      },
    },
    fileSize: {
      type: Number,
      required: [true, "File size is required"],
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
        message: "{VALUE} is not a valid parent model",
      },
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Uploaded by is required"],
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
attachmentSchema.index({ parent: 1, createdAt: -1 });
attachmentSchema.index({ organization: 1, department: 1, createdAt: -1 });
attachmentSchema.index({ isDeleted: 1 });
attachmentSchema.index({ deletedAt: 1 });

// Pre-save hook for date conversion and file size validation
attachmentSchema.pre("save", function (next) {
  // Validate file size based on type
  let maxSize;
  switch (this.fileType) {
    case ATTACHMENT_TYPES.IMAGE:
      maxSize = FILE_SIZE_LIMITS.IMAGE;
      break;
    case ATTACHMENT_TYPES.VIDEO:
      maxSize = FILE_SIZE_LIMITS.VIDEO;
      break;
    case ATTACHMENT_TYPES.DOCUMENT:
      maxSize = FILE_SIZE_LIMITS.DOCUMENT;
      break;
    case ATTACHMENT_TYPES.AUDIO:
      maxSize = FILE_SIZE_LIMITS.AUDIO;
      break;
    case ATTACHMENT_TYPES.OTHER:
      maxSize = FILE_SIZE_LIMITS.OTHER;
      break;
    default:
      maxSize = FILE_SIZE_LIMITS.OTHER;
  }

  if (this.fileSize > maxSize) {
    return next(
      CustomError.validation(
        `File size exceeds maximum allowed for ${this.fileType} (${maxSize} bytes)`
      )
    );
  }

  convertDatesToUTC(this, []);
  next();
});

// Strict Restore Mode: Check parent integrity
/**
 * CRITICAL: Per docs/validate-correct.md
 * Attachment must check entire parent chain:
 * - Organization
 * - Department
 * - Entire parent chain (attachment → parent → ... → task)
 */
attachmentSchema.statics.strictParentCheck = async function (
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
      "Cannot restore attachment because its organization is deleted. Restore the organization first.",
      "RESTORE_BLOCKED_PARENT_DELETED"
    );
  }

  // Check Department
  const dept = await Department.findById(doc.department)
    .withDeleted()
    .session(session);
  if (!dept || dept.isDeleted) {
    throw CustomError.validation(
      "Cannot restore attachment because its department is deleted. Restore the department first.",
      "RESTORE_BLOCKED_PARENT_DELETED"
    );
  }

  // Traverse entire parent chain to root task
  const visitedIds = new Set();
  let currentParentId = doc.parent;
  let currentParentModel = doc.parentModel;
  let depth = 0;
  const MAX_DEPTH = 10; // Safety limit

  while (depth < MAX_DEPTH) {
    // Check for cycles
    const parentKey = `${currentParentModel}:${currentParentId}`;
    if (visitedIds.has(parentKey)) {
      throw CustomError.validation(
        "Cannot restore attachment: Cycle detected in parent chain.",
        "ATTACHMENT_PARENT_CHAIN_INVALID"
      );
    }
    visitedIds.add(parentKey);

    const ParentModel = mongoose.model(currentParentModel);
    const parent = await ParentModel.findById(currentParentId)
      .withDeleted()
      .session(session);

    if (!parent) {
      throw CustomError.validation(
        `Cannot restore attachment because its parent ${currentParentModel} no longer exists.`,
        "RESTORE_BLOCKED_PARENT_DELETED"
      );
    }

    if (parent.isDeleted) {
      throw CustomError.validation(
        `Cannot restore attachment because its parent ${currentParentModel} is deleted. Restore the parent first.`,
        "RESTORE_BLOCKED_PARENT_DELETED"
      );
    }

    // Continue traversing based on parent type
    if (currentParentModel === "TaskComment") {
      currentParentId = parent.parent;
      currentParentModel = parent.parentModel;
      depth++;
    } else if (currentParentModel === "TaskActivity") {
      currentParentId = parent.parent;
      currentParentModel = parent.parentModel;
      depth++;
    } else {
      // Reached root (BaseTask)
      break;
    }
  }

  if (depth >= MAX_DEPTH) {
    throw CustomError.validation(
      "Cannot restore attachment: Parent chain exceeds maximum depth.",
      "ATTACHMENT_PARENT_CHAIN_INVALID"
    );
  }
};

// Strict Restore Mode: Non-blocking Repairs
/**
 * CRITICAL: Per docs/validate-correct.md
 * If organization/department mismatches parent, align to parent's scope
 */
attachmentSchema.statics.repairOnRestore = async function (
  doc,
  { session } = {}
) {
  const ParentModel = mongoose.model(doc.parentModel);
  const parent = await ParentModel.findById(doc.parent)
    .withDeleted()
    .session(session);

  if (parent) {
    // Align organization and department with parent
    if (
      parent.organization &&
      doc.organization.toString() !== parent.organization.toString()
    ) {
      doc.organization = parent.organization;
    }
    if (
      parent.department &&
      doc.department.toString() !== parent.department.toString()
    ) {
      doc.department = parent.department;
    }
  }
};

// Apply plugins
attachmentSchema.plugin(mongoosePaginate);
attachmentSchema.plugin(softDeletePlugin);

// TTL Index Configuration
// NOTE: TTL indexes are now initialized centrally in app.js after MongoDB connection
// See app.js -> ensureTTLIndexes() function
const Attachment = mongoose.model("Attachment", attachmentSchema);

export default Attachment;
