import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import softDeletePlugin from "./plugins/softDelete.js";
import { dateTransform, convertDatesToUTC } from "../utils/helpers.js";
import { INDUSTRIES, TTL, LIMITS, PHONE_REGEX } from "../utils/constants.js";

/**
 * Organization Schema
 *
 * SOFT DELETE POLICY (per docs/softDelete-doc.md):
 * - Parents: None (root entity)
 * - Owned Children: Department, User, Vendor, Material, Notification, Tasks (via Department)
 * - Weak Refs: None
 * - Critical Dependencies: None
 * - Restore Prerequisites: None (root entity)
 * - Deletion Cascade Policy: Cascades to ALL children (Departments → Users → Tasks → Activities → Comments → Attachments, Materials, Vendors, Notifications)
 * - Deletion Order: Organization → Department → User → Tasks → Activities → Comments → Attachments → Materials → Vendors → Notifications
 * - Restore Policy: Top-down only, children NOT auto-restored
 * - TTL: Never expires (null)
 * - Special Protection: Platform organization (isPlatformOrg: true) CANNOT be deleted
 */

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Organization name is required"],
      trim: true,
      lowercase: true,
      maxlength: [
        LIMITS.ORGANIZATION_NAME_MAX,
        `Organization name cannot exceed ${LIMITS.ORGANIZATION_NAME_MAX} characters`,
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
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      maxlength: [
        LIMITS.EMAIL_MAX,
        `Email cannot exceed ${LIMITS.EMAIL_MAX} characters`,
      ],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
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
    industry: {
      type: String,
      enum: {
        values: Object.values(INDUSTRIES),
        message: "{VALUE} is not a valid industry",
      },
      maxlength: [
        LIMITS.INDUSTRY_MAX,
        `Industry cannot exceed ${LIMITS.INDUSTRY_MAX} characters`,
      ],
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
/**
 * Cascade soft delete to all organization children
 *
 * CRITICAL: Follows deletion order from docs/softDelete-doc.md
 * CRITICAL: Idempotent - checks isDeleted before calling softDelete
 * CRITICAL: Uses organization scoping for all queries
 * CRITICAL: Executes within transaction session
 *
 * Cascade Order:
 * 1. Departments (which cascade to Users, Tasks, Materials)
 * 2. Users (which cascade to created Tasks, Activities, Comments, Attachments)
 * 3. Vendors (leaf nodes)
 * 4. Materials (leaf nodes)
 * 5. Notifications (leaf nodes)
 *
 * @param {ObjectId} organizationId - Organization ID to cascade delete
 * @param {ObjectId} deletedBy - User ID performing the deletion
 * @param {Object} options - Options object
 * @param {ClientSession} options.session - MongoDB transaction session
 */
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

  // CRITICAL: Use withDeleted() to enumerate ALL children (including already deleted)
  // This ensures idempotent cascade and proper handling of partially deleted hierarchies

  // Soft delete all departments
  const departments = await Department.find({
    organization: organizationId,
  })
    .withDeleted()
    .session(session);
  for (const dept of departments) {
    if (!dept.isDeleted) {
      await dept.softDelete(deletedBy, { session });
      // Cascade delete department children
      await Department.cascadeDelete(dept._id, deletedBy, { session });
    }
  }

  // Soft delete all users
  const users = await User.find({ organization: organizationId })
    .withDeleted()
    .session(session);
  for (const user of users) {
    if (!user.isDeleted) {
      await user.softDelete(deletedBy, { session });
      // Cascade delete user children
      await User.cascadeDelete(user._id, deletedBy, { session });
    }
  }

  // Soft delete all vendors
  const vendors = await Vendor.find({ organization: organizationId })
    .withDeleted()
    .session(session);
  for (const vendor of vendors) {
    if (!vendor.isDeleted) {
      await vendor.softDelete(deletedBy, { session });
    }
  }

  // Soft delete all materials
  const materials = await Material.find({
    organization: organizationId,
  })
    .withDeleted()
    .session(session);
  for (const material of materials) {
    if (!material.isDeleted) {
      await material.softDelete(deletedBy, { session });
    }
  }

  // Soft delete all notifications
  const notifications = await Notification.find({
    organization: organizationId,
  })
    .withDeleted()
    .session(session);
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
