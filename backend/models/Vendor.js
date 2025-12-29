import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import softDeletePlugin from "./plugins/softDelete.js";
import { dateTransform, convertDatesToUTC } from "../utils/helpers.js";
import { TTL, LIMITS, PHONE_REGEX } from "../utils/constants.js";
import CustomError from "../errorHandler/CustomError.js";

const vendorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Vendor name is required"],
      trim: true,
      maxlength: [
        LIMITS.NAME_MAX,
        `Vendor name cannot exceed ${LIMITS.NAME_MAX} characters`,
      ],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [
        LIMITS.DESCRIPTION_MAX,
        `Description cannot exceed ${LIMITS.DESCRIPTION_MAX} characters`,
      ],
    },
    contactPerson: {
      type: String,
      trim: true,
      maxlength: [
        LIMITS.CONTACT_PERSON_MAX,
        `Contact person cannot exceed ${LIMITS.CONTACT_PERSON_MAX} characters`,
      ],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: [
        LIMITS.EMAIL_MAX,
        `Email cannot exceed ${LIMITS.EMAIL_MAX} characters`,
      ],
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
    },
    phone: {
      type: String,
      trim: true,
      match: [PHONE_REGEX, "Please provide a valid phone number"],
    },
    address: {
      type: String,
      trim: true,
      maxlength: [
        LIMITS.ADDRESS_MAX,
        `Address cannot exceed ${LIMITS.ADDRESS_MAX} characters`,
      ],
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization is required"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
vendorSchema.index({ organization: 1, name: 1 });
vendorSchema.index({ isDeleted: 1 });
vendorSchema.index({ deletedAt: 1 });

// Pre-save hook for date conversion
vendorSchema.pre("save", function (next) {
  convertDatesToUTC(this, []);
  next();
});

// Strict Restore Mode: Check parent integrity
vendorSchema.statics.strictParentCheck = async function (
  doc,
  { session } = {}
) {
  const Organization = mongoose.model("Organization");
  const org = await Organization.findById(doc.organization)
    .withDeleted()
    .session(session);

  if (!org || org.isDeleted) {
    throw CustomError.validation(
      "Cannot restore vendor because its organization is deleted. Restore the organization first.",
      "RESTORE_BLOCKED_PARENT_DELETED"
    );
  }
};

// Apply plugins
vendorSchema.plugin(mongoosePaginate);
vendorSchema.plugin(softDeletePlugin);

// Configure TTL index (180 days)
const Vendor = mongoose.model("Vendor", vendorSchema);
Vendor.ensureTTLIndex(TTL.VENDOR);

export default Vendor;
