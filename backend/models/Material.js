import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import softDeletePlugin from "./plugins/softDelete.js";
import { dateTransform, convertDatesToUTC } from "../utils/helpers.js";
import {
  TTL,
  LIMITS,
  MATERIAL_CATEGORIES,
  UNIT_TYPES,
} from "../utils/constants.js";

const materialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Material name is required"],
      trim: true,
      maxlength: [
        LIMITS.NAME_MAX,
        `Material name cannot exceed ${LIMITS.NAME_MAX} characters`,
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
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: Object.values(MATERIAL_CATEGORIES),
        message: "{VALUE} is not a valid category",
      },
    },
    unitType: {
      type: String,
      required: [true, "Unit type is required"],
      enum: {
        values: Object.values(UNIT_TYPES),
        message: "{VALUE} is not a valid unit type",
      },
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [LIMITS.PRICE_MIN, `Price must be at least ${LIMITS.PRICE_MIN}`],
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
    addedBy: {
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
materialSchema.index({ organization: 1, department: 1, name: 1 });
materialSchema.index({ category: 1 });
materialSchema.index({ isDeleted: 1 });
materialSchema.index({ deletedAt: 1 });

// Pre-save hook for date conversion
materialSchema.pre("save", function (next) {
  convertDatesToUTC(this, []);
  next();
});

// Apply plugins
materialSchema.plugin(mongoosePaginate);
materialSchema.plugin(softDeletePlugin);

// Configure TTL index (180 days)
const Material = mongoose.model("Material", materialSchema);
Material.ensureTTLIndex(TTL.MATERIAL);

export default Material;
