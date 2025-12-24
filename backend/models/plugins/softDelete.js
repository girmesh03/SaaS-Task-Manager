import mongoose from "mongoose";
import logger from "../../utils/logger.js";

/**
 * Soft Delete Plugin for Mongoose
 *
 * CRITICAL: Universal dependency for ALL models
 *
 * Features:
 * - Automatic filtering of soft-deleted records
 * - Query helpers: withDeleted(), onlyDeleted()
 * - Instance methods: softDelete(deletedBy, {session}), restore(restoredBy, {session})
 * - Static methods: softDeleteById, softDeleteMany, restoreById, restoreMany, etc.
 * - Hard delete protection
 * - TTL index support
 */

const softDeletePlugin = (schema, options = {}) => {
  // Add soft delete fields
  schema.add({
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    restoredAt: {
      type: Date,
      default: null,
    },
    restoredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  });

  // Query helpers
  schema.query.withDeleted = function () {
    return this.setOptions({ withDeleted: true });
  };

  schema.query.onlyDeleted = function () {
    return this.where({ isDeleted: true });
  };

  // Automatic filtering middleware
  const excludeDeletedMiddleware = function (next) {
    if (!this.getOptions().withDeleted) {
      this.where({ isDeleted: false });
    }
    next();
  };

  schema.pre("find", excludeDeletedMiddleware);
  schema.pre("findOne", excludeDeletedMiddleware);
  schema.pre("findOneAndUpdate", excludeDeletedMiddleware);
  schema.pre("countDocuments", excludeDeletedMiddleware);
  schema.pre("count", excludeDeletedMiddleware);

  // Instance method: soft delete
  schema.methods.softDelete = async function (deletedBy, { session } = {}) {
    if (this.isDeleted) {
      // Already deleted, preserve original audit
      return this;
    }

    this.isDeleted = true;
    this.deletedAt = new Date();
    this.deletedBy = deletedBy;
    this.restoredAt = null;
    this.restoredBy = null;

    return await this.save({ session });
  };

  // Instance method: restore
  schema.methods.restore = async function (restoredBy, { session } = {}) {
    if (!this.isDeleted) {
      // Not deleted, nothing to restore
      return this;
    }

    this.isDeleted = false;
    this.restoredAt = new Date();
    this.restoredBy = restoredBy;
    this.deletedAt = null;
    this.deletedBy = null;

    return await this.save({ session });
  };

  // Static method: soft delete by ID
  schema.statics.softDeleteById = async function (
    id,
    deletedBy,
    { session } = {}
  ) {
    const doc = await this.findById(id).session(session);
    if (!doc) {
      throw new Error("Document not found");
    }
    return await doc.softDelete(deletedBy, { session });
  };

  // Static method: soft delete many
  schema.statics.softDeleteMany = async function (
    filter,
    deletedBy,
    { session } = {}
  ) {
    const docs = await this.find(filter).session(session);
    const results = [];

    for (const doc of docs) {
      if (!doc.isDeleted) {
        await doc.softDelete(deletedBy, { session });
        results.push(doc);
      }
    }

    return results;
  };

  // Static method: restore by ID
  schema.statics.restoreById = async function (
    id,
    restoredBy,
    { session } = {}
  ) {
    const doc = await this.findById(id).withDeleted().session(session);
    if (!doc) {
      throw new Error("Document not found");
    }
    return await doc.restore(restoredBy, { session });
  };

  // Static method: restore many
  schema.statics.restoreMany = async function (
    filter,
    restoredBy,
    { session } = {}
  ) {
    const docs = await this.find(filter).withDeleted().session(session);
    const results = [];

    for (const doc of docs) {
      if (doc.isDeleted) {
        await doc.restore(restoredBy, { session });
        results.push(doc);
      }
    }

    return results;
  };

  // Static method: find deleted by IDs
  schema.statics.findDeletedByIds = async function (ids, { session } = {}) {
    return await this.find({ _id: { $in: ids }, isDeleted: true }).session(
      session
    );
  };

  // Static method: count deleted
  schema.statics.countDeleted = async function (filter = {}) {
    return await this.countDocuments({ ...filter, isDeleted: true });
  };

  // Static method: ensure TTL index
  schema.statics.ensureTTLIndex = async function (expireAfterSeconds) {
    if (expireAfterSeconds === null || expireAfterSeconds === undefined) {
      // No TTL - never expires
      return;
    }

    try {
      await this.collection.createIndex(
        { deletedAt: 1 },
        {
          expireAfterSeconds,
          partialFilterExpression: { isDeleted: true },
        }
      );
      logger.info(
        `TTL index created for ${this.modelName}: ${expireAfterSeconds}s`
      );
    } catch (error) {
      logger.error(
        `Failed to create TTL index for ${this.modelName}: ${error.message}`
      );
    }
  };

  // Static method: get restore audit
  schema.statics.getRestoreAudit = async function (id) {
    const doc = await this.findById(id)
      .withDeleted()
      .populate("deletedBy", "firstName lastName email")
      .populate("restoredBy", "firstName lastName email");

    if (!doc) {
      return null;
    }

    return {
      _id: doc._id,
      isDeleted: doc.isDeleted,
      deletedAt: doc.deletedAt,
      deletedBy: doc.deletedBy,
      restoredAt: doc.restoredAt,
      restoredBy: doc.restoredBy,
    };
  };

  // Hard delete protection
  const blockHardDelete = function () {
    throw new Error(
      "Hard delete operations are not allowed. Use soft delete instead."
    );
  };

  schema.pre("deleteOne", blockHardDelete);
  schema.pre("deleteMany", blockHardDelete);
  schema.pre("findOneAndDelete", blockHardDelete);
  schema.pre("remove", blockHardDelete);
};

export default softDeletePlugin;
