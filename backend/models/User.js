import mongoose from "mongoose";
import bcrypt from "bcrypt";
import mongoosePaginate from "mongoose-paginate-v2";
import softDeletePlugin from "./plugins/softDelete.js";
import { dateTransform, convertDatesToUTC } from "../utils/helpers.js";
import {
  USER_ROLES,
  BCRYPT,
  PASSWORD_RESET,
  TTL,
  LIMITS,
  EMAIL_PREFERENCES_DEFAULTS,
} from "../utils/constants.js";
import CustomError from "../errorHandler/CustomError.js";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: [
        LIMITS.FIRST_NAME_MAX,
        `First name cannot exceed ${LIMITS.FIRST_NAME_MAX} characters`,
      ],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: [
        LIMITS.LAST_NAME_MAX,
        `Last name cannot exceed ${LIMITS.LAST_NAME_MAX} characters`,
      ],
    },
    position: {
      type: String,
      trim: true,
      maxlength: [
        LIMITS.POSITION_MAX,
        `Position cannot exceed ${LIMITS.POSITION_MAX} characters`,
      ],
    },
    role: {
      type: String,
      enum: {
        values: Object.values(USER_ROLES),
        message: "{VALUE} is not a valid role",
      },
      default: USER_ROLES.USER,
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
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [
        LIMITS.PASSWORD_MIN,
        `Password must be at least ${LIMITS.PASSWORD_MIN} characters`,
      ],
      select: false,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization is required"],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Department is required"],
    },
    profilePicture: {
      url: {
        type: String,
        trim: true,
      },
      publicId: {
        type: String,
        trim: true,
      },
    },
    skills: {
      type: [
        {
          skill: {
            type: String,
            required: true,
            trim: true,
            maxlength: [
              LIMITS.SKILL_MAX,
              `Skill cannot exceed ${LIMITS.SKILL_MAX} characters`,
            ],
          },
          percentage: {
            type: Number,
            required: true,
            min: [
              LIMITS.SKILL_PERCENTAGE_MIN,
              `Percentage must be at least ${LIMITS.SKILL_PERCENTAGE_MIN}`,
            ],
            max: [
              LIMITS.SKILL_PERCENTAGE_MAX,
              `Percentage cannot exceed ${LIMITS.SKILL_PERCENTAGE_MAX}`,
            ],
          },
        },
      ],
      validate: {
        validator: function (v) {
          return v.length <= LIMITS.MAX_SKILLS;
        },
        message: `Cannot have more than ${LIMITS.MAX_SKILLS} skills`,
      },
    },
    employeeId: {
      type: String,
      required: false,
      trim: true,
      match: [
        /^(?!0000)\d{4}$/,
        "Employee ID must be a 4-digit number between 0001-9999",
      ],
    },
    dateOfBirth: {
      type: Date,
    },
    joinedAt: {
      type: Date,
      required: [true, "Joined date is required"],
    },
    emailPreferences: {
      enabled: {
        type: Boolean,
        default: EMAIL_PREFERENCES_DEFAULTS.enabled,
      },
      taskNotifications: {
        type: Boolean,
        default: EMAIL_PREFERENCES_DEFAULTS.taskNotifications,
      },
      taskReminders: {
        type: Boolean,
        default: EMAIL_PREFERENCES_DEFAULTS.taskReminders,
      },
      mentions: {
        type: Boolean,
        default: EMAIL_PREFERENCES_DEFAULTS.mentions,
      },
      announcements: {
        type: Boolean,
        default: EMAIL_PREFERENCES_DEFAULTS.announcements,
      },
      welcomeEmails: {
        type: Boolean,
        default: EMAIL_PREFERENCES_DEFAULTS.welcomeEmails,
      },
      passwordReset: {
        type: Boolean,
        default: EMAIL_PREFERENCES_DEFAULTS.passwordReset,
      },
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    isPlatformUser: {
      type: Boolean,
      default: false,
      immutable: true,
    },
    isHod: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
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

// Virtual for fullName
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Indexes
userSchema.index(
  { organization: 1, email: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
userSchema.index(
  { department: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false, isHod: true },
  }
);
userSchema.index(
  { organization: 1, employeeId: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
userSchema.index({ organization: 1 });
userSchema.index({ isPlatformUser: 1 });
userSchema.index({ isHod: 1 });
userSchema.index({ isDeleted: 1 });
userSchema.index({ deletedAt: 1 });

// Pre-save hook for password hashing, isHod auto-set, isPlatformUser auto-set, and date conversion
userSchema.pre("save", async function (next) {
  // Hash password if modified
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, BCRYPT.SALT_ROUNDS);
  }

  // Auto-set isPlatformUser based on organization
  if (this.isModified("organization") && this.organization) {
    const Organization = mongoose.model("Organization");
    const org = await Organization.findById(this.organization).lean();
    if (org) {
      this.isPlatformUser = org.isPlatformOrg;
    }
  }

  // Convert dates to UTC
  convertDatesToUTC(this, ["dateOfBirth", "joinedAt", "lastLogin"]);

  next();
});

// Instance method: comparePassword
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Instance method: generatePasswordResetToken
userSchema.methods.generatePasswordResetToken = async function () {
  const crypto = await import("crypto");
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Store SHA256 hashed token for deterministic look-up
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = new Date(
    Date.now() + PASSWORD_RESET.TOKEN_EXPIRES_IN
  );

  return resetToken; // Return unhashed token
};

// Instance method: verifyPasswordResetToken
userSchema.methods.verifyPasswordResetToken = async function (token) {
  if (!this.passwordResetToken || !this.passwordResetExpires) {
    return false;
  }

  // Check if token expired
  if (new Date() > this.passwordResetExpires) {
    return false;
  }

  // Compare deterministic hash
  const crypto = await import("crypto");
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  return hashedToken === this.passwordResetToken;
};

// Instance method: clearPasswordResetToken
userSchema.methods.clearPasswordResetToken = function () {
  this.passwordResetToken = undefined;
  this.passwordResetExpires = undefined;
};

// Static method: findByResetToken
userSchema.statics.findByResetToken = async function (token, { session } = {}) {
  const crypto = await import("crypto");
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  return await this.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  })
    .session(session)
    .select("+passwordResetToken +passwordResetExpires");
};

// Cascade delete static method
/**
 * Handle user deletion - PRUNE WEAK REFERENCES ONLY
 *
 * CRITICAL: Per docs/softDelete-doc.md and validate-correct.md:
 * "User deletion does NOT cascade delete any owned resources (tasks, activities, comments, attachments)"
 *
 * This method ONLY:
 * 1. Removes user from task watchers arrays
 * 2. Removes user from AssignedTask assignees arrays
 * 3. Removes user from TaskComment mentions arrays
 * 4. Soft deletes notifications for this user (ephemeral)
 *
 * It does NOT soft delete:
 * - Tasks created by this user (owned by department)
 * - Activities created by this user (owned by department)
 * - Comments created by this user (owned by department)
 * - Attachments uploaded by this user (owned by department)
 *
 * @param {ObjectId} userId - User ID being deleted
 * @param {ObjectId} deletedBy - User ID performing the deletion
 * @param {Object} options - Options object
 * @param {ClientSession} options.session - MongoDB transaction session
 */
userSchema.statics.cascadeDelete = async function (
  userId,
  deletedBy,
  { session } = {}
) {
  // Get all models directly from mongoose
  const BaseTask = mongoose.model("BaseTask");
  const AssignedTask = mongoose.model("AssignedTask");
  const TaskComment = mongoose.model("TaskComment");
  const Notification = mongoose.model("Notification");

  // PRUNE WEAK REFERENCES ONLY - Do NOT cascade delete owned resources

  // Remove user from task watchers
  await BaseTask.updateMany(
    { watchers: userId },
    { $pull: { watchers: userId } },
    { session }
  );

  // Remove user from AssignedTask assignees
  await AssignedTask.updateMany(
    { assignees: userId },
    { $pull: { assignees: userId } },
    { session }
  );

  // Remove user from TaskComment mentions
  await TaskComment.updateMany(
    { mentions: userId },
    { $pull: { mentions: userId } },
    { session }
  );

  // Soft delete notifications for this user (ephemeral - not restorable)
  const notifications = await Notification.find({
    recipient: userId,
  })
    .withDeleted()
    .session(session);
  for (const notification of notifications) {
    if (!notification.isDeleted) {
      await notification.softDelete(deletedBy, { session });
    }
  }
};

// Strict Restore Mode: Check parent integrity
userSchema.statics.strictParentCheck = async function (doc, { session } = {}) {
  const Organization = mongoose.model("Organization");
  const Department = mongoose.model("Department");

  // Check Organization
  const org = await Organization.findById(doc.organization)
    .withDeleted()
    .session(session);
  if (!org || org.isDeleted) {
    throw CustomError.validation(
      "Cannot restore user because its organization is deleted. Restore the organization first.",
      "RESTORE_BLOCKED_PARENT_DELETED"
    );
  }

  // Check Department
  const dept = await Department.findById(doc.department)
    .withDeleted()
    .session(session);
  if (!dept || dept.isDeleted) {
    throw CustomError.validation(
      "Cannot restore user because its department is deleted. Restore the department first.",
      "RESTORE_BLOCKED_PARENT_DELETED"
    );
  }
};

// Strict Restore Mode: Non-blocking Repairs
userSchema.statics.repairOnRestore = async function (doc, { session } = {}) {
  // Safety: Reset isHod status during restore.
  // Restoration should not automatically reclaim HOD status.
  doc.isHod = false;
  // Note: doc.save() is called by the plugin after restore() finishes
};

// Apply plugins
userSchema.plugin(mongoosePaginate);
userSchema.plugin(softDeletePlugin);

// TTL Index Configuration
// NOTE: TTL indexes are now initialized centrally in app.js after MongoDB connection
// See app.js -> ensureTTLIndexes() function
const User = mongoose.model("User", userSchema);

export default User;
