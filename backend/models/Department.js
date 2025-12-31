import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import softDeletePlugin from "./plugins/softDelete.js";
import { dateTransform, convertDatesToUTC } from "../utils/helpers.js";
import { TTL, LIMITS } from "../utils/constants.js";
import CustomError from "../errorHandler/CustomError.js";

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Department name is required"],
      trim: true,
      maxlength: [
        LIMITS.DEPARTMENT_NAME_MAX,
        `Department name cannot exceed ${LIMITS.DEPARTMENT_NAME_MAX} characters`,
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
    hod: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization reference is required"],
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
departmentSchema.index(
  { organization: 1, name: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
departmentSchema.index({ organization: 1 });
departmentSchema.index({ isDeleted: 1 });
departmentSchema.index({ deletedAt: 1 });

// Pre-save hook for date conversion
departmentSchema.pre("save", function (next) {
  convertDatesToUTC(this, []);
  next();
});

// Cascade delete static method
departmentSchema.statics.cascadeDelete = async function (
  departmentId,
  deletedBy,
  { session } = {}
) {
  // Get all models directly from mongoose
  const User = mongoose.model("User");
  const Material = mongoose.model("Material");
  const BaseTask = mongoose.model("BaseTask");

  // Soft delete all users in this department
  const users = await User.find({ department: departmentId })
    .withDeleted()
    .session(session);
  for (const user of users) {
    if (!user.isDeleted) {
      await user.softDelete(deletedBy, { session });
      // Cascade delete user children
      await User.cascadeDelete(user._id, deletedBy, { session });
    } else {
      // Idempotent traverse: still cascade to subtree
      await User.cascadeDelete(user._id, deletedBy, { session });
    }
  }

  // Soft delete all tasks in this department
  const tasks = await BaseTask.find({ department: departmentId })
    .withDeleted()
    .session(session);
  for (const task of tasks) {
    if (!task.isDeleted) {
      await task.softDelete(deletedBy, { session });
      // Cascade delete task children
      await BaseTask.cascadeDelete(task._id, deletedBy, { session });
    } else {
      // Idempotent traverse
      await BaseTask.cascadeDelete(task._id, deletedBy, { session });
    }
  }

  // Soft delete all materials in this department
  const materials = await Material.find({ department: departmentId })
    .withDeleted()
    .session(session);
  for (const material of materials) {
    if (!material.isDeleted) {
      await material.softDelete(deletedBy, { session });
    }
  }
};

// Strict Restore Mode: Check parent integrity
departmentSchema.statics.strictParentCheck = async function (
  doc,
  { session } = {}
) {
  const Organization = mongoose.model("Organization");
  const org = await Organization.findById(doc.organization)
    .withDeleted()
    .session(session);

  if (!org || org.isDeleted) {
    throw CustomError.validation(
      "Cannot restore department because its organization is deleted. Restore the organization first.",
      "RESTORE_BLOCKED_PARENT_DELETED"
    );
  }
};

// Strict Restore Mode: Non-blocking Repairs
departmentSchema.statics.repairOnRestore = async function (
  doc,
  { session } = {}
) {
  if (doc.hod) {
    const User = mongoose.model("User");
    const hod = await User.findById(doc.hod).withDeleted().session(session);

    // If HOD is deleted or missing or from different org, prune
    if (
      !hod ||
      hod.isDeleted ||
      hod.organization.toString() !== doc.organization.toString()
    ) {
      doc.hod = null;
      // Note: doc.save() is called by the plugin after restore() finishes
    }
  }
};

// Apply plugins
departmentSchema.plugin(mongoosePaginate);
departmentSchema.plugin(softDeletePlugin);

// TTL Index Configuration
// NOTE: TTL indexes are now initialized centrally in app.js after MongoDB connection
// See app.js -> ensureTTLIndexes() function
const Department = mongoose.model("Department", departmentSchema);

export default Department;
