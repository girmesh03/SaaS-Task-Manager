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
attachmentSchema.statics.strictParentCheck = async function (
  doc,
  { session } = {}
) {
  const ParentModel = mongoose.model(doc.parentModel);
  const parent = await ParentModel.findById(doc.parent)
    .withDeleted()
    .session(session);

  if (!parent || parent.isDeleted) {
    throw CustomError.validation(
      `Cannot restore attachment because its parent ${doc.parentModel} is deleted. Restore the parent first.`,
      "RESTORE_BLOCKED_PARENT_DELETED"
    );
  }
};

// Apply plugins
attachmentSchema.plugin(mongoosePaginate);
attachmentSchema.plugin(softDeletePlugin);

// Configure TTL index (90 days)
const Attachment = mongoose.model("Attachment", attachmentSchema);
Attachment.ensureTTLIndex(TTL.ATTACHMENT);

export default Attachment;
