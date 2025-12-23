import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import softDeletePlugin from "./plugins/softDelete.js";
import { dateTransform, convertDatesToUTC } from "../utils/helpers.js";
import { TTL } from "../utils/constants.js";

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Department name is required"],
      trim: true,
      maxlength: [100, "Department name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    hod: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
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

  // Soft delete all users in this department
  const users = await User.find({ department: departmentId }).session(session);
  for (const user of users) {
    if (!user.isDeleted) {
      await user.softDelete(deletedBy, { session });
      // Cascade delete user children
      await User.cascadeDelete(user._id, deletedBy, { session });
    }
  }

  // Soft delete all materials in this department
  const materials = await Material.find({ department: departmentId }).session(
    session
  );
  for (const material of materials) {
    if (!material.isDeleted) {
      await material.softDelete(deletedBy, { session });
    }
  }

  // Note: Tasks are handled via User cascade
};

// Apply plugins
departmentSchema.plugin(mongoosePaginate);
departmentSchema.plugin(softDeletePlugin);

// Configure TTL index (365 days)
const Department = mongoose.model("Department", departmentSchema);
Department.ensureTTLIndex(TTL.DEPARTMENT);

export default Department;
