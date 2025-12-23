import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import softDeletePlugin from "./plugins/softDelete.js";
import { dateTransform, convertDatesToUTC } from "../utils/helpers.js";
import { TTL, LIMITS, PHONE_REGEX } from "../utils/constants.js";

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
    },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          if (!v) return true; // Optional field
          return PHONE_REGEX.test(v);
        },
        message:
          "Phone number must match Ethiopian format (+251XXXXXXXXX or 0XXXXXXXXX)",
      },
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
      index: true,
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

// Apply plugins
vendorSchema.plugin(mongoosePaginate);
vendorSchema.plugin(softDeletePlugin);

// Configure TTL index (180 days)
const Vendor = mongoose.model("Vendor", vendorSchema);
Vendor.ensureTTLIndex(TTL.VENDOR);

export default Vendor;
