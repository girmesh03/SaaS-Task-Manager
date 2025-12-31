import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import softDeletePlugin from "./plugins/softDelete.js";
import { NOTIFICATION_TYPES, TTL } from "../utils/constants.js";
import { dateTransform, convertDatesToUTC } from "../utils/helpers.js";
import CustomError from "../errorHandler/CustomError.js";


const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
    },
    type: {
      type: String,
      required: [true, "Type is required"],
      enum: {
        values: Object.values(NOTIFICATION_TYPES),
        message: "{VALUE} is not a valid notification type",
      },
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Recipient is required"],
    },
    entity: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "entityModel",
    },
    entityModel: {
      type: String,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization is required"],
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + TTL.NOTIFICATION * 1000),
      index: { expires: 0 }, // Individual document expiry
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
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ organization: 1, createdAt: -1 });
notificationSchema.index({ isDeleted: 1 });
notificationSchema.index({ deletedAt: 1 });

// Pre-save hook for date conversion
notificationSchema.pre("save", function (next) {
  convertDatesToUTC(this, []);
  next();
});

// Strict Restore Mode: Check parent integrity
notificationSchema.statics.strictParentCheck = async function (
  doc,
  { session } = {}
) {
  const Organization = mongoose.model("Organization");
  const User = mongoose.model("User");

  // Check Organization
  const org = await Organization.findById(doc.organization)
    .withDeleted()
    .session(session);
  if (!org || org.isDeleted) {
    throw CustomError.validation(
      "Cannot restore notification because its organization is deleted. Restore the organization first.",
      "RESTORE_BLOCKED_PARENT_DELETED"
    );
  }

  // Check Recipient
  const recipient = await User.findById(doc.recipient)
    .withDeleted()
    .session(session);
  if (!recipient || recipient.isDeleted) {
    throw CustomError.validation(
      "Cannot restore notification because its recipient is deleted. Restore the recipient first.",
      "RESTORE_BLOCKED_PARENT_DELETED"
    );
  }
};

// Apply plugins
notificationSchema.plugin(mongoosePaginate);
notificationSchema.plugin(softDeletePlugin);

// TTL Index Configuration
// NOTE: TTL indexes are now initialized centrally in app.js after MongoDB connection
// See app.js -> ensureTTLIndexes() function
const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
