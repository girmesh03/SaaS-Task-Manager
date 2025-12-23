import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { dateTransform, convertDatesToUTC } from "../utils/helpers.js";
import { TTL, NOTIFICATION_TYPES } from "../utils/constants.js";

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
      index: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Recipient is required"],
      index: true,
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
      index: true,
    },
    expiresAt: {
      type: Date,
      default: function () {
        return new Date(Date.now() + TTL.NOTIFICATION * 1000);
      },
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
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ organization: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index based on expiresAt field

// Pre-save hook for date conversion
notificationSchema.pre("save", function (next) {
  convertDatesToUTC(this, ["expiresAt"]);
  next();
});

// Apply plugins (no soft delete for notifications - they expire via TTL)
notificationSchema.plugin(mongoosePaginate);

// Note: Notifications do NOT use soft delete plugin
// They are automatically hard-deleted via TTL index based on expiresAt field

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
