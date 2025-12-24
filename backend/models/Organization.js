import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import softDeletePlugin from "./plugins/softDelete.js";
import { dateTransform, convertDatesToUTC } from "../utils/helpers.js";
import { INDUSTRIES, TTL } from "../utils/constants.js";

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Organization name is required"],
      trim: true,
      lowercase: true,
      maxlength: [100, "Organization name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      maxlength: [50, "Email cannot exceed 50 characters"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    address: {
      type: String,
      trim: true,
      maxlength: [500, "Address cannot exceed 500 characters"],
    },
    industry: {
      type: String,
      enum: {
        values: Object.values(INDUSTRIES),
        message: "{VALUE} is not a valid industry",
      },
      maxlength: [100, "Industry cannot exceed 100 characters"],
    },
    logo: {
      url: {
        type: String,
        trim: true,
      },
      publicId: {
        type: String,
        trim: true,
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isPlatformOrg: {
      type: Boolean,
      default: false,
      immutable: true,
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
organizationSchema.index(
  { name: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
organizationSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
organizationSchema.index(
  { phone: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
organizationSchema.index({ isPlatformOrg: 1 });
organizationSchema.index({ isDeleted: 1 });
organizationSchema.index({ deletedAt: 1 });

// Pre-save hook for date conversion
organizationSchema.pre("save", function (next) {
  convertDatesToUTC(this, []);
  next();
});

// Cascade delete static method
organizationSchema.statics.cascadeDelete = async function (
  organizationId,
  deletedBy,
  { session } = {}
) {
  // Get all models directly from mongoose
  const Department = mongoose.model("Department");
  const User = mongoose.model("User");
  const Vendor = mongoose.model("Vendor");
  const Material = mongoose.model("Material");
  const Notification = mongoose.model("Notification");

  // Soft delete all departments
  const departments = await Department.find({
    organization: organizationId,
  }).session(session);
  for (const dept of departments) {
    if (!dept.isDeleted) {
      await dept.softDelete(deletedBy, { session });
      // Cascade delete department children
      await Department.cascadeDelete(dept._id, deletedBy, { session });
    }
  }

  // Soft delete all users
  const users = await User.find({ organization: organizationId }).session(
    session
  );
  for (const user of users) {
    if (!user.isDeleted) {
      await user.softDelete(deletedBy, { session });
      // Cascade delete user children
      await User.cascadeDelete(user._id, deletedBy, { session });
    }
  }

  // Soft delete all vendors
  const vendors = await Vendor.find({ organization: organizationId }).session(
    session
  );
  for (const vendor of vendors) {
    if (!vendor.isDeleted) {
      await vendor.softDelete(deletedBy, { session });
    }
  }

  // Soft delete all materials
  const materials = await Material.find({
    organization: organizationId,
  }).session(session);
  for (const material of materials) {
    if (!material.isDeleted) {
      await material.softDelete(deletedBy, { session });
    }
  }

  // Soft delete all notifications
  const notifications = await Notification.find({
    organization: organizationId,
  }).session(session);
  for (const notification of notifications) {
    if (!notification.isDeleted) {
      await notification.softDelete(deletedBy, { session });
    }
  }

  // Note: Tasks are handled via Department cascade
};

// Apply plugins
organizationSchema.plugin(mongoosePaginate);
organizationSchema.plugin(softDeletePlugin);

// Configure TTL index (never expires)
const Organization = mongoose.model("Organization", organizationSchema);
Organization.ensureTTLIndex(TTL.ORGANIZATION);

export default Organization;
